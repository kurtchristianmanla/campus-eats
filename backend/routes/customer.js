const express = require('express');
const router = express.Router();
const isRightRole = require('../middleware/auth');
const profileRoutes = require('../utils/profileroutes'); 
const User = require('../models/user');
const Counter = require('../models/usercounter');
const Transaction = require('../models/transaction');
const MenuItem = require('../models/menuitem');
const { generateTransactionId } = require('../utils/transacutils');

// Route to fetch user profile
router.use(isRightRole(['customer']), profileRoutes);

// API Routes
router.get('/find-sellers', isRightRole(['customer']), async (req, res) => {
    try {
    //   const users = await User.find();
        const users = await User.find({
            user_type: 'seller',  // Only sellers
            // is_selling: true       // Sellers who are currently selling
        }).select('_id store_name is_selling user_type email profile_picture seller_rating');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// API Routes
router.get('/find-items', isRightRole(['customer']), async (req, res) => {
    try {
        const highRatedItems = await MenuItem.find({
            averageRating: { $gte: 4, $lte: 5 }, // Filter only 4 to 5 star ratings
            // isAvailable: true, // Only show available items
        });

        if (!highRatedItems.length) {
            return res.status(404).json({ message: 'No high-rated menu items found' });
        }

        res.json(highRatedItems);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Route to Fetch Multiple Items by IDs
router.post('/get-items', isRightRole(['customer']), async (req, res) => {
    try {
        const { ids } = req.body; // Expecting: { ids: ["id1", "id2", ...] }

        // Extract IDs from objects
        const itemIds = ids.map(item => item._id);

        // Validate extracted IDs
        if (!itemIds.length) {
            return res.status(400).json({ message: 'No valid IDs provided' });
        }

        const items = await MenuItem.find({ _id: { $in: ids } }); // MongoDB query
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
    }
});

module.exports = router;
