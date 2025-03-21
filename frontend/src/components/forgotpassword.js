import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const navigate = useNavigate();

    const checkToken = useCallback(async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        if (token) {
            navigate('/');
            return; 
        }
    }, [navigate]);

    useEffect(() => {
        document.title = "Campus Eats | Forgot Password";
        
        checkToken();

        // Disable scrolling and zooming
        document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            alert("Please enter your email.");
            return;
        }

        setLoading(true);
        setMessage('');
        setMessageType(''); // Reset message type

        try {
            const response = await fetch(`${address}/user/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset link has been sent to your email.');
                setMessageType('success'); // Set message type to success
            } else {
                setMessage(data.message || 'Failed to send password reset link.');
                setMessageType('error'); // Set message type to error
            }
        } catch (error) {
            console.error('Error sending reset email:', error);
            setMessage('An error occurred. Please try again later.');
            setMessageType('error'); // Set message type to error
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/login'); // Redirect to the login page
    };

    return (
        <motion.div
            className="min-h-screen flex items-center justify-center bg-gray-100"
            initial={{ opacity: 0 }} // Fade in animation
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="mt-[-8rem] w-full max-w-sm bg-white p-6 rounded-lg shadow-md"
                initial={{ y: -50, opacity: 0 }} // Slide down animation
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <motion.h2
                    className="text-2xl font-bold text-gray-800 mb-4"
                    initial={{ x: -20, opacity: 0 }} // Slide in from left
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    Forgot Password
                </motion.h2>

                <motion.p
                    className="text-sm text-gray-600 mb-4"
                    initial={{ x: -20, opacity: 0 }} // Slide in from left
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    Enter your email to request a password reset.
                </motion.p>

                {message && (
                    <motion.p
                        className={`mb-4 text-sm text-left ${
                            messageType === 'success' ? 'text-green-500' : 'text-red-500'
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }} // Pop-in animation
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {message}
                    </motion.p>
                )}

                <form onSubmit={handleSubmit}>
                    <motion.div
                        className="mb-4"
                        initial={{ y: 20, opacity: 0 }} // Slide up animation
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter email address"
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300 mb-4"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        className="flex justify-end gap-2 mt-4"
                        initial={{ y: 20, opacity: 0 }} // Slide up animation
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        {/* Cancel Button */}
                        <motion.button
                            type="button"
                            onClick={handleCancel}
                            className="py-2 px-4 bg-gray-300 text-gray-800 font-semibold rounded hover:bg-gray-400"
                            whileHover={{ scale: 1.05 }} // Scale up on hover
                            whileTap={{ scale: 0.95 }} // Scale down on tap
                        >
                            Cancel
                        </motion.button>

                        {/* Send Link Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            className="py-2 px-4 bg-gradient-to-r from-orange-400 to-orange-500 
                            text-white font-semibold rounded hover:from-orange-500 hover:to-orange-600"
                            whileHover={{ scale: 1.05 }} // Scale up on hover
                            whileTap={{ scale: 0.95 }} // Scale down on tap
                        >
                            {loading ? 'Sending...' : 'Send Email Link'}
                        </motion.button>
                    </motion.div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ForgotPassword;