import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // Extract token from URL
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            setMessage('Please fill in all fields.');
            setMessageType('error'); // Set message type to error
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match.');
            setMessageType('error'); // Set message type to error
            return;
        }

        setLoading(true);
        setMessage('');
        setMessageType(''); // Reset message type

        try {
            const response = await fetch(`${address}/user/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successfully. Redirecting to login...');
                setMessageType('success'); // Set message type to success
                setTimeout(() => {
                    navigate('/login'); // Redirect to login after success
                }, 2000);
            } else {
                setMessage(data.message || 'Failed to reset password.');
                setMessageType('error'); // Set message type to error
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setMessage('An error occurred. Please try again later.');
            setMessageType('error'); // Set message type to error
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="min-h-screen flex items-center justify-center bg-gray-100"
            initial={{ opacity: 0 }} // Fade in animation
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md"
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
                    Reset Password
                </motion.h2>

                <motion.p
                    className="text-sm text-gray-600 mb-4"
                    initial={{ x: -20, opacity: 0 }} // Slide in from left
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    Enter a new password for your account.
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
                        className=""
                        initial={{ y: 20, opacity: 0 }} // Slide up animation
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                    >
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            placeholder="Enter new password"
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300 mb-4"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        className="mb-4"
                        initial={{ y: 20, opacity: 0 }} // Slide up animation
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300 mb-4"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white 
                        font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 
                        hover:from-orange-500 hover:to-orange-600"
                        whileHover={{ scale: 1.05 }} // Scale up on hover
                        whileTap={{ scale: 0.95 }} // Scale down on tap
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ResetPassword;