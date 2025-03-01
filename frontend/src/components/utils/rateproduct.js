import React, { useState } from 'react';
import { rateProduct } from '../api/ratingService';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

const RateProduct = ({ token, productId, productName, orderId, setShowRatingForm }) => {
    const [rating, setRating] = useState(5);
    const [review, setReview] = useState("");
    const [hover, setHover] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await rateProduct(token, productId, orderId, rating, review);
        if (result.error) {
            toast.error("Failed to submit rating.");
            setIsSubmitting(false);
        } else {
            toast.success("Rating submitted successfully!");
            setShowRatingForm((prev) => ({
                ...prev,
                [productId]: !prev[productId]
            }));
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 p-8 flex items-center justify-center z-[70]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <form
                onSubmit={(e) => {
                    setIsSubmitting(true);
                    handleSubmit(e);
                }}
                className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            >
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Rate {productName}</h3>
                <div className="flex space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <FaStar
                            key={num}
                            className={`h-6 w-6 cursor-pointer transition duration-200 ${
                                (hover || rating) >= num ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                            onMouseEnter={() => setHover(num)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(num)}
                        />
                    ))}
                </div>
                <textarea
                    placeholder="Leave a review (optional)"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    rows="3"
                />
                <motion.button
                    type="submit"
                    className="w-full text-white py-2 rounded  bg-gradient-to-r from-orange-400 to-red-500 "
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : "Submit Rating"}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default RateProduct;
