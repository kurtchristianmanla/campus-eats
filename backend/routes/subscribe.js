const express = require('express');
const router = express.Router();
const Subscription = require("../models/subscription");
const webPush = require("web-push");

router.post("/subscribe", async (req, res) => {
    const subscription = req.body;

    // Validate subscription object
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: "Invalid subscription data" });
    }

    try {
        // Check if subscription already exists
        const existingSubscription = await Subscription.findOne({ endpoint: subscription.endpoint });

        if (!existingSubscription) {
            // Save new subscription
            await Subscription.create(subscription);
            console.log("New subscription saved.");
        }

        res.status(201).json({ message: "Subscribed successfully!" });
    } catch (error) {
        console.error("Subscription error:", error);
        res.status(500).json({ error: "Failed to subscribe" });
    }
});

router.post("/notify", async (req, res) => {
    const { title, body } = req.body;

    if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
    }

    try {
        const subscriptions = await Subscription.find(); // Get all stored subscriptions
        const payload = JSON.stringify({ title, body });

        const notificationPromises = subscriptions.map((sub) =>
            webPush.sendNotification(sub, payload).catch(async (err) => {
                if (err.statusCode === 410) {
                    // Subscription expired, remove it
                    console.log("Removing expired subscription:", sub.endpoint);
                    await Subscription.deleteOne({ endpoint: sub.endpoint });
                } else {
                    console.error("Notification error:", err);
                }
            })
        );

        await Promise.all(notificationPromises);

        res.json({ message: "Notifications sent!" });
    } catch (error) {
        console.error("Error sending notifications:", error);
        res.status(500).json({ error: "Failed to send notifications" });
    }
});
  
module.exports = router;