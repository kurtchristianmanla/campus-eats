const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/user');
const Counter = require('../models/usercounter');
const VerificationCode = require('../models/emailverification');
const { sendVerificationCode } = require('../utils/emailservice');
const { sendResetEmail } = require('../utils/forgotpassword');
const ResetToken = require('../models/resettoken');
const client = require('../middleware/redisclient');
require('dotenv').config();

const access_secret = process.env.JWT_ACCESS_SECRET_KEY;
const refresh_secret = process.env.JWT_REFRESH_SECRET_KEY;
const app_address = process.env.FRONTEND_URL;

const generateTokens = (user) => {
    const access_token = jwt.sign(
        { user_id: user._id, user_type: user.user_type, username: user.username },
        access_secret,  // Store secrets in environment variables
        { expiresIn: '15m' }  // Short-lived access token
    );

    const refresh_token = jwt.sign(
        { user_id: user._id, user_type: user.user_type, username: user.username },
        refresh_secret,
        { expiresIn: '7d' }  // Long-lived refresh token
    );

    return { access_token, refresh_token };
};

// Add token to Redis blacklist
const addToBlacklist = async (token) => {
    try {
        await client.set(token, 'invalid', 'EX', 7 * 24 * 60 * 60); // Expire after 7 days
    } catch (error) {
        console.error("Redis error:", error);
    }
};

// Check if token is in Redis blacklist
const isTokenBlacklisted = async (token) => {
    try {
        const result = await client.get(token);
        return result === 'invalid';
    } catch (error) {
        console.error("Redis error:", error);
        return false;
    }
};

// Generate a random 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code
router.post('/send-verification-code', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Check if email already exists in the users collection
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        
        // Generate a new verification code
        const code = generateVerificationCode();
        
        // Delete any existing codes for this email
        await VerificationCode.deleteMany({ email });
        
        // Create new verification code document
        const verificationCode = new VerificationCode({
            email,
            code
        });
        
        // Save the verification code
        await verificationCode.save();
        
        // Send verification code email
        await sendVerificationCode(email, code);
        
        res.status(200).json({ 
            message: 'Verification code sent to your email',
            expiresIn: 3600 // 1 hour in seconds
        });
        
    } catch (error) {
        console.error('Error sending verification code:', error);
        res.status(500).json({ message: 'Failed to send verification code', error: error.message });
    }
});

// Verify email code
router.post('/verify-email-code', async (req, res) => {
    try {
        const { email, code } = req.body;
        
        if (!email || !code) {
            return res.status(400).json({ message: 'Email and verification code are required' });
        }
        
        // Find the verification code
        const verificationRecord = await VerificationCode.findOne({ email, code });
        
        if (!verificationRecord) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }
        
        // Optional: Delete the verification code after successful verification
        await VerificationCode.deleteOne({ _id: verificationRecord._id });
        
        res.status(200).json({ 
            message: 'Email verified successfully',
            verified: true
        });
        
    } catch (error) {
        console.error('Error verifying code:', error);
        res.status(500).json({ message: 'Failed to verify code', error: error.message });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Email and Pasword from client: ', { email, password });

    try {
        // Find the user by username
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send('User not found');
        }

        console.log('User found in database:', user);
        
        // Compare password with stored hash
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', isMatch);

        if (!isMatch) {
            return res.status(401).send('Invalid credentials');
        }

        const { access_token, refresh_token } = generateTokens(user);
        
        // Update the last_login field
        user.last_login = new Date();
        await User.updateOne({ _id: user._id }, { last_login: user.last_login });

        console.log('User ID and last login time:', user._id, user.last_login);
        console.log('Setting refresh token cookie:', refresh_token);

        // Store refresh token in HTTP-only cookie
        res.cookie('refreshToken', refresh_token, {
            httpOnly: true,  // Prevent XSS
            secure: true, // Set to true if using HTTPS
            sameSite: 'None',  // Use 'Lax' for development
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days expiration
        }); 

        res.json({ message: 'Login successful', access_token, user_type: user.user_type });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('An error occurred');
    }
});

router.post('/refresh', async (req, res) => {
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    console.log('Refresh Token:', req.cookies.refreshToken);
    const refreshToken = req.cookies.refreshToken;

    try {
        if (!refreshToken) {
            console.log('No refresh token found in cookies');
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        const isBlacklisted = await isTokenBlacklisted(refreshToken);
        if (isBlacklisted) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }
    
        jwt.verify(refreshToken, refresh_secret, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
    
            const newAccessToken = jwt.sign(
                { user_id: user.user_id, user_type: user.user_type },
                access_secret,
                { expiresIn: "15m" }
            );
    
            res.json({ access_token: newAccessToken });
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// User Registration
router.post('/register', async (req, res) => {
    const { first_name, last_name, store_name, username, user_type, email, password, isVerified } = req.body;
    console.log('Received data:', { first_name, last_name, store_name, username, user_type, email, password });

    try {
        // Check if email verification was completed
        if (!isVerified) {
            return res.status(400).json({ message: 'Email verification is required' });
        }

        // Check if the username or email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            // return res.status(400).send('Email already exists');
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // If no username is provided, assign a placeholder username (user 1, user 2, etc.)
        let finalUsername = username; // Default to the provided username

        if (!finalUsername) {
            // Get the next available username from the counter
            const counter = await Counter.findOneAndUpdate(
                { _id: 'user_id' }, // Find the counter document
                { $inc: { sequence_value: 1 } }, // Increment the sequence
                { new: true, upsert: true  } // Return the updated counter document
            ); 

            if (!counter) {
                return res.status(500).json({ success: false, message: 'Failed to get username counter' });
            }

            // Generate the username (e.g., user 1, user 2, etc.)
            finalUsername = `User ${counter.sequence_value}`;
        }

        // Check if the username already exists (for custom username)
        const usernameExists = await User.findOne({ username: finalUsername });
        if (usernameExists) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        // Create a new user document
        const newUser = new User({
            first_name,
            last_name,
            store_name,
            username: finalUsername,
            password,
            user_type,
            email,
            balance: 0, // Assuming balance starts at 0
            created_at: new Date(),
            last_login: null
        });

        // Save the new user to the database
        console.log(newUser);
        await newUser.save();
            // .catch(err => {
            //     console.error(err.message); // Check error details
            // });
        console.log('User registered successfully:', newUser);

        // Return a JSON response
        res.status(201).json({ 
            success: true,
            message: 'User registered successfully',
            userId: newUser._id 
        });
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

router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token found" });
        }

        await addToBlacklist(refreshToken).catch(err => {
            console.error("Failed to blacklist token:", err);
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            path: '/',
        });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

        // Save the token in the database
        await ResetToken.create({ email, token, expiresAt });

        // Send the token as a link in the email
        const resetLink = `${app_address}/reset-password?token=${token}`;
        await sendResetEmail(email, resetLink);

        res.status(200).json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('Error sending reset link:', error);
        res.status(500).json({ message: 'Failed to send reset link', error: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Find the token in the database
        const resetToken = await ResetToken.findOne({ token });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Find the user by email
        const user = await User.findOne({ email: resetToken.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the user's password
        user.password = newPassword;
        await user.save();

        // Delete the token
        await ResetToken.deleteOne({ token });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});

module.exports = router;