const mongoose = require('../db/db');
const jwt = require('jsonwebtoken');

const secret_key = process.env.JWT_ACCESS_SECRET_KEY;

// Middleware to verify JWT
const isRightRole = (allowedRoles) => (req, res, next) => {
    const authHeader = req.headers.authorization; // Get Authorization header

    if (!authHeader) {
        return res.status(401).send('Authorization token required');
    }

    const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

    try {
        // Verify the token using the same secret key
        const decoded = jwt.verify(token, secret_key);
        
        // if (decoded.user_type !== 'admin') {
        //     return res.status(403).send('Access denied. Admins only.');
        // }

        // Check if user role is allowed
        if (allowedRoles && !allowedRoles.includes(decoded.user_type)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges.' });
        }

        req.user = decoded; // Attach decoded data (userId, user_type) to the request object
        next(); // Move to the next middleware or route handler
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
    }
};

module.exports = isRightRole;