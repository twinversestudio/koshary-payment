const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

const BOT_TOKEN = '8625080293:AAGVKgZyQcRrcBVPixLrJvjzOCMJf-m3L9Q';
const CHAT_ID = '8119274475';

async function sendTelegram(message) {
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Telegram error:', e);
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { playerId, amount, price } = req.body;

    if (!playerId || !amount || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = 'ORD-' + Date.now();

    try {
        // 1. Save to DB first
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        await orders.insertOne({
            orderId,
            playerId,
            amount: parseInt(amount),
            price: parseInt(price),
            status: 'pending',
            createdAt: new Date()
        });

        // 2. Auth with Paymob
        const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: PAYMOB_API_KEY })
        });
        
        const authData = await authRes.json();
        if (!authData.token) {
            throw new Error('Paymob auth failed: ' + JSON.stringify(authData));
        }

        // 3. Create Order
        const orderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authData.token,
                delivery_needed: false,
                amount_cents: price * 100,
                currency: 'EGP',
                merchant_order_id: orderId,
                items: []
            })
        });
        
        const orderData = await orderRes.json();
        if (!orderData.id) {
            throw new Error('Paymob order failed: ' + JSON.stringify(orderData));
        }

        // 4. Payment Key
        const paymentRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth_token: authData.token,
                amount_cents: price * 100,
                expiration: 3600,
                order_id: orderData.id,
                billing_data: {
                    first_name: 'Player',
                    last_name: playerId.substring(0, 10),
                    email: 'player@kosharygame.com',
                    phone_number: '01000000000',
                    apartment: 'NA',
                    floor: 'NA',
                    street: 'NA',
                    building: 'NA',
                    shipping_method: 'NA',
                    postal_code: 'NA',
                    city: 'Cairo',
                    country: 'EG',
                    state: 'Cairo'
                },
                currency: 'EGP',
                integration_id: parseInt(INTEGRATION_ID)
            })
        });
        
        const paymentData = await paymentRes.json();
        if (!paymentData.token) {
            throw new Error('Paymob payment key failed: ' + JSON.stringify(paymentData));
        }

        // 5. Telegram notification
        const message = `
🎮 <b>طلب جديد - كشري سيميوليتور!</b>

📋 رقم الطلب: <code>${orderId}</code>
👤 اللاعب: <code>${playerId}</code>
💰 العملات: ${amount}
💵 المبلغ: ${price} جنيه

⏳ <b>في انتظار الدفع...</b>
        `;
        await sendTelegram(message);

        // 6. Return token
        res.json({
            success: true,
            paymentToken: paymentData.token,
            orderId: orderId
            integrationId: parseInt(INTEGRATION_ID)
        });

    } catch (error) {
        console.error('Paymob error:', error);
        res.status(500).json({ error: 'Payment error: ' + error.message });
    } finally {
        await client.close();
    }
};
