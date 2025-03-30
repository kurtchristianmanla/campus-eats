import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaBook, FaSignOutAlt, FaUser, FaUtensils, FaClipboardList, FaStar, FaHistory } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
// import { io } from 'socket.io-client';
import useHandleLogout from '../api/logout';
import api from '../api/interceptor';
import { useNotification } from '../utils/notification';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { getOrders } from '../api/orderService';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const SellerHomepage = () => {
    const navigate = useNavigate();
    const handleLogout = useHandleLogout();
    const [username, setUsername] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [orders, setOrders] = useState([]);
    const [socket, setSocket] = useState(null); 
    const { showNotification } = useNotification();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;
    const userName = token ? jwtDecode(token).username : null;

    // Function to check if the user is an admin
    const checkSellerAccess = useCallback(async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage

        if (!token) {
            // No token, redirect to login
            // navigate('/');
            return;
        }

        try {
            // Decode the token
            const decoded = jwtDecode(token);
        
            // Check if user_type is 'admin'
            if (decoded.user_type !== 'seller') {
                alert('Access Denied: Seller only');
                navigate('/'); // Redirect to another page
            }
        
            const response = await api.get('/seller/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            setUsername(response.data.user.username || 'Seller');
        } catch (error) {
            console.error('Invalid token:', error);
            navigate('/'); // Redirect to login if token is invalid
        }        
    }, [navigate]);

    // Run the check when the component mounts
    // Run the check when the component mounts
    useEffect(() => {
        document.title = "Campus Eats | Seller";

        // Disable scrolling and zooming
        // document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        checkSellerAccess();

        // Clean up the styles on component unmount
        return () => {
            document.body.style.overflow = 'auto';
            document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkSellerAccess]);

    const fetchOrders = useCallback(async () => {
        try {
            const fetchedOrders = await getOrders(token); // Await the result
            setOrders(fetchedOrders || []); // Set orders to the fetched data or an empty array
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]); // Optionally set to an empty array on error
        }
    }, [token]);

    useEffect(() => {
        fetchOrders();

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        const receiveNewOrder = (data) => {
            if (data.sellerId === sellerId) {
                setOrders(prevOrders => {
                    const isDuplicate = prevOrders.some(order => order._id === data.newOrder._id);
                    if (!isDuplicate) {
                        const newOrders = [...prevOrders, data.newOrder]; // Append instead of prepend
                        return newOrders.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                    }
                    return prevOrders; // Skip adding if duplicate
                });

                showNotification('New Order Received!', `Order #${data.newOrder.orderNumber}`, 'seller');
                toast.info(
                    'New Order Received!'
                );
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.sellerId === sellerId) {
                console.log("Received data:", data);
                setOrders(prevOrders => {
                    return prevOrders.map(order => 
                        order._id === data.order._id 
                            ? { ...order, ...data.order } // Update the existing order
                            : order
                    );
                });

                showNotification('Order Status Updated!', `Order #${data.order.orderNumber}`, 'seller');
            }
        };

        const warningOverdueOrders = (data) => {
            if (data.order.sellerId === sellerId) {
                toast.info(
                    data.message, {
                    duration: 5000,
                });
            }
        };

        // Listen for new orders
        socketConnection.on('newOrder', receiveNewOrder);
        socketConnection.on('updateOrder', orderStatusChanged);
        socketConnection.on('overdueOrder', warningOverdueOrders);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('newOrder', receiveNewOrder); // Remove the listener
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('overdueOrder', warningOverdueOrders);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [sellerId, showNotification, fetchOrders]);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    
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
                    <span className="text-sm ml-2 font-normal text-gray-500">Seller Panel</span>
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
                        <h2 className="font-semibold text-gray-800">{userName || "Seller"}</h2>
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
                            navigate("/seller/profile");
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
                            navigate("/seller/use-policy");
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
                    Campus Eats Seller v2.0
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
                    <p className="text-gray-500">Manage your food business</p>
                </motion.div>

                {/* Action Buttons Grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {/* MANAGE ORDERS Button */}
                    <motion.button
                        onClick={() => navigate("/seller/manage-orders")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all relative"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaClipboardList className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">MANAGE ORDERS</h3>
                            <p className="text-sm text-gray-500 mt-1">View and process orders</p>
                            {orders.filter(order => order.status === 'pending').length > 0 && (
                                <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs 
                                    font-semibold px-2 py-1 rounded-full shadow-md">
                                    {orders.filter(order => order.status === 'pending').length} New
                                </span>
                            )}
                        </div>
                    </motion.button>

                    {/* CUSTOMIZE MENU Button */}
                    <motion.button
                        onClick={() => navigate("/seller/menu")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaUtensils className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">CUSTOMIZE MENU</h3>
                            <p className="text-sm text-gray-500 mt-1">Update your food menu</p>
                        </div>
                    </motion.button>

                    {/* REVIEWS Button */}
                    <motion.button
                        onClick={() => navigate("/seller/reviews")}
                        className="flex items-center justify-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md border border-gray-100 hover:border-orange-100 transition-all"
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                                    <FaStar className="text-2xl" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800">REVIEWS</h3>
                            <p className="text-sm text-gray-500 mt-1">View customer feedback</p>
                        </div>
                    </motion.button>

                    {/* HISTORY Button */}
                    <motion.button
                        onClick={() => navigate("/seller/history")}
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
                            <h3 className="text-lg font-semibold text-gray-800">HISTORY</h3>
                            <p className="text-sm text-gray-500 mt-1">View past orders</p>
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

export default SellerHomepage;
