const { MongoClient } = require('mongodb');

// ??????? ?? MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// ?????? ???
const BOT_TOKEN = '8625080293:AAGVKgZyQcRrcBVPixLrJvjzOCMJf-m3L9Q';
const CHAT_ID = '8119274475';

async function sendTelegram(message) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        })
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { playerId, amount, price, method } = req.body;

    // ???? ??? ??? ????
    const orderId = 'ORD-' + Date.now();

    try {
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        // ???? ?????
        await orders.insertOne({
            orderId,
            playerId,
            amount: parseInt(amount),
            price: parseInt(price),
            method,
            status: 'pending',
            createdAt: new Date()
        });

        // ??? ????? ??? ??? ??????
        const methodNames = {
            vodafone: '?? ??????? ???',
            instapay: '?? ????? ???',
            telda: '?? ?????',
            card: '?? ????? ?????'
        };

        const message = `
?? <b>??? ???? - ???? ??????????!</b>

?? ??? ?????: <code>${orderId}</code>
?? ??????: <code>${playerId}</code>
?? ???????: ${amount}
?? ??????: ${price} ????
?? ???????: ${methodNames[method] || method}

? <b>?? ?????? ???????...</b>

???? ???:
https://koshary-game.vercel.app/dashboard
    `;

        await sendTelegram(message);

        res.json({ success: true, orderId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
};