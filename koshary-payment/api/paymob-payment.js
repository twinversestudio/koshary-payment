const axios = require('axios');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PUBLIC_KEY = process.env.PAYMOB_PUBLIC_KEY;

const fetch = require('node-fetch');

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

    const { playerId, amount, price, method } = req.body;

    if (!playerId || !amount || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = 'ORD-' + Date.now();
    const priceInCents = price * 100;

    try {
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

        const authResponse = await axios.post('https://accept.paymob.com/v1/auth/token', {
            api_key: PAYMOB_API_KEY
        });

        const authToken = authResponse.data.token;

        const orderResponse = await axios.post('https://accept.paymob.com/v1/ecommerce/orders', {
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: priceInCents,
            currency: 'EGP',
            merchant_order_id: orderId
        });

        const paymobOrderId = orderResponse.data.id;

        const paymentKeyResponse = await axios.post('https://accept.paymob.com/v1/acceptance/post_pay', {
            auth_token: authToken,
            amount_cents: priceInCents,
            expiration: 3600,
            order_id: paymobOrderId,
            billing_data: {
                apartment: 'NA',
                email: 'player@unity.com',
                floor: 'NA',
                first_name: playerId,
                street: 'NA',
                building: 'NA',
                phone_number: 'NA',
                shipping_method: 'NA',
                postal_code: 'NA',
                city: 'NA',
                country: 'EG',
                last_name: 'NA',
                state: 'NA'
            },
            currency: 'EGP'
        });

        const paymentToken = paymentKeyResponse.data.token;

        const message = `
🎮 <b>طلب جديد - كشري سيميوليتور!</b>

📋 رقم الطلب: <code>${orderId}</code>
👤 اللاعب: <code>${playerId}</code>
💰 العملات: ${amount}
💵 المبلغ: ${price} جنيه

⏳ <b>في انتظار الدفع...</b>
        `;

        await sendTelegram(message);

        res.json({
            success: true,
            paymentToken: paymentToken,
            orderId: orderId,
            publicKey: PUBLIC_KEY
        });

    } catch (error) {
        console.error('Paymob error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Payment error: ' + (error.response?.data?.message || error.message) });
    } finally {
        await client.close();
    }
};
