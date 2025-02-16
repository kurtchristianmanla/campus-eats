const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const upload = require('../middleware/upload');
const User = require('../models/user');

const router = express.Router();

// Route to fetch user profile
router.get('/profile', async (req, res) => {

    try {
        // Find the user in the database using the decoded user ID
        const user = await User.findById(req.user.user_id).select('-password'); // Exclude password field for security
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to update user profile
router.put('/profile', upload.single('profile_picture'), async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if the new username already exists (excluding the current user)
        if (req.body.username && req.body.username !== user.username) {
            const existingUsername = await User.findOne({ username: req.body.username });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username is already taken.' });
            }
        }

        // Check if the new email already exists (excluding the current user)
        if (req.body.email && req.body.email !== user.email) {
            const existingEmail = await User.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email is already taken.' });
            }
        }

        // Check if the new email already exists (excluding the current user)
        if (req.body.store_name && req.body.store_name !== user.store_name) {
            const existingStore = await User.findOne({ store_name: req.body.store_name });
            if (existingStore) {
                return res.status(400).json({ message: 'Store Name is already taken.' });
            }
        }

        if (req.user.user_type === 'seller') {
            user.store_name = req.body.store_name ?? user.store_name;
        }

        // Update user details
        user.first_name = req.body.first_name ?? user.first_name;
        user.last_name = req.body.last_name ?? user.last_name;
        user.username = req.body.username ?? user.username;
        user.email = req.body.email ?? user.email;

        const oldImagePath = user.profile_picture;
        // If a profile picture is uploaded, update it

        if (req.file) {
            try {
                const outputDir = path.join(__dirname, '../uploads/profiles');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const newImagePath = path.join(outputDir, req.file.filename);
                console.log('Resizing image to:', newImagePath);

                await sharp(req.file.path)
                    .resize(1000, 1000)
                    .toFile(newImagePath);
                console.log('Image resized successfully');
                user.profile_picture = `/uploads/profiles/${req.file.filename}`; // Save image URL (relative path)
            } catch (err) {
                console.error('Error processing image with sharp:', err);
                return res.status(500).json({ message: 'Error processing image' });
            }
        }

        if (oldImagePath && req.file) {
            try {
                const oldImageFullPath = path.join(__dirname, '../', oldImagePath); // Use relative path to build the full path
                fs.unlink(oldImageFullPath, (err) => {
                    if (err) {
                        console.error('Error deleting old image:', err);
                    } else {
                        console.log('Old image deleted');
                    }
                });
            } catch (err) {
                console.error('Error resolving old image path:', err);
            }
        }

        await user.save();
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Route to change password
router.put('/change-password', async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    console.log(' Pasword from client: ', { currentPassword, newPassword });

    try {
        // Find the user by username
        const user = await User.findById(req.user.user_id);

        if (!user) {
            return res.status(404).send('User not found');
        }

        console.log('User found in database:', user);
        
        // Compare password with stored hash
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        console.log('Password comparison result:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Old password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error during password change:', error);

        // If the error is a Mongoose ValidationError (password validation error)
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: validationErrors.join(', ') });
        }

        res.status(500).send('An error occurred');
    }
});

module.exports = router;
