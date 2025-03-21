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
    const splitIntoGrid = (orders) => {
        const grid = Array.from({ length: 6 }, () => Array(5).fill(null)); // Initialize a 6x5 grid with null values
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 6; row++) {
                const index = col * 6 + row;
                if (index < orders.length) {
                    grid[row][col] = orders[index];
                }
            }
        }
        return grid;
    };

    const preparingGrid = splitIntoGrid(preparingOrders);
    const readyGrid = splitIntoGrid(readyOrders);

    return (
        <div className="relative p-8 bg-gray-100 min-h-screen overflow-hidden">
            <div className="absolute -bottom-40 -right-20 w-full h-2/3 bg-gradient-to-r from-orange-700 via-orange-400 
                to-orange-500 z-0 opacity-20"
                 style={{ transform: 'rotate(-8deg)' }} />
            {/* Title and Logo in Upper-Left Corner */}
            <motion.div className="absolute top-4 left-2 flex items-start z-50 bg-white bg-opacity-80 p-3 w-60 
                    rounded-md cursor-pointer"
                onClick={() => navigate('/')}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}  >
                <img
                    src="/test/campus-eats-logo.png"
                    alt="Campus Eats Logo"
                    className="w-12 h-12"
                />
                <h1 className="font-bold relative">
                    <p className="text-2xl absolute text-black whitespace-nowrap">Campus Eats</p>
                    <p className="text-xl absolute text-orange-500 whitespace-nowrap top-6 left-12">Live Queue</p>
                </h1>
            </motion.div>

            {/* Seller Title with Clickable Popup */}
            <div className="flex justify-center items-center mb-4 relative">
                <motion.div
                    className="w-full h-16 bg-center rounded-lg cursor-pointer"
                    style={{ backgroundImage: `url(${currentSeller.sellerBanner})` }}
                    onClick={() => setShowSellerPopup(!showSellerPopup)}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}  
                >
                    {/* Semi-transparent overlay */}
                    <div className="w-full h-full bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                        <div
                            className="w-12 h-12 rounded-lg cursor-pointer z-10 mr-3">
                            {currentSeller.sellerBanner ? (<img
                                src={currentSeller.sellerBanner}
                                alt="Campus Eats Logo"
                                className="w-12 h-12 rounded-lg"
                            />) : (
                                <span className="w-12 h-12 text-black flex justify-center items-center bg-gray-300 text-2xl font-bold rounded-lg">
                                    {currentSeller.sellerName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {currentSeller.sellerName}
                        </h1>
                    </div>
                </motion.div>

                {/* Seller Popup */}
                <AnimatePresence>
                    {showSellerPopup && (
                        <motion.div
                            ref={popupRef}
                            className="absolute top-12 bg-white p-1 rounded-lg shadow-md w-96 z-50 max-h-[32rem] overflow-y-auto"
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
                <div className="flex gap-5">
                    {/* Now Preparing Section */}
                    <div className="flex-1 z-20">
                        <div className="bg-white p-6 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-4 flex justify-center text-orange-600">Now Preparing</h2>
                            <div className="grid grid-cols-5 gap-2">
                                {preparingGrid.map((row, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                        {row.map((order, colIndex) => (
                                            <motion.div
                                                key={order ? order._id : `${rowIndex}-${colIndex}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: (colIndex * 6 + rowIndex) * 0.1 }}
                                                className="p-2 text-center text-xl h-14 flex items-center justify-center"
                                            >
                                                {order ? `${order.orderNumber}` : ''}
                                            </motion.div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ready to Serve Section */}
                    <div className="flex-1 z-20">
                        <div className="bg-white p-6 rounded-lg">
                            <h2 className="text-2xl font-semibold mb-4 flex justify-center text-green-600">Ready to Serve</h2>
                            <div className="grid grid-cols-5 gap-2">
                                {readyGrid.map((row, rowIndex) => (
                                    <React.Fragment key={rowIndex}>
                                        {row.map((order, colIndex) => (
                                            <motion.div
                                                key={order ? order._id : `${rowIndex}-${colIndex}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: (colIndex * 6 + rowIndex) * 0.1 }}
                                                className="p-2 text-center text-xl h-14 flex items-center justify-center"
                                            >
                                                {order ? `${order.orderNumber}` : ''}
                                            </motion.div>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-xl text-gray-500 mt-8">
                    This seller is currently not selling.
                </div>
            )}
        </div>
    );
};

export default LiveQueue;