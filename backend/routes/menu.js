const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const MenuItem = require('../models/menuitem');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const isRightRole = require('../middleware/auth');
// const cloudinary = require('cloudinary').v2;
const cloudinary = require('../middleware/cloudinary');

// Add a new menu item
router.post('/add', upload.single('imageUrl'), isRightRole(['seller']), async (req, res) => {
    try {
        const { name, minPrepTime, maxPrepTime, price, description, isAvailable, sellerId } = req.body;

        // Check if all required fields are present
        if (!name || !minPrepTime || !maxPrepTime || !price || isAvailable === undefined || !sellerId) {
            return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
        }

        const newItem = new MenuItem({
            sellerId,
            name,
            minPrepTime,
            maxPrepTime,
            description,
            price,
            isAvailable
        });

        // Handle image upload and resizing
        // if (req.file) {
        //     try {
        //         const outputDir = path.join(__dirname, '../uploads/products');
        //         if (!fs.existsSync(outputDir)) {
        //             fs.mkdirSync(outputDir, { recursive: true });
        //         }

        //         const newImagePath = path.join(outputDir, req.file.filename);
        //         console.log('Resizing image to:', newImagePath);

        //         // Get image metadata (width, height)
        //         const metadata = await sharp(req.file.path).metadata();

        //         // Calculate 95% dimensions
        //         const cropWidth = Math.round(metadata.width * 0.95);
        //         const cropHeight = Math.round(metadata.height * 0.95);

        //         await sharp(req.file.path)
        //             .extract({
        //                 left: Math.round((metadata.width - cropWidth) / 2), // Center crop horizontally
        //                 top: Math.round((metadata.height - cropHeight) / 2), // Center crop vertically
        //                 width: cropWidth,
        //                 height: cropHeight,
        //             })
        //             .toFile(newImagePath);
        //         console.log('Image cropped successfully');
        //         newItem.imageUrl = `/uploads/products/${req.file.filename}`; // Save image URL (relative path)
        //     } catch (err) {
        //         console.error('Error processing image with sharp:', err);
        //         return res.status(500).json({ message: 'Error processing image' });
        //     }
        // }

        // Handle image upload to Cloudinary
        if (req.file) {
            try {
                // Resize and crop the image using sharp
                const resizedImageBuffer = await sharp(req.file.buffer)
                    .resize(800, 800, { fit: 'inside' }) // Resize to fit within 800x800
                    .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
                    .toBuffer();

                // Upload the resized image to Cloudinary
                const cloudinaryResponse = await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`,
                    {
                        folder: 'menu_items', // Optional: Organize images in a folder
                        resource_type: 'image',
                    }
                );

                // Save the Cloudinary image URL to the new menu item
                newItem.imageUrl = cloudinaryResponse.secure_url;
            } catch (err) {
                console.error('Error uploading image to Cloudinary:', err);
                return res.status(500).json({ message: 'Error uploading image' });
            }
        }

        const savedItem = await newItem.save();

        req.io.emit('menuAdded', { newItem: savedItem, sellerId: savedItem.sellerId });

        res.status(201).json({ success: true, message: 'Menu item added successfully', menuItem: newItem });
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Update an existing menu item
router.put('/update/:id', upload.single('imageUrl'), isRightRole(['seller']), async (req, res) => {
    try {
        const { id } = req.params;
        // const updates = req.body;

        const item = await MenuItem.findById( id ); 

        item.name = req.body.name ?? item.name;
        item.minPrepTime = req.body.minPrepTime ?? item.minPrepTime;
        item.maxPrepTime = req.body.maxPrepTime ?? item.maxPrepTime;
        item.description = req.body.description ?? item.description;
        item.price = req.body.price ?? item.price;
        item.isAvailable = req.body.isAvailable ?? item.isAvailable;

        console.log(req.body.imageUrl);
        const oldImagePath = item.imageUrl;
        // If a profile picture is uploaded, update it

        // if (req.file) {
        //     try {
        //         const outputDir = path.join(__dirname, '../uploads/products');
        //         if (!fs.existsSync(outputDir)) {
        //             fs.mkdirSync(outputDir, { recursive: true });
        //         }

        //         const newImagePath = path.join(outputDir, req.file.filename);
        //         console.log('Resizing image to:', newImagePath);

        //         // Get image metadata (width, height)
        //         const metadata = await sharp(req.file.path).metadata();

        //         // Calculate 95% dimensions
        //         const cropWidth = Math.round(metadata.width * 0.95);
        //         const cropHeight = Math.round(metadata.height * 0.95);

        //         await sharp(req.file.path)
        //             .extract({
        //                 left: Math.round((metadata.width - cropWidth) / 2), // Center crop horizontally
        //                 top: Math.round((metadata.height - cropHeight) / 2), // Center crop vertically
        //                 width: cropWidth,
        //                 height: cropHeight,
        //             })
        //             .toFile(newImagePath);
        //         console.log('Image cropped successfully');
        //         item.imageUrl = `/uploads/products/${req.file.filename}`; // Save image URL (relative path)
        //     } catch (err) {
        //         console.error('Error processing image with sharp:', err);
        //         return res.status(500).json({ message: 'Error processing image' });
        //     }
        // }

        // if (oldImagePath && req.file) {
        //     try {
        //         const oldImageFullPath = path.join(__dirname, '../', oldImagePath); // Use relative path to build the full path
        //         fs.unlink(oldImageFullPath, (err) => {
        //             if (err) {
        //                 console.error('Error deleting old image:', err);
        //             } else {
        //                 console.log('Old image deleted');
        //             }
        //         });
        //     } catch (err) {
        //         console.error('Error resolving old image path:', err);
        //     }
        // }

        // Handle image upload to Cloudinary
        if (req.file) {
            try {
                // Resize and crop the image using sharp
                const resizedImageBuffer = await sharp(req.file.buffer)
                    .resize(800, 800, { fit: 'inside' }) // Resize to fit within 800x800
                    .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
                    .toBuffer();

                // Upload the resized image to Cloudinary
                const cloudinaryResponse = await cloudinary.uploader.upload(
                    `data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`,
                    {
                        folder: 'menu_items', // Optional: Organize images in a folder
                        resource_type: 'image',
                    }
                );

                // Delete the old image from Cloudinary if it exists
                if (item.imageUrl) {
                    const publicId = item.imageUrl.split('/').pop().split('.')[0]; // Extract public ID from URL
                    await cloudinary.uploader.destroy(`menu_items/${publicId}`);
                }

                // Save the new Cloudinary image URL
                item.imageUrl = cloudinaryResponse.secure_url;
            } catch (err) {
                console.error('Error uploading image to Cloudinary:', err);
                return res.status(500).json({ message: 'Error uploading image' });
            }
        }

        // const updatedItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
        const updatedItem = await item.save();

        if (!updatedItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        req.io.emit('menuUpdated', { updatedItem, sellerId: updatedItem.sellerId });

        res.status(200).json({ success: true, message: 'Menu item updated', updatedItem });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get all menu items for a specific seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const menuItems = await MenuItem.find({ sellerId });
        res.status(200).json({ success: true, menuItems });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/item/:menuItemId', async (req, res) => {
    try {
        console.log('You are here');
        const { menuItemId } = req.params;
        
        // Find the menu item by its ID
        const menuItem = await MenuItem.findById(menuItemId);

        if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        // Ensure the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
            return res.status(400).json({ success: false, message: 'Invalid menu item ID' });
        }
        console.log('You are now here');
        console.log(menuItem);

        res.status(200).json({ success: true, menuItem });
    } catch (error) {
        console.error('Error fetching menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Delete a menu item
router.delete('/delete/:id', isRightRole(['seller']), async (req, res) => {
    try {
        const { id } = req.params;

        const deletedItem = await MenuItem.findByIdAndDelete(id);

        if (!deletedItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
        }

        req.io.emit('menuDeleted', { deletedItem, sellerId: deletedItem.sellerId });

        res.status(200).json({ success: true, message: 'Menu item deleted', deletedItem });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
