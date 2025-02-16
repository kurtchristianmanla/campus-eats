const mongoose = require('mongoose');

// Define the Counter schema
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },  // The counter's identifier, e.g., 'user_id'
    sequence_value: { type: Number, default: 0 }  // Starting value of the sequence
});

// Create and export the Counter model
const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;
