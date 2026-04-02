const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const BOT_TOKEN = '8625080293:AAGVKgZyQcRrcBVPixLrJvjzOCMJf-m3L9Q';
const CHAT_ID = '8119274475';

async function sendTelegram(message) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
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
  
  const orderId = 'ORD-' + Date.now();
  
  try {
    await client.connect();
    const db = client.db('kosharygame');
    const orders = db.collection('orders');
    
    await orders.insertOne({
      orderId,
      playerId,
      amount: parseInt(amount),
      price: parseInt(price),
      method,
      status: 'pending',
      createdAt: new Date()
    });
    
    const methodNames = {
      vodafone: '📱 فودافون كاش',
      instapay: '🏦 إنستا باي',
      telda: '💳 تيلدا',
      card: '💳 بطاقة بنكية'
    };
    
    const message = `
🎮 <b>طلب جديد - كشري سيميوليتور!</b>

📋 رقم الطلب: <code>${orderId}</code>
👤 اللاعب: <code>${playerId}</code>
💰 العملات: ${amount}
💵 المبلغ: ${price} جنيه
💳 الطريقة: ${methodNames[method] || method}

⏳ <b>في انتظار التأكيد...</b>

🔗 Dashboard:
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
