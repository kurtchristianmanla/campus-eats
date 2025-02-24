const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
  endpoint: String,
  keys: {
    p256dh: String,
    auth: String,
  },
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

module.exports = Subscription;
