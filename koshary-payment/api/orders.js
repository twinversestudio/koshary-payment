const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

module.exports = async (req, res) => {
    const { password } = req.query;

    if (password !== '0E6e40P6hOz4Ei4G') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await client.connect();
        const db = client.db('kosharygame');
        const orders = db.collection('orders');

        const allOrders = await orders.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

        res.json({ orders: allOrders });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        await client.close();
    }
};