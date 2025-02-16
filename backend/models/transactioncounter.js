// models/transactionCounter.js
const mongoose = require('mongoose');

const transactionCounterSchema = new mongoose.Schema({
    date: { type: String, unique: true },
    count: { type: Number, default: 0 }
});

const TransactionCounter = mongoose.model('TransactionCounter', transactionCounterSchema);

module.exports = TransactionCounter;
