import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const LiveQueue = () => {
    const navigate = useNavigate();
    const [queues, setQueues] = useState([]);
    const [currentSellerIndex, setCurrentSellerIndex] = useState(0);
    const [socket, setSocket] = useState(null);
    const [showSellerPopup, setShowSellerPopup] = useState(false); // State to control popup visibility
    const popupRef = useRef(null); // Ref for the popup to handle click outside

    const fetchQueue = async () => {
        try {
            const response = await axios.get(`${address}/live-queue`);
            setQueues(response.data);
        } catch (error) {
            console.error('Error fetching public queue:', error);
        }
    };

    useEffect(() => {
        // Fetch initial data (all sellers)
        fetchQueue();

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Listen for order updates
        const handleOrderUpdate = (data) => {
            setQueues((prevQueues) => {
                const updatedQueues = prevQueues.map((seller) => {
                    // Check if the updated order belongs to this seller
                    if (seller.sellerId === data.order.sellerId) {
                        // Check if the order already exists in the seller's orders
                        const orderIndex = seller.orders.findIndex((order) => order._id === data.order._id);

                        if (orderIndex !== -1) {
                            // If the order exists, update it
                            return {
                                ...seller,
                                orders: seller.orders.map((order) =>
                                    order._id === data.order._id ? { ...order, ...data.order } : order
                                ),
                            };
                        } else {
                            // If the order is new, add it to the seller's orders
                            return {
                                ...seller,
                                orders: [...seller.orders, data.order],
                            };
                        }
                    }
                    return seller;
                });

                return updatedQueues;
            });
        };

        // Listen for seller status changes
        const handleSellerStatusChange = (data) => {
            setQueues((prevQueues) => {
                return prevQueues.map((seller) =>
                    seller.sellerId === data.sellerId
                        ? { ...seller, isSelling: data.isSelling }
                        : seller
                );
            });
        };

        // Attach event listeners
        socketConnection.on('updateOrder', handleOrderUpdate);
        socketConnection.on('sellerStatusChanged', handleSellerStatusChange);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('updateOrder', handleOrderUpdate);
            socketConnection.off('sellerStatusChanged', handleSellerStatusChange);
            socketConnection.disconnect();
        };
    }, []);

    // Reset currentSellerIndex if queues change and the index is out of bounds
    useEffect(() => {
        if (currentSellerIndex >= queues.length) {
            setCurrentSellerIndex(0);
        }
    }, [queues, currentSellerIndex]);

    // Handle seller selection from the popup
    const handleSellerSelect = (index) => {
        setCurrentSellerIndex(index);
        setShowSellerPopup(false); // Close the popup after selection
    };

    // Handle click outside the popup to close it
    useEffect(() => {
        document.title = 'Campus Eats | Live Queue';
        
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowSellerPopup(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (queues.length === 0) {
        return <div className="p-4">No sellers available at the moment.</div>;
    }

    const currentSeller = queues[currentSellerIndex];

    // Ensure currentSeller is defined before accessing its properties
    if (!currentSeller) {
        return <div className="p-4">No seller data available.</div>;
    }

    // Filter orders by status
    const preparingOrders = currentSeller.isSelling
        ? currentSeller.orders.filter((order) => order.status === 'preparing')
        : [];
    const readyOrders = currentSeller.isSelling
        ? currentSeller.orders.filter((order) => order.status === 'ready')
        : [];

    // Function to split orders into a 6x5 grid filled up to down
    const splitIntoGrid = (orders, columns = 5, rows = 6) => {
        const grid = Array.from({ length: rows }, () => Array(columns).fill(null));
        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < rows; row++) {
                const index = col * rows + row;
                if (index < orders.length) {
                    grid[row][col] = orders[index];
                }
            }
        }
        return grid;
    };

    return (
        <div className="relative p-8 bg-gray-100 min-h-screen overflow-hidden">
            <div className="absolute -bottom-40 -right-20 w-full h-2/3 bg-gradient-to-r from-orange-700 via-orange-400 
                to-orange-500 z-0 opacity-20"
                 style={{ transform: 'rotate(-8deg)' }} />

            {/* Header */}
            <header className="relative z-10 mb-4 -mt-4">
                <div className="flex justify-between items-center">
                    <motion.div 
                        className="flex items-center bg-white rounded-lg shadow-md p-3 cursor-pointer"
                        onClick={() => navigate('/')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <img src="/test/campus-eats-logo.png" alt="Logo" className="w-10 h-10 mr-3" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Campus Eats</h1>
                            <p className="text-sm text-orange-500">Live Queue</p>
                        </div>
                    </motion.div>
                    
                    {/* Current time display */}
                    <div className="bg-white rounded-lg shadow-md px-4 py-2">
                        <p className="text-gray-700 font-medium">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Seller Title with Clickable Popup */}
            <div className="flex justify-center items-center mb-4 relative">
                <motion.div
                    className="w-full h-24 bg-center rounded-lg cursor-pointer"
                    style={{ backgroundImage: `url(${currentSeller.sellerBanner})` }}
                    onClick={() => setShowSellerPopup(!showSellerPopup)}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}  
                >
                    {/* Semi-transparent overlay */}
                    <div className="w-full h-24 p-4 absolute inset-0 bg-black bg-opacity-30 flex items-center justify-start rounded-lg">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mr-4 overflow-hidden">
                                {currentSeller.sellerBanner ? (
                                    <img 
                                        src={currentSeller.sellerBanner} 
                                        alt="Seller" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-orange-500">
                                        {currentSeller.sellerName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {currentSeller.sellerName}
                                </h2>
                                <div className="flex items-center mt-1">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${currentSeller.isSelling ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-white text-sm">
                                        {currentSeller.isSelling ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                            </div>
                    </div>
                </motion.div>

                {/* Seller Popup */}
                <AnimatePresence>
                    {showSellerPopup && (
                        <motion.div
                            ref={popupRef}
                            className="absolute top-12 left-40 bg-white p-1 rounded-lg shadow-md w-96 z-50 max-h-[30rem] overflow-y-auto"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ul>
                                {queues
                                    .sort((a, b) => a.sellerName.localeCompare(b.sellerName))
                                    .map((seller, index) => (
                                    <motion.li
                                        key={seller.sellerId}
                                        className="p-1 hover:bg-gray-100 cursor-pointer rounded-lg"
                                        onClick={() => handleSellerSelect(index)}
                                        whileHover={{ scale: 1.01 }}
                                        transition={{ duration: 0.3, ease: 'easeOut' }}  
                                    >
                                        {/* Seller Banner in Popup */}
                                        <div
                                            className="w-full h-16 bg-cover bg-center rounded-lg"
                                            style={{ backgroundImage: `url(${seller.sellerBanner})` }}
                                        >
                                            {/* Semi-transparent overlay */}
                                            <div className="w-full h-full bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                                <span className="text-white">
                                                    {seller.sellerName}{' '}
                                                    {!seller.isSelling && (
                                                        <span className="text-red-500 text-sm">(Not Selling)</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Orders Grid */}
            {currentSeller.isSelling ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                    {/* Now Preparing Section */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-orange-500 p-4">
                            <h2 className="text-xl font-bold text-white text-center">
                                Now Preparing ({preparingOrders.length})
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-5 gap-3">
                                {splitIntoGrid(preparingOrders).map((row, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                        {row.map((order, colIndex) => (
                                            <motion.div
                                                key={order ? order._id : `${rowIndex}-${colIndex}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ 
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 30,
                                                    delay: (colIndex * 6 + rowIndex) * 0.05
                                                }}
                                                className={`h-8 flex items-center justify-center rounded-lg
                                                    ${order ? 'bg-orange-100 border-2 border-orange-300' : 'bg-gray-50'}`}
                                            >
                                                {order && (
                                                    <span className="text-lg font-bold text-orange-700">
                                                        {order.orderNumber}
                                                    </span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ready to Serve Section */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-green-500 p-4">
                            <h2 className="text-xl font-bold text-white text-center">
                                Ready to Serve ({readyOrders.length})
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-5 gap-3">
                                {splitIntoGrid(readyOrders).map((row, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                        {row.map((order, colIndex) => (
                                            <motion.div
                                                key={order ? order._id : `${rowIndex}-${colIndex}`}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ 
                                                    type: 'spring',
                                                    stiffness: 500,
                                                    damping: 30,
                                                    delay: (colIndex * 6 + rowIndex) * 0.05
                                                }}
                                                className={`h-8 flex items-center justify-center rounded-lg
                                                    ${order ? 'bg-green-100 border-2 border-green-300 animate-pulse' : 'bg-gray-50'}`}
                                            >
                                                {order && (
                                                    <span className="text-lg font-bold text-green-700">
                                                        {order.orderNumber}
                                                    </span>
                                                )}
                                            </motion.div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center relative z-10">
                    <div className="text-gray-500 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">Currently Closed</h3>
                    <p className="text-gray-500">This seller is not currently accepting orders</p>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-4 text-center text-sm text-gray-500 relative z-10">
                <p>Last updated: {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">Campus Eats © {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default LiveQueue;