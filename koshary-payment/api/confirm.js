const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const BOT_TOKEN = '8625080293:AAGVKgZyQcRrcBVPixLrJvjzOCMJf-m3L9Q';

async function sendTelegram(chatId, message) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderId, adminPassword } = req.body;

    // ???? ?? ???????? (???? ??????? ???!)
    if (adminPassword !== 'koshary123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        // ??? ?????
        const result = await orders.findOneAndUpdate(
            { orderId: orderId, status: 'pending' },
            { $set: { status: 'paid', confirmedAt: new Date() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ error: 'Order not found or already paid' });
        }

        // ??? ????? ???? ?? ????? ??
        const message = `
? <b>?? ????? ?????!</b>

?? ??? ?????: <code>${orderId}</code>
?? ??????: <code>${result.playerId}</code>
?? ???????: ${result.amount}

?????? ????? ??????? ??? ???? ??????.
    `;

        await sendTelegram(process.env.CHAT_ID || 'YOUR_CHAT_ID', message);

        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
};