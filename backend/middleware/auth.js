const mongoose = require('../db/db');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Import the User model
const client = require('../middleware/redisclient');

const secret_key = process.env.JWT_ACCESS_SECRET_KEY;

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

// Middleware to verify JWT
const isRightRole = (allowedRoles) => async (req, res, next) => {
    const authHeader = req.headers.authorization; // Get Authorization header

    if (!authHeader) {
        return res.status(401).send('Authorization token required');
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
    const sessionToken = req.headers['x-session-token'];

    if (!sessionToken) {
        return res.status(401).json({ message: 'Session token is required' });
    }

    try {
        // Verify the token using the same secret key
        const decoded = jwt.verify(token, secret_key);

        // Check if user role is allowed
        if (allowedRoles && !allowedRoles.includes(decoded.user_type)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges.' });
        }

        // Find the user in the database
        const user = await User.findById(decoded.user_id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the session token matches the one in the database
        if (user.sessionToken !== sessionToken) {
            return res.status(401).json({ message: 'Session expired or invalid' });
        }

        // Check if the token is blacklisted
        const isBlacklisted = await isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(403).json({ message: 'Token is blacklisted' });
        }

        req.user = decoded; // Attach decoded data (userId, user_type) to the request object
        next(); // Move to the next middleware or route handler
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

module.exports = isRightRole;