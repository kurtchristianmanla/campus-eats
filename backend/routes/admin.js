const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const crypto = require('crypto');

const upload = require('../middleware/upload');
const isRightRole = require('../middleware/auth'); 
const mongoose = require('../db/db');

const User = require('../models/user');
const Counter = require('../models/usercounter');
const MenuItem = require('../models/menuitem');
const Transaction = require('../models/transaction');

const { generateTransactionId } = require('../utils/transacutils');
const { sendSellerVerificationEmail } = require('../utils/emailservice'); 
const profileRoutes = require('../utils/profileroutes'); 

const jwt = require('jsonwebtoken');
const secret_key = process.env.JWT_SECRET_KEY;
const app_address = process.env.FRONTEND_URL;

// API Routes
router.get('/accounts', isRightRole(['admin']), async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

// DELETE route for deleting a user by userId
router.delete('/accounts/:userId', isRightRole(['admin']), async (req, res) => {
    const { userId } = req.params; // Access the userId from the URL parameter

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is a seller
        if (user.user_type === 'seller') {
            // Delete all menu items associated with the seller
            await MenuItem.deleteMany({ sellerId: userId });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        res.status(200).json({ message: 'User and associated menu items (if any) deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Failed to delete the user' });
    }
});

// Seller Registration
router.post('/addseller', isRightRole(['admin']), async (req, res) => {
    const { first_name, last_name, store_name, is_selling, username, user_type, email, password } = req.body;
    console.log('Received data:', { first_name, last_name, store_name, is_selling, username, user_type, email, password });

    try {
        // Check if the username or email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // return res.status(400).send('Email already exists');
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Check if the username already exists (for custom username)
        const usernameExists = await User.findOne({ username });

        if (usernameExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Update the counter
        const counter = await Counter.findOneAndUpdate(
            { _id: 'user_id' }, // Find the counter document
            { $inc: { sequence_value: 1 } }, // Increment the sequence
            { new: true, upsert: true  } // Return the updated counter document
        ); 

        // Generate verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        // Create a new user document
        const newUser = new User({
            first_name,
            last_name,
            store_name,
            is_selling,
            username,
            password,
            user_type,
            email,
            balance: 0, // Assuming balance starts at 0
            created_at: new Date(),
            last_login: null,
            seller_rating: null,
            isVerified: false, // Add verification status
            verificationToken,
            verificationTokenExpires
        });

        await newUser.save();

        const verificationUrl = `${app_address}/verify-seller?token=${verificationToken}`;
        await sendSellerVerificationEmail(email, verificationUrl);

        console.log('User registered successfully:', newUser);

        res.send('User registered successfully');
    } catch (error) {
        console.error('Error registering user:', error);

        // If the error is a Mongoose ValidationError (password validation error)
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ success: false, message: validationErrors.join(', ') });
        }

        res.status(500).send('Error registering user');
    }
});

router.get('/search-user', isRightRole(['admin']), async (req, res) => {
    const { query } = req.query; // Extract the search query from query parameters

    console.log(query);

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        // Search for a user by username or email (case-insensitive)
        const user = await User.findOne({
            $or: [
                { username: { $regex: `^${query}$` } },
                { email: { $regex: `^${query}$` } },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the relevant user data
        return res.json({
            id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            profile_picture: user.profile_picture,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST route for top-up
router.post('/top-up', isRightRole(['admin']), async (req, res) => {
    const { query, amount } = req.body;
    console.log(req.body);
  
    if (!query|| !amount) {
      return res.status(400).json({ message: 'Username/email and amount are required.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
  
     // Find the user by username or email
    try {
        const user = await User.findOne({ _id: query }).session(session);

        console.log(user);

        if (!user) {
            throw new Error('User not found.');
        }

        // Ensure the amount is a positive number
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero.');
        }

        // Update the user's balance
        user.balance += amount;

        // Generate transaction ID
        const transactionId = await generateTransactionId();

        const transaction = new Transaction({
            transactionId,
            user: user._id,
            type: 'top-up',
            amount,
            status: 'completed',
            userBalanceAfter: user.balance,
        });
        
        // Save the updated user and transaction
        await user.save({ session });
        await transaction.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        req.io.emit('updateBalance', { balance: user.balance, userId: user._id });

        console.log("emitted updateBalance");

        // Respond with the updated balance
        res.status(200).json({
            message: 'Top-up successful!',
            balance: user.balance.toFixed(2),  // Ensure balance is in decimal format
        });
    } catch (error) {
        // Abort the transaction on error
        await session.abortTransaction();
        session.endSession();
        console.error('Error during top-up:', error);
        res.status(500).json({ message: error.message || 'An error occurred while processing the top-up.' });
    }
});

// POST route for cash out
router.post('/cashout', isRightRole(['admin']), async (req, res) => {
    const { query, amount } = req.body;
    console.log(req.body);
  
    if (!query|| !amount) {
      return res.status(400).json({ message: 'Username/email and amount are required.' });
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
  
     // Find the user by username or email
    try {
        const user = await User.findOne({ _id: query }).session(session);

        console.log(user);

        if (!user) {
            throw new Error('User not found.');
        }

        // Ensure the amount is a positive number
        if (amount <= 0) {
            throw new Error('Amount must be greater than zero.');
        }

        // Check if the user has sufficient balance for the cash out
        if (user.balance < amount) {
            throw new Error('Insufficient balance for cash out.');
        }

        // Update the user's balance
        user.balance -= amount;

        // Generate transaction ID
        const transactionId = await generateTransactionId();

        // Create a new transaction record
        const transaction = new Transaction({
            transactionId,
            user: user._id,
            type: 'cashout',
            amount,
            status: 'completed',
            userBalanceAfter: user.balance,
        });

        // Save the updated user and transaction
        await user.save({ session });
        await transaction.save({ session });

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        req.io.emit('updateBalance', { balance: user.balance, userId: user._id });

        // Respond with the updated balance
        res.status(200).json({
            message: 'Cash out successful!',
            balance: user.balance.toFixed(2),  // Ensure balance is in decimal format
        });
    } catch (error) {
        // Abort the transaction on error
        await session.abortTransaction();
        session.endSession();
        console.error('Error during cash out:', error);
        res.status(500).json({ message: error.message || 'An error occurred while processing the cashout.' });
    }
});

// Route to fetch all transactions
router.get('/transactions', isRightRole(['admin']), async (req, res) => {
    try {
        // Fetch transactions and populate the 'user' field
        const transactions = await Transaction.find()
            .populate({
                path: 'user',
                select: 'first_name last_name username',
            })
            .lean(); // Use lean() on the main query for better performance

        // Map through transactions and handle missing users
        const formattedTransactions = transactions.map(transaction => ({
            ...transaction,
            user: transaction.user || {
                first_name: 'Account',
                last_name: 'Deleted',
                username: 'Account Deleted'
            }
        }));

        res.json(formattedTransactions);
    } catch (err) {
        console.error("Error fetching transactions:", err.message, err.stack);
        res.status(500).json({ message: "Server error" });
    }
});

// Route to fetch user profile
router.use(isRightRole(['admin']), profileRoutes);


module.exports = router;