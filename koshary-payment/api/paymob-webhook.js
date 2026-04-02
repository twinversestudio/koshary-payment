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

function verifyHmac(data, hmacSecret) {
    // Paymob HMAC calculation
    const fields = [
        data.amount_cents,
        data.created_at,
        data.currency,
        data.error_occured,
        data.has_parent_transaction,
        data.id,
        data.integration_id,
        data.is_3d_secure,
        data.is_auth,
        data.is_capture,
        data.is_refunded,
        data.is_standalone_payment,
        data.is_voided,
        data.order,
        data.owner,
        data.pending,
        data.source_data.pan,
        data.source_data.sub_type,
        data.source_data.type,
        data.success
    ].join('');

    const hmac = crypto.createHmac('sha512', hmacSecret);
    hmac.update(fields);
    return hmac.digest('hex');
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        const data = req.body;
        console.log('Webhook received:', JSON.stringify(data));

        // Verify HMAC if secret exists
        if (PAYMOB_HMAC && data.hmac) {
            const calculatedHmac = verifyHmac(data, PAYMOB_HMAC);
            if (calculatedHmac !== data.hmac) {
                console.log('HMAC mismatch');
                return res.status(401).send('Unauthorized');
            }
        }

        // Check if successful payment
        if (data.success === true || data.success === 'true') {
            const merchantOrderId = data.merchant_order_id || data.order?.merchant_order_id;
            const amountCents = data.amount_cents;

            if (!merchantOrderId || amountCents <= 0) {
                console.log('Invalid order data');
                return res.sendStatus(200);
            }

            await client.connect();
            const db = client.db('kosharygame');
            const orders = db.collection('orders');

            const order = await orders.findOne({ orderId: merchantOrderId });

            if (order && order.status !== 'paid') {
                await orders.updateOne(
                    { orderId: merchantOrderId },
                    { 
                        $set: { 
                            status: 'paid', 
                            paidAt: new Date(), 
                            paymobId: data.id?.toString(),
                            paymobData: data
                        } 
                    }
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
                console.log('Payment confirmed:', merchantOrderId);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    } finally {
        await client.close();
    }
};
