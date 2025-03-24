const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const isRightRole = require('../middleware/auth');
const profileRoutes = require('../utils/profileroutes'); 
const User = require('../models/user');
const Counter = require('../models/usercounter');
const Transaction = require('../models/transaction');
const MenuItem = require('../models/menuitem');
const Order = require('../models/order');
const { hybridRecommendations } = require('../utils/recommendationlogic');

// Route to fetch user profile
router.use(isRightRole(['customer']), profileRoutes);

// API Routes
router.get('/find-sellers', isRightRole(['customer']), async (req, res) => {
    try {
        // Fetch sellers with their completed order count
        const sellers = await User.aggregate([
            {
                $match: {
                    user_type: 'seller', // Only sellers
                    // is_selling: true // Optional: Only sellers who are currently selling
                },
            },
            {
                $lookup: {
                    from: 'orders', // Join with the orders collection
                    localField: '_id', // User _id (sellerId)
                    foreignField: 'sellerId', // Order sellerId
                    as: 'orders', // Store the joined orders in 'orders'
                },
            },
            {
                $addFields: {
                    completedOrderCount: {
                        $size: {
                            $filter: {
                                input: '$orders',
                                as: 'order',
                                cond: { $eq: ['$$order.status', 'completed'] }, // Filter completed orders
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    store_name: 1,
                    is_selling: 1,
                    user_type: 1,
                    email: 1,
                    profile_picture: 1,
                    seller_rating: 1,
                    completedOrderCount: 1, // Include completed order count
                },
            },
        ]);
        res.json(sellers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// API Routes
router.get('/find-items', isRightRole(['customer']), async (req, res) => {
    try {
        // Fetch high-rated items (4 to 5 stars)
        const highRatedItems = await MenuItem.aggregate([
            {
                $match: {
                    averageRating: { $gte: 4, $lte: 5 }, // Filter only 4 to 5 star ratings
                    isAvailable: true, // Only show available items
                },
            },
            {
                $lookup: {
                    from: 'productratings', // Join with the ratings collection
                    localField: '_id', // MenuItem _id
                    foreignField: 'productId', // Rating productId
                    as: 'reviews', // Store the joined reviews in 'reviews'
                },
            },
            {
                $addFields: {
                    reviewCount: { $size: '$reviews' }, // Add reviewCount field
                },
            },
            {
                $limit: 5, // Limit to 5 high-rated items
            },
        ]);

        // Fetch most ordered items
        const mostOrderedItems = await MenuItem.aggregate([
            {
                $lookup: {
                    from: 'orders', // Join with the orders collection
                    localField: '_id', // MenuItem _id
                    foreignField: 'items.productId', // Order items.productId
                    as: 'orders', // Store the joined orders in 'orders'
                },
            },
            {
                $addFields: {
                    orders: {
                        $filter: {
                            input: '$orders', // Filter the joined orders
                            as: 'order',
                            cond: { $eq: ['$$order.status', 'completed'] }, // Only include completed orders
                        },
                    },
                    orderCount: { $size: '$orders' }, // Count the filtered orders
                },
            },
            {
                $match: { orderCount: { $gt: 0 } }, // Filter out items with no orders
            },
            {
                $sort: { orderCount: -1 }, // Sort by order count in descending order
            },
            {
                $limit: 5, // Limit to top 10 most ordered items
            },
        ]);

        if (!highRatedItems.length && !mostOrderedItems.length) {
            return res.status(404).json({ message: 'No high-rated or most ordered menu items found' });
        }

        res.json({ highRatedItems, mostOrderedItems });
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

// Route to Get Hybrid Recommendations
router.get('/recommendations', isRightRole(['customer']), async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Fetch the user's most recent orders (excluding cancelled orders)
        const recentOrders = await Order
            .find({ customerId: userId, status: { $ne: 'cancelled' } }) // Exclude cancelled orders
            .sort({ createdAt: -1 }) // Sort by most recent
            .populate('items.productId', '_id name price imageUrl') // Populate productId
            .limit(5) // Fetch the last 5 orders
            .lean();

        if (!recentOrders || recentOrders.length === 0) {
            return res.status(404).json({ message: 'No orders found' });
        }

        console.log('Recent Orders:', recentOrders);

        // Find the first order with at least one valid productId
        let validOrder = null;
        let validItem = null;

        for (const order of recentOrders) {
            validItem = order.items.find(item => item.productId && item.productId._id);
            if (validItem) {
                validOrder = order;
                break; // Exit the loop once a valid order is found
            }
        }

        if (!validOrder || !validItem) {
            return res.status(404).json({ message: 'No valid product ID found in any recent orders' });
        }

        const itemId = validItem.productId._id;

        // Fetch necessary data
        const orders = await Order.find({ status: { $in: ['ready', 'completed'] } });
        const menuItems = await MenuItem.find({});

        // Get hybrid recommendations
        const recommendations = hybridRecommendations(userId, itemId, orders, menuItems);

        // Fetch details of recommended items
        const recommendedItems = await MenuItem
            .find({ _id: { $in: recommendations } })
            .populate('sellerId', 'username store_name is_selling');

        res.json({recommendedItems, lastOrder: validOrder});
    } catch (error) {
        console.error('Error fetching recommended items:', error);
        res.status(500).json({ message: 'Error fetching recommendations', error: error.message || error });
    }    
});

module.exports = router;
