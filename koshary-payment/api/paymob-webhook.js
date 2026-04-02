const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const PAYMOB_HMAC = process.env.PAYMOB_HMAC;

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

function verifySignature(rawBody, signature) {
    if (!PAYMOB_HMAC) return true;
    
    const hmac = crypto.createHmac('sha512', PAYMOB_HMAC);
    const expectedSignature = hmac.update(rawBody).digest('hex');
    
    return signature === expectedSignature;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    const signature = req.headers['paymob-signature'];
    const rawBody = JSON.stringify(req.body);
    
    if (!verifySignature(rawBody, signature)) {
        console.log('Invalid webhook signature');
        return res.status(401).send('Unauthorized');
    }

    const data = req.body;

    if (data.type === 'TRANSACTION_DONE') {
        const merchantOrderId = data.merchant_order_id;
        const amountCents = data.amount_cents;

        if (amountCents > 0) {
            try {
                await client.connect();
                const db = client.db('kosharygame');
                const orders = db.collection('orders');

                const order = await orders.findOne({ orderId: merchantOrderId });

                if (order && order.status !== 'paid') {
                    await orders.updateOne(
                        { orderId: merchantOrderId },
                        { $set: { status: 'paid', paidAt: new Date(), paymobId: data.id } }
                    );

                    const message = `
✅ <b>تم تأكيد الدفع تلقائياً!</b>

📋 رقم الطلب: <code>${merchantOrderId}</code>
👤 اللاعب: <code>${order.playerId}</code>
💰 العملات: ${order.amount}
💵 المبلغ: ${order.price} جنيه
🆔 Paymob ID: <code>${data.id}</code>

🎮 اللاعب هياخد العملات لما يفتح اللعبة.
                    `;

                    await sendTelegram(message);
                }

            } catch (error) {
                console.error('Webhook error:', error);
            } finally {
                await client.close();
            }
        }
    }

    res.sendStatus(200);
};
