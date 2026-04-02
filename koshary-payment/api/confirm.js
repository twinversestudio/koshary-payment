const { MongoClient } = require('mongodb');
const fetch = require('node-fetch'); // ✅ ضفنا دي

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

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

    const { orderId, adminPassword } = req.body;

    if (adminPassword !== '0E6e40P6hOz4Ei4G') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        const order = await orders.findOne({ orderId: orderId, status: 'pending' });

        if (!order) {
            return res.status(404).json({ error: 'Order not found or already paid' });
        }

        await orders.updateOne(
            { orderId: orderId },
            { $set: { status: 'paid', confirmedAt: new Date() } }
        );

        const message = `
✅ <b>تم تأكيد الدفع!</b>

📋 رقم الطلب: <code>${orderId}</code>
👤 اللاعب: <code>${order.playerId}</code>
💰 العملات: ${order.amount}
💵 المبلغ: ${order.price} جنيه

🎮 اللاعب هياخد العملات لما يفتح اللعبة.
    `;

        await sendTelegram(message);

        res.json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
};