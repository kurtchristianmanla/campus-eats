import React, { useState, useEffect, useCallback } from 'react';
import { getItemsToPay, clearItemsToPay, removePaidItemsFromCart } from '../utils/cart';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../api/interceptor';  
import { createOrders } from '../api/orderService';
import { io } from 'socket.io-client';
import { toast, Slide } from 'react-toastify';
import { useNotification } from '../utils/notification';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const CustomerPayment = () => {
    const [listItems, setListItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isInsufficient, setIsInsufficient] = useState(false);
    const [successWindow, setSuccessWindow] = useState(false);
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);
    const [socket, setSocket] = useState(null); // Track the socket connection
    const [minTime, setMinTime] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');

    useEffect(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1); // Min time = +1 hour

        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');

        setScheduledTime(`${hh}:${mm}`);
        setMinTime(`${hh}:${mm}`);
        setMaxTime('23:59'); // Max time is end of the day
    }, []);

    // Function to check if the user is an admin
    const checkCustomerAccess = useCallback(async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage

        try {
            // Decode the token
            const decoded = jwtDecode(token);

            if (decoded.user_type !== 'customer') {
                alert('Access Denied: Customer only');
                navigate('/'); // Redirect to another page
            }

            setUserId(decoded.user_id);

            const response = await api.get(`/customer/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            const data = response.data;
            setUser(data.user);
            setUsername(data.user.username || 'Customer');
            setBalance(data.user.balance);
            setProfilePicture(data.user.profile_picture);
        } catch (error) {
            console.error('Invalid token:', error);
            navigate('/login'); // Redirect to login if token is invalid
        }
    }, [navigate]);

    const fetchItems = useCallback(async () => {
        const token = localStorage.getItem('token');
        const itemsSelected = getItemsToPay(userId);
        console.log("Items Selected:", itemsSelected);

        try {
            // Fetching items in bulk
            const response = await api.post('/customer/get-items', 
                { ids: itemsSelected },
                {
                    headers: {
                    'Authorization': `Bearer ${token}`,
                    },
                }
            );
            setListItems(response.data); // Assuming the API returns an array of items
            console.log("What is in database:", response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }, [userId]);


    useEffect(() => {
        document.title = "Campus Eats | Payment";

        // Disable scrolling and zooming
        // document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        checkCustomerAccess();

        const storedCart = getItemsToPay(userId)
        
        setSelectedItems(storedCart);

        fetchItems();

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        socketConnection.emit("registerUser", userId);

        const updateBalance = (data) => {
            if (data.userId === userId) {
                setBalance(data.balance);
                console.log(data.balance);
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.customerId === userId) {

                // Map status to user-friendly text
                const statusTextMap = {
                    'cart': 'Cart',
                    'pending': 'Pending',
                    'preparing': 'Preparing',
                    'ready': 'Ready for Pickup',
                    'completed': 'Completed',
                    'cancelled': 'Cancelled',
                    'pre-order': 'Pre-Order'
                };

                // Get the user-friendly status text
                const statusText = statusTextMap[data.order.status] || 'Unknown Status';

                if (data.order.status === 'cancelled') {
                    toast.error(
                        `Order #${data.order.orderNumber} is now ${statusText}.`
                    );
                } else {
                    toast.success(
                        `Order #${data.order.orderNumber} is now ${statusText}.`
                    );
                }

                // Show notification with updated status text
                showNotification(
                    'Order Status Updated!', 
                    `Order #${data.order.orderNumber} is now ${statusText}.`,
                    'customer'
                );
            }
        };

        // Listen for new orders
        socketConnection.on('updateOrder', orderStatusChanged);

        socketConnection.on('updateBalance', updateBalance);
        
        // Clean up the styles on component unmount
        return () => {
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('updateBalance', updateBalance);
            socketConnection.disconnect();
            // document.body.style.overflow = 'auto';
            // document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkCustomerAccess, userId, fetchItems, showNotification]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (userId && listItems.length === 0) {
                navigate('/customer/cart');
            }
        }, 3000); 
    
        return () => clearTimeout(timer); // Cleanup timer
    }, [userId, listItems, navigate]);

    const formatPrice = (num) => {
        if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toFixed(2);
    };
    
    const formatAmount = (amount) => {
        return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getTotalSelectedPrice = () => {
        return listItems.reduce((total, item) => {
            const matchedItem = selectedItems.find(selected => selected._id === item._id);
            if (matchedItem) {
                const price = Number(item.price) || 0;
                const quantity = Number(matchedItem.quantity) || 1; 
                return total + price * quantity;
            }
            return total;
        }, 0);
    };

    const remainingBalance = balance - getTotalSelectedPrice();

    const handleTimeChange = (e) => {
        console.log(minTime);
        const selectedTime = e.target.value; // e.g., "16:32"

        // Combine with today's date
        const today = new Date();
        const datePart = today.toLocaleDateString('en-CA'); // e.g., "2025-02-12"
        const combinedDateTime = `${datePart}T${selectedTime}`; // "2025-02-12T16:32"

        // Check if it's at least 30 mins ahead
        const currentTime = new Date();
        const selectedDateTime = new Date(combinedDateTime);
        const diffInMinutes = (selectedDateTime - currentTime) / (1000 * 60);

        if (diffInMinutes < 30) {
            toast.error("Time must be at least 30 minutes from now.");
            return;
        }

        setScheduledTime(selectedTime);
    };

    const proceedOrder = async () => {

        if (isPreOrder && !scheduledTime) {
            return toast.error('Please select a scheduled time for pre-order.');
        }

        // Get the current date and apply scheduled time manually
        const preOrderTime = new Date();
        const [hh, mm] = scheduledTime.split(":");
        preOrderTime.setHours(hh, mm, 0, 0); // Set the hours and minutes in LOCAL TIME (PHT)

        console.log("Selected (Local Time):", preOrderTime.toISOString()); // Logs correct local time

        const token = localStorage.getItem('token'); // Retrieve token from localStorage

        try {
            const payItems = getItemsToPay(userId);

            if (payItems.length === 0) {
                toast.error('Cart is empty', {
                    position: 'top-right',
                    autoClose: 3000,
                    transition: Slide,  // Change the animation here
                    style: {
                        width: '300px', // Set your desired width here
                        marginTop: '30px',
                        marginRight: '10px',
                        marginBottom: '-20px'
                    }
                });
                return;
            }

            try {
                const orderResults = await createOrders(token, payItems, isPreOrder, preOrderTime);
          
                const hasSuccess = orderResults.some(result => result.status === 'fulfilled');
          
                if (hasSuccess) {
                    removePaidItemsFromCart(userId);
                    clearItemsToPay(userId);
                    setSuccessWindow(true);
                } else {
                  toast.error('Failed to place the order.');
                  setIsProcessing(false);
                }
            } catch (error) {
                console.log(`Error: ${error.message}`);
                setIsProcessing(false);
            }

            // const createOrders(token, payItems);

            // Clear localStorage cart after all orders are created
            // removePaidItemsFromCart(userId);
            // clearItemsToPay(userId);
            
            // toast.success('Orders placed successfully!', {
            //     position: 'top-right',
            //     autoClose: 3000,
            //     transition: Slide,  // Change the animation here
            //     style: {
            //         width: '300px', // Set your desired width here
            //         marginTop: '30px',
            //         marginRight: '10px',
            //         marginBottom: '-20px'
            //     }
            // });
            
            // Optionally redirect to orders page
            // navigate('/customer/my-orders');

            // setSuccessWindow(true);
            

        } catch (error) {
            toast.error('Failed to create orders');
            console.error('Error creating orders:', error);
        }
    };

    const handleSuccessWindow = () => {
        setSuccessWindow(false);
        navigate('/customer')
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7] to-gray-200 w-full">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7] to-gray-200 z-[60] 
                        overflow-y-auto scrollbar-hide">

                {/* Navigation Bar */}
                <header
                    className="w-full flex justify-between items-center px-4 py-3 fixed top-0 z-30 bg-[#f5f5f7]"
                >
                    <button className="text-gray-600" onClick={() => navigate("/customer/cart")}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-6 h-6"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 19.5L8.25 12l7.5-7.5"
                            />
                        </svg>
                    </button>
                </header>

                <AnimatePresence>
                {successWindow && (
                    <motion.div className="lg:mt-[4rem] md:mt-[5rem] mt-[10rem] bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7] flex flex-col items-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}>
                        <motion.div className="w-[20rem] h-full bg-white p-6 rounded-lg shadow-md flex flex-col items-center"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.4, ease: 'easeInOut' }}>
                            <motion.div className="w-28 h-28 flex items-center justify-center bg-green-100 rounded-full mb-6"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth="1.5"
                                    stroke="currentColor"
                                    className="w-12 h-12 text-green-600"
                                >
                                    <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 12.75l6 6 9-13.5"
                                    />
                                </svg>
                            </motion.div>

                            <h2 className="text-xl font-bold text-gray-800 text-center mb-4">Your Order Has Been Successfully Placed!</h2>
                            <p className="text-sm text-gray-600 text-center mb-12">
                                <span className="font-medium">Sit back and relax while we prepare your order.
                                    It’ll be ready in just a few minutes.
                                </span>
                            </p>

                            <motion.button
                                onClick={() => navigate('/customer/my-orders')}
                                className="w-full mb-2 py-3 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 300 }}>
                            Go to my orders
                            </motion.button>
                            <motion.button
                                onClick={handleSuccessWindow}
                                className="w-full py-3 bg-gray-400 text-white rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'tween', stiffness: 300 }}>
                            Order more
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}</AnimatePresence>

                {/* Insufficient Balance */}
                <AnimatePresence>
                    {isInsufficient && (
                        <motion.div
                            className="fixed right-0 z-[70] w-full h-full flex justify-center items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <motion.div
                                className="bg-white p-4 h-24 w-[16rem] rounded-lg flex flex-col gap-4 justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="flex items-center">
                                    <h3 className="text-lg">Insufficient Balance!</h3>
                                </div>
                                <div className="flex gap-4 items-center justify-end">
                                    <motion.button onClick={() => setIsInsufficient(false)} className="flex items-center justify-between gap-1"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.3, stiffness: 800 }}
                                        >
                                        <h3 className="text-xs">OK</h3>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dark Overlay */}
                <AnimatePresence>
                    {(isInsufficient) && (
                        <motion.div
                            className="fixed inset-0 bg-black z-[60]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        ></motion.div>
                    )}
                </AnimatePresence>

            {!successWindow && (<>
                <div className="mt-12 relative overflow-visible lg:px-8">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20  }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-3xl font-bold p-4">Payment</motion.h1>
                </div>

                <div className="w-full overflow-visible">
                    <div className="flex flex-col pb-24 mt-2 px-4">
                        {/* Items */}
                        <div className="flex justify-between items-center ">
                            <h3 className="text-md font-bold uppercase text-black">Items</h3>
                        </div>

                        <AnimatePresence>
                        {listItems.map((item, index) => {
                            const selectedItem = selectedItems.find(selected => selected._id === item._id);
                            const quantity = selectedItem ? selectedItem.quantity : 0; // Default to 0 if not selected

                            return (
                                <motion.div key={item._id} className={`flex justify-between items-center py-2
                                    ${index === listItems.length - 1 ? 'border-b border-gray-300' : ''}`}>
                                    <div className="flex items-center flex-row">
                                        <span className="mr-1">x{quantity}</span>
                                        <span className="uppercase text-md font-semibold">{item.name}</span>
                                    </div>
                                    <p className="text-md text-orange-500">UC {formatAmount(item.price * quantity)}</p>
                                </motion.div>
                            );
                        })}
                        {/* Total */}
                        <div className="mt-4 flex justify-between items-center ">
                            <h3 className="text-sm font-semibold uppercase text-black">Total Amount</h3>
                            <p className="text-2xl font-bold">UC {formatAmount(getTotalSelectedPrice())}</p>
                        </div>

                        </AnimatePresence>
                        {/* Wallet Balance */}
                        <div className="mt-20 flex justify-between items-center ">
                            <h3 className="text-sm font-semibold uppercase text-black">WALLET BALANCE</h3>
                            <p className="text-2xl font-semibold">UC {formatAmount(balance)}</p>
                        </div>

                        {/* Remaining Balance */}
                        <div className="mt-2 flex justify-between items-center ">
                            <p className="text-xs w-40 font-normal uppercase text-black">REMAINING BALANCE AFTER PAYMENT</p>
                            <p className="text-xl font-bold text-orange-500">UC {formatAmount(remainingBalance)}</p>
                        </div>

                        {/* <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isPreOrder}
                                onChange={() => setIsPreOrder(!isPreOrder)}
                                className="w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm font-medium">Pre-Order</span>
                        </label> */}
                        <div className="flex flex-col justify-start
                            items-start mt-4 py-6 h-auto z-30 gap-4">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPreOrder}
                                    onChange={() => setIsPreOrder(!isPreOrder)}
                                    className="peer hidden"
                                />
                                <motion.div className="w-5 h-5 border-2 border-gray-400 rounded-md peer-checked:bg-orange-400
                                    peer-checked:border-orange-400 flex items-center justify-center transition-colors 
                                    duration-200"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                        >
                                    <svg
                                        className={`w-4 h-4 text-white ${isPreOrder ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        strokeWidth="3"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </motion.div>
                                <span className="text-sm font-medium ml-2">Pre-Order</span>
                            </label>

                            {isPreOrder && (
                                <div className="flex flex-col items-start">
                                <label htmlFor="time" className="block text-xs text-gray-500 mb-1">
                                    Schedule Time
                                </label>
                                <input
                                    id="time"
                                    type="time"
                                    value={scheduledTime}
                                    onChange={handleTimeChange}
                                    min={minTime} // Prevents past dates
                                    max={maxTime}
                                    className="p-2 border rounded-md text-sm focus:outline-none 
                                                focus:ring-2 focus:ring-orange-400 transition-shadow 
                                                duration-200 hover:shadow-md w-40"
                                />
                                </div>
                            )}
                        </div>
                    </div>

                    {!successWindow && (
                        <div className="w-full">
                            {/* Add Button */}
                            <div className="fixed inset-x-0 bottom-0 flex flex-row justify-center
                                items-center px-4 py-6 z-[50]">
                                <motion.button
                                    onClick={() => {
                                        if (isProcessing) { 
                                            return; // Prevent multiple clicks
                                        } else {
                                            setIsProcessing(true);
                                            proceedOrder();
                                        }
                                    }}
                                    className={`w-full h-14 rounded-xl text-white text-sm font-semibold shadow-md flex justify-center items-center transition-color duration-300
                                        bg-gradient-to-r from-orange-400 to-red-500`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : 'Pay and wait for confirmation'}
                                </motion.button>
                            </div>
                        </div>
                    )}
                </div>
            </>)}
            </div>
        </div>
    );
};

export default CustomerPayment;
