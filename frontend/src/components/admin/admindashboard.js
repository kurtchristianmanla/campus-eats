import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaBook, FaSignOutAlt, FaUser, FaUsers, FaMoneyBillWave, FaExchangeAlt, FaHistory } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import useHandleLogout from '../api/logout';
import api from '../api/interceptor';


const AdminDashboard = () => {
    const navigate = useNavigate();
    const handleLogout = useHandleLogout();
    const [username, setUsername] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const token = localStorage.getItem('token');
    const userName = token ? jwtDecode(token).username : null;

    // Function to check if the user is an admin
    const checkAdminAccess = useCallback(async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage

        if (!token) {
            // No token, redirect to login
            navigate('/login');
            return;
        }

        try {
            // Decode the token
            const decoded = jwtDecode(token);
        
            // Check if user_type is 'admin'
            if (decoded.user_type !== 'admin') {
                alert('Access Denied: Admins only');
                navigate('/'); // Redirect to another page
            }
        
            // Make the API request using Axios instance
            const response = await api.get('/admin/profile');
        
            // Handle the response
            const data = response.data;
            setUsername(data.user.username || 'Admin');
        } catch (error) {
            console.error('Invalid token or error fetching data:', error);
            navigate('/login'); // Redirect to login if token is invalid
        }
    }, [navigate]);

    // Run the check when the component mounts
    useEffect(() => {
        document.title = "Campus Eats | Admin";

        // Disable scrolling and zooming
        // document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        checkAdminAccess();

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkAdminAccess]);

    // Disable scrolling when sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    
        // Cleanup function
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen); // Toggle the sidebar visibility
    };

    const handleLogoutClick = async () => {
        setIsLoggingOut(true); // Set loading state to true
        await handleLogout(); // Call the logout function
        setIsLoggingOut(false); // Reset loading state
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            {/* Navigation Bar */}
            <motion.header
                className="w-full flex justify-between items-center px-6 py-4 fixed top-0 z-20 bg-white shadow-sm"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <h1 className="text-xl font-bold text-gray-800">
                    <span className="text-black">Campus </span>
                    <span className="text-orange-500">Eats</span>
                    <span className="text-sm ml-2 font-normal text-gray-500">Admin Panel</span>
                </h1>
                <button 
                    className="text-2xl text-gray-800 hover:text-orange-500 transition-colors"
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    &#9776;
                </button>
            </motion.header>

            {/* Sidebar with Animation */}
            <AnimatePresence>
            {isSidebarOpen && (
                <motion.div
                className="fixed top-0 right-0 w-80 h-full bg-white text-black z-30 shadow-2xl flex flex-col"
                initial={{ x: "100%" }}
                animate={{ x: '5%' }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white">
                    <div className="flex items-center">
                    <FaUser className="text-orange-500 mr-3 text-lg" />
                    <div>
                        <p className="text-sm text-gray-500">Logged in as</p>
                        <h2 className="font-semibold text-gray-800">{userName || "Admin"}</h2>
                    </div>
                    </div>
                    <button 
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={toggleSidebar}
                    aria-label="Close menu"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-2">
                    <ul className="space-y-1">
                    <motion.li whileTap={{ scale: 0.98 }}>
                        <button
                        onClick={() => {
                            navigate("/admin/profile");
                            toggleSidebar();
                        }}
                        className="flex items-center w-full px-4 py-3 text-left rounded-lg hover:bg-orange-50 group transition-colors duration-200"
                        >
                        <span className="p-2 mr-3 rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors">
                            <FaUser className="text-lg" />
                        </span>
                        <span className="font-medium text-gray-700 group-hover:text-orange-600">Profile</span>
                        </button>
                    </motion.li>

                    <motion.li whileTap={{ scale: 0.98 }}>
                        <button
                        onClick={() => {
                            navigate("/admin/use-policy");
                            toggleSidebar();
                        }}
                        className="flex items-center w-full px-4 py-3 text-left rounded-lg hover:bg-orange-50 group transition-colors duration-200"
                        >
                        <span className="p-2 mr-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                            <FaBook className="text-lg" />
                        </span>
                        <span className="font-medium text-gray-700 group-hover:text-blue-600">Use Policy</span>
                        </button>
                    </motion.li>

                    {/* Divider */}
                    <div className="border-t border-gray-100 my-2"></div>

                    {/* More menu items can be added here following the same pattern */}

                    <motion.li whileTap={{ scale: 0.98 }}>
                        <button
                        onClick={handleLogoutClick}
                        disabled={isLoggingOut}
                        className={`flex items-center w-full px-4 py-3 text-left rounded-lg group transition-colors duration-200 ${
                            isLoggingOut 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'hover:bg-red-50'
                        }`}
                        >
                        <span className={`p-2 mr-3 rounded-lg ${
                            isLoggingOut 
                            ? 'bg-gray-200 text-gray-400' 
                            : 'bg-red-100 text-red-600 group-hover:bg-red-200'
                        }`}>
                            <FaSignOutAlt className="text-lg" />
                        </span>
                        <span className={`font-medium ${
                            isLoggingOut 
                            ? 'text-gray-400' 
                            : 'text-gray-700 group-hover:text-red-600'
                        }`}>
                            {isLoggingOut ? 'Logging Out...' : 'Logout'}
                        </span>
                        </button>
                    </motion.li>
                    </ul>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-500">
                    Campus Eats Admin v2.0
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Dark Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                <motion.div
                    className="fixed inset-0 bg-black z-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    onClick={toggleSidebar}
                ></motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-10 px-4">
                {/* Welcome Section */}
                <motion.div
                    className="w-full max-w-md text-center mb-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold text-gray-800 mb-2"
                    >
                        <span className="text-gray-700">Welcome, </span>
                        <span className="bg-gradient-to-br from-orange-600 to-orange-400 bg-clip-text text-transparent">
                            {userName}
                        </span>
                    </motion.h1>
                    <p className="text-gray-500">Manage your campus food delivery system</p>
                </motion.div>

                {/* Action Buttons Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* ACCOUNTS Button */}
                    <motion.button
                        onClick={() => navigate("/admin/accounts")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaUsers className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">ACCOUNTS</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage user accounts</p>
                        </div>
                    </motion.button>

                    {/* TOP-UP Button */}
                    <motion.button
                        onClick={() => navigate("/admin/top-up")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaMoneyBillWave className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">TOP-UP</h3>
                            <p className="text-sm text-gray-500 mt-1">Manage user balances</p>
                        </div>
                    </motion.button>

                    {/* CASH OUT Button */}
                    <motion.button
                        onClick={() => navigate("/admin/cash-out")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaExchangeAlt className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">CASH OUT</h3>
                            <p className="text-sm text-gray-500 mt-1">Process withdrawals</p>
                        </div>
                    </motion.button>

                    {/* TRANSACTIONS Button */}
                    <motion.button
                        onClick={() => navigate("/admin/transactions")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaHistory className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">TRANSACTIONS</h3>
                            <p className="text-sm text-gray-500 mt-1">View all transactions</p>
                        </div>
                    </motion.button>
                </motion.div>
            </div>

            {/* Subtle Branding */}
            <motion.div 
                className="fixed bottom-4 right-4 opacity-20 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 1, delay: 0.8 }}
            >
                <img
                    src="/test/campus-eats-logo.png"
                    alt="Campus Eats Logo"
                    className="w-32 h-32 object-contain"
                />
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
