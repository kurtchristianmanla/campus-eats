import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import useHandleLogout from '../api/logout';
import api from '../api/interceptor';


const AdminDashboard = () => {
    const navigate = useNavigate();
    const handleLogout = useHandleLogout();
    const [username, setUsername] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

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
        document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        checkAdminAccess();

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkAdminAccess]);

    // const handleLogout = () => {
    //     localStorage.removeItem('token');  // Clear the token
    //     navigate('/login');  // Redirect to the login page
    // };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen); // Toggle the sidebar visibility
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col items-center justify-center">
            {/* Navigation Bar */}
            <motion.header
                className="w-full flex justify-between items-center px-4 py-3 fixed top-0 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <h1 className="text-lg font-bold text-gray-800">
                <span className="text-black">Campus </span>
                <span className="text-orange-500">Eats</span>
                </h1>
                <button className="text-2xl text-gray-800" onClick={toggleSidebar}>
                &#9776;
                </button>
            </motion.header>

            {/* Sidebar with Animation */}
            <AnimatePresence>
                {isSidebarOpen && (
                <motion.div
                    className="fixed top-0 right-0 w-64 h-full bg-white text-black p-4 z-30"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <button className="text-2xl text-gray-800" onClick={toggleSidebar}>
                    &#9776;
                    </button>
                    <button
                    onClick={() => navigate("/admin/profile")}
                    className="relative justify-start items-center w-full mt-4 py-2 text-right bg-gradient-to-r from-white to-white font-semibold hover:from-orange-400 hover:to-red-500 hover:text-white rounded-md pr-4 border-b"
                    >
                    <FaUser className="ml-2 text-xl mr-32" />
                    Profile
                    </button>
                    <button
                    onClick={handleLogout}
                    className="relative justify-start items-center w-full mt-2 py-2 text-right bg-gradient-to-r from-white to-white font-semibold hover:from-orange-400 hover:to-red-500 hover:text-white rounded-md pr-4 border-b"
                    >
                    <FaSignOutAlt className="ml-2 text-xl mr-32" />
                    Logout
                    </button>
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

            {/* Logo */}
            <motion.div
                className="absolute top-60 left-11 transform translate-x-[-50%] translate-y-[-50%] md:translate-x-0 md:translate-y-0 md:top-4 md:left-4 opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <img
                src="/test/campus-eats-logo.png"
                alt="Campus Eats Logo"
                className="w-128 h-128 md:w-48 md:h-48 object-contain opacity-50 blur-sm"
                />
            </motion.div>

            {/* Buttons Section */}
            <motion.div
                className="flex flex-col space-y-4 -mt-[4rem] items-center w-[20rem] z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}
            >
                <motion.h1
                    className="text-5xl font-bold text-gray-800 mb-4"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    <span className="text-black">Welcome, </span>
                    <span className="bg-gradient-to-br from-orange-600 to-orange-400 bg-clip-text text-transparent transition duration-300">
                        {username}
                    </span>
                </motion.h1>

                {/* ACCOUNTS Button */}
                <motion.button
                    onClick={() => navigate("/admin/accounts")}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        animate: { duration: 0.4, ease: "easeInOut" },
                        hover: { duration: 0.3, ease: "easeOut" },
                    }}
                >
                    ACCOUNTS
                </motion.button>

                {/* TOP-UP Button */}
                <motion.button
                    onClick={() => navigate("/admin/top-up")}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        animate: { duration: 0.4, ease: "easeInOut" },
                        hover: { duration: 0.3, ease: "easeOut" },
                    }}
                >
                    TOP-UP
                </motion.button>

                {/* CASH OUT Button */}
                <motion.button
                    onClick={() => navigate("/admin/cash-out")}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        animate: { duration: 0.4, ease: "easeInOut" },
                        hover: { duration: 0.3, ease: "easeOut" },
                    }}
                >
                    CASH OUT
                </motion.button>

                {/* TRANSACTIONS Button */}
                <motion.button
                    onClick={() => navigate("/admin/transactions")}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        animate: { duration: 0.4, ease: "easeInOut" },
                        hover: { duration: 0.3, ease: "easeOut" },
                    }}
                >
                    TRANSACTIONS
                </motion.button>
            </motion.div>
        </div>
    );
};

export default AdminDashboard;
