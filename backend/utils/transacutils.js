// utils/transactionUtils.js
const Transaction = require('../models/transaction');
const TransactionCounter = require('../models/transactioncounter');

const generateTransactionId = async () => {
    // const date = new Date();
    // const formattedDate = date.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    // const count = await Transaction.countDocuments({}); // Get the number of transactions so far

    // Get the current date and time in UTC
    const dateUTC = new Date();

    // Convert to Philippine Time (UTC +8)
    const philippinesOffset = 8 * 60 * 60 * 1000; // 8 hours offset in milliseconds
    const dateInPhilippines = new Date(dateUTC.getTime() + philippinesOffset); // Adjust UTC time to PHT

    // Format the date to YYYYMMDD (the Philippine date)
    const formattedDate = dateInPhilippines.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Atomically increment the counter for the current date
    const counter = await TransactionCounter.findOneAndUpdate(
        { date: formattedDate },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
    );

    const transactionId = `CEAT-${formattedDate}-${String(counter.count).padStart(3, '0')}`;

    // second
    // // Count transactions for the current date
    // const transactionCount = await Transaction.countDocuments({
    //     transactionId: { $regex: `^CEAT-${formattedDate}-` }
    // });

    // const nextId = transactionCount + 1; // Ensure uniqueness by adding 1
    // const transactionId = `CEAT-${formattedDate}-${String(nextId).padStart(3, '0')}`;

    // first
    // let nextId = 1; // Initialize to 1
    // let transactionId = `CEAT-${formattedDate}-${String(nextId).padStart(3, '0')}`;

    // // Check if the transactionId already exists
    // let transactionExists = await Transaction.findOne({ transactionId });

    // // Keep incrementing until the transactionId is unique
    // while (transactionExists) {
    //     nextId++;  // Increment the ID part
    //     transactionId = `CEAT-${formattedDate}-${String(nextId).padStart(3, '0')}`; // Update the transactionId
    //     transactionExists = await Transaction.findOne({ transactionId }); // Check again
    // }

    return transactionId; // Return the unique transaction ID
};

module.exports = { generateTransactionId };
