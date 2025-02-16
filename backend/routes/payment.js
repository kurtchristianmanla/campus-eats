const express = require('express');
const router = express.Router();
const mongoose = require('../db/db');

router.post('/pay', (req, res) => {
    const { userId, sellerId, amount } = req.body;
    const deductFromCustomer = `UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?`;
    const addToSeller = `UPDATE users SET balance = balance + ? WHERE id = ?`;

    mongoose.beginTransaction((err) => {
        if (err) return res.status(500).send('Transaction error');

        mongoose.query(deductFromCustomer, [amount, userId, amount], (error, results) => {
            if (error || results.affectedRows === 0) {
                return mongoose.rollback(() => {
                    res.status(400).send('Insufficient balance or error processing payment');
                });
            }

            mongoose.query(addToSeller, [amount, sellerId], (error) => {
                if (error) {
                    return mongoose.rollback(() => {
                        res.status(500).send('Error adding funds to seller');
                    });
                }

                const transactionSql = `INSERT INTO transactions (userId, sellerId, amount, timestamp, type) VALUES (?, ?, ?, NOW(), 'purchase')`;
                mongoose.query(transactionSql, [userId, sellerId, amount], (error) => {
                    if (error) {
                        return mongoose.rollback(() => {
                            res.status(500).send('Error recording transaction');
                        });
                    }

                    mongoose.commit((err) => {
                        if (err) {
                            return mongoose.rollback(() => {
                                res.status(500).send('Transaction commit error');
                            });
                        }

                        res.send('Payment successful');
                    });
                });
            });
        });
    });
});

module.exports = router;
