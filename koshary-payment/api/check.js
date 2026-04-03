const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
    const { playerId } = req.query;

    if (!playerId) {
        return res.status(400).json({ error: 'Player ID required' });
    }

    try {
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        const cleanId = String(playerId).trim();

        const paidOrders = await orders.find({
            playerId: cleanId,
            status: 'paid',
            claimed: false
        }).toArray();

        const totalCoins = paidOrders.reduce((sum, order) => sum + order.amount, 0);

        // 🔥 علمهم إنهم اتاخدوا
        if (paidOrders.length > 0) {
            await orders.updateMany(
                {
                    playerId: cleanId,
                    status: 'paid',
                    claimed: false
                },
                {
                    $set: { claimed: true }
                }
            );
        }

        res.json({
            success: true,
            totalCoins: totalCoins,
            ordersCount: paidOrders.length
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
};
