import React, { useState } from 'react';
import { cancelOrder } from '../api/orderService'; // Import the function above
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const CancelOrderForm = ({ orderId, token, label, setOrder }) => {
    const [reason, setReason] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleCancel = async () => {
        try {
            if (!reason.trim()) {
                return toast.error('Please provide a reason for cancellation.');
            }

            const updatedOrder = await cancelOrder(token, orderId, reason);
            toast.success('Order cancelled successfully.');
            setShowForm(false);
            setOrder(updatedOrder);
        } catch (error) {
            toast.error('Failed to cancel order.');
        }
    };

    return (
        <div>
            {!showForm ? (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                    >
                        {label}
                    </button>
                </div>
            ) : (
                <AnimatePresence>
                    <motion.div
                        className="flex flex-col gap-4 bg-white rounded-lg"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter cancellation reason..."
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows="4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleCancel}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                            >
                                Confirm Cancel
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition duration-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default CancelOrderForm;
