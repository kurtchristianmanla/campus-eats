import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { addToCart, getCart, removeFromCart, clearCart, addToPay, getCartKey } from '../utils/cart';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import api from '../api/interceptor';
import useHandleLogout from '../api/logout';
import { io } from 'socket.io-client';
import { FaTrash } from 'react-icons/fa';
import Sidebar from './sidebar';
import { toast } from 'react-toastify';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const CustomerOrders = () => {
    const [sellers, setSellers] = useState([]);
    const [cartItems, setCartItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [revealedItems, setRevealedItems] = useState({});
    const [confirmDelete, setConfirmDelete] =useState(false);
    const [isInsufficient, setIsInsufficient] = useState(false);
    const navigate = useNavigate();
    const handleLogout = useHandleLogout();

    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null); // Track the socket connection

    const [activeTab, setActiveTab] = useState('cart');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const fetchSellers = useCallback(async () => {
        const token = localStorage.getItem('token');

        try {
            // Using Axios to make the GET request
            const response = await api.get('/customer/find-sellers', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            setSellers(response.data); // Update state with user data
            // console.log(sellers);
            setLoading(false); // Set loading to false
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        document.title = "Campus Eats | Orders";

        // Disable scrolling and zooming
        // document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        const storedCart = getCart(userId)
        setCartItems(storedCart);

        fetchSellers();
        checkCustomerAccess();

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

        const updateShowSeller = (data) => {
            setSellers((prevSellers) => {
                // Find the seller by their ID and update the is_selling status
                const updatedSellers = prevSellers.map((seller) =>
                    seller._id === data.sellerId
                        ? { ...seller, is_selling: data.isSelling } // Update the is_selling status
                        : seller
                );
                return updatedSellers;
            });
        };

        const handleMenuUpdated = (data) => {
            console.log('Menu item updated:', data.updatedItem);
        
            const cart = getCart(userId);
        
            const updatedCart = cart.map(item => 
                item._id === data.updatedItem._id 
                    ? { ...item, ...data.updatedItem }  // Merge updated data
                    : item
            );
        
            // Save the updated cart in localStorage
            localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCart));
        
            // Update state if you're using useState for cart
            setCartItems(updatedCart);
        };

        socketConnection.on('updateBalance', updateBalance);
        socketConnection.on('sellerStatusChanged', updateShowSeller);
        socketConnection.on('menuUpdated', handleMenuUpdated);
        
        // Clean up the styles on component unmount
        return () => {
            socketConnection.off('updateBalance', updateBalance);
            socketConnection.off('sellerStatusChanged', updateShowSeller);
            socketConnection.off('menuUpdated', handleMenuUpdated);
            socketConnection.disconnect();
            // document.body.style.overflow = 'auto';
            // document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkCustomerAccess, fetchSellers, userId]);


    const filteredItems = useMemo(() => {
        return cartItems.filter(item => item.status === 'cart');
    }, [cartItems]);

    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen); // Toggle the sidebar visibility
    };

    const handleIncreaseQuantity = (itemId) => {
        const item = filteredItems.find(item => item._id === itemId);
        addToCart(userId, item, 1); // Add 1 more quantity
        setCartItems(getCart(userId)); // Update cart items after addition
    };

    const handleDecreaseQuantity = (itemId) => {
        const item = filteredItems.find(item => item._id === itemId);
        if (item.quantity > 1) {
            addToCart(userId, item, -1); // Decrease 1 quantity
        } else {
            removeFromCart(userId, itemId, 1); // Remove item if quantity is 1
        }
        setCartItems(getCart(userId)); // Update cart items after decrease
    };

    // Function to handle item removal
    const handleRemoveItem = (itemId, quantity) => {
        removeFromCart(userId, itemId, quantity); // Remove item from localStorage
        const updatedCart = getCart(userId); // Get the updated cart from localStorage
        setCartItems(updatedCart); // Update the state with the new cart
    };

    // Function to handle clearing the entire cart
    const handleClearCart = () => {
        if (confirmDelete) {
            clearCart(userId); // Clear the cart from localStorage
            setCartItems([]); // Reset the cart state to an empty array
            setConfirmDelete(false);
        }
    };

    const handleToggleItem = (itemId) => {
        setSelectedItems(prevState => {
            if (prevState.includes(itemId)) {
                // If item is already selected, remove it
                return prevState.filter(id => id !== itemId);
            } else {
                // Otherwise, add it to the selected list
                return [...prevState, itemId];
            }
        });
    };

    const handleToggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            // If all items are selected, deselect all
            setSelectedItems([]);
        } else {
            // Otherwise, select all items
            // setSelectedItems(filteredItems.map(item => item._id));
            setSelectedItems(
                filteredItems
                    .filter(item => item.isAvailable && sellers.find(s => s._id === item.sellerId)?.is_selling)
                    .map(item => item._id)
            );
        }
    };

    const handleDragEnd = (event, info, item) => {
        const threshold = -100; // Drag left threshold to reveal button

        if (info.offset.x < threshold) {
            setRevealedItems((prev) => ({ ...prev, [item._id]: !prev[item._id] }));
        } else {
            setRevealedItems((prev) => ({ ...prev, [item._id]: false }));
        }
    };

    const handleDelete = (itemId, quantity) => {
        setRevealedItems((prev) => ({ ...prev, [itemId]: false }))
        // handleRemoveItem(itemId, quantity);
        // setRevealedItems((prev) => {
        //     const updated = { ...prev };
        //     delete updated[itemId];
        //     return updated;
        // });
        setTimeout(() => handleRemoveItem(itemId, quantity), 300);
    };

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
        return formatPrice(filteredItems
            .filter(item => selectedItems.includes(item._id)) // Only include selected items
            .reduce((total, item) => total + item.price * item.quantity, 0));
    };

    const handleOrder = async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage
        setIsProcessing(true);

        try {
            const response = await api.get(`${address}/customer/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const balance = response.data.user.balance;
            const totalPrice = filteredItems
                    .filter(item => selectedItems.includes(item._id))
                    .reduce((total, item) => total + item.price * item.quantity, 0);
            const selectedItemsToPay = filteredItems
                .filter(item => selectedItems.includes(item._id));

            console.log("Balance:", balance);
            console.log("Total Price:", totalPrice);

            // Check if any selected item is unavailable or the seller is offline
            const unavailableItems = selectedItemsToPay.filter(
                item => !item.isAvailable || !sellers.find(s => s._id === item.sellerId)?.is_selling
            );

            if (unavailableItems.length > 0) {
                console.log("Some items are unavailable or the seller is offline.");
                toast.error("Some selected items are unavailable or the seller is offline. Please update your selection.");
                return; // Stop the order process
            }

            if (balance < totalPrice) {
                console.log("Insufficient balance");
                setIsInsufficient(true);
            } else {
                addToPay(userId, selectedItemsToPay);

                console.log("This is the selected:", selectedItemsToPay);

                // Remove selectedItems from cartItems
                const updatedCartItems = filteredItems.filter(item => !selectedItems.includes(item._id));

                // Update the cart in localStorage as well
                // localStorage.setItem(`cart_${userId}`, JSON.stringify(updatedCartItems));
                // setCartItems(updatedCartItems);

                // Clear selectedItems after placing the order
                setSelectedItems([]);

                navigate('/customer/payment');
            }

        } catch (error) {
            console.error('Error:', error.response.data.message);
        } finally {
            setIsProcessing(false); // Re-enable the button after the operation is complete
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f5f7] to-gray-100 w-full fixed">
            <div className="absolute fixed inset-0 w-full h-full bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7] to-gray-200 z-[60] 
                        overflow-hidden">
                {/* Navigation Bar */}
                <header
                    className="w-full flex justify-between items-center px-4 py-3 fixed top-0 z-30 bg-[#f5f5f7]"
                >
                    <button className="text-gray-600" onClick={() => navigate("/customer")}>
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
                    <div className='flex justify-between items-center'
                    >
                        <h1 className="border border-orange-400 rounded-full py-0.5 px-2 inline-flex justify-center text-md mr-3">
                            <span className="text-orange-500 mr-1">UC </span>
                            <span className="text-orange-500">{balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </h1>
                        {/* <img className='w-8 h-8 rounded-full bg-blue-400' alt='Profile' onClick={toggleSidebar}
                            src={`${address}${profilePicture}`} /> */}
                        <div className="w-8 h-8 bg-indigo-500 text-white text-sm font-bold flex justify-center 
                                            items-center rounded-full overflow-hidden cursor-pointer"
                                onClick={toggleSidebar}>
                                    {profilePicture ? (
                                        <img
                                        src={profilePicture}
                                        alt="Profile"
                                        className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        `${username.charAt(0).toUpperCase()}`
                                    )}
                        </div>
                    </div>

                </header>

                {/* Sidebar with Animation */}
                <Sidebar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    user={user}
                    username={username}
                    profilePicture={profilePicture}
                    address={address}
                    handleLogout={handleLogout}
                />

                {/* Dark Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black z-[90]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onClick={toggleSidebar}
                    ></motion.div>
                    )}
                </AnimatePresence>

                {/* Pop up clear */}
                <AnimatePresence>
                    {confirmDelete && (
                        <motion.div
                            className="fixed right-0 z-[70] w-full h-full flex justify-center items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <motion.div
                                className="bg-white p-4 h-24 w-[12rem] rounded-lg flex flex-col gap-4 justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="flex items-center">
                                    <h3 className="text-lg">Empty Cart?</h3>
                                </div>
                                <div className="flex gap-4 items-center justify-end">
                                    <motion.button className="flex items-center justify-between gap-1"
                                            onClick={handleClearCart}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.3, stiffness: 800 }}
                                            >
                                        <h3 className="text-xs text-red-500">Clear</h3>
                                    </motion.button>
                                    <motion.button onClick={() => setConfirmDelete(false)} className="flex items-center justify-between gap-1"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.3, stiffness: 800 }}
                                        >
                                        <h3 className="text-xs">Cancel</h3>
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Insufficient balance */}
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
                    {(confirmDelete || isInsufficient) && (
                        <motion.div
                            className="fixed inset-0 bg-black z-[60]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        ></motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 relative overflow-visible lg:px-8">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20  }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-3xl font-bold p-4">Your Cart</motion.h1>
                </div>

                {filteredItems.length !== 0 && (
                    <div className="ml-auto flex justfify-end items-center -mt-2 mb-2 px-5 gap-4">
                        <button onClick={handleToggleSelectAll}
                            className={`flex ml-auto text-orange-500 hover:text-orange-600 active:text-orange-700
                                text-black active:scale-95 transition transform text-sm`}
                            >
                            {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <button onClick={() => setConfirmDelete(true)}
                            className="text-red-500 hover:text-red-700 transition text-sm"
                            >Clear Cart</button>
                    </div>
                )}

                <div className="overflow-y-auto scrollbar-hide w-full max-h-[600px] overflow-visible">
                    {filteredItems.length === 0 ? (
                        <motion.div className="lg:px-12 px-4 overflow-x-auto w-full overflow-hidden"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20  }}
                            transition={{ duration: 2, ease: "easeOut" }}>
                            <span className="text-center text-xl text-gray-500">Your cart is empty. Shop now!</span>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col pb-16 md:pb-52 lg:pb-52 mt-2">
                            <div className="px-4 overflow-y-auto max-h-[800px] scrollbar-hide">
                                <AnimatePresence>
                                    {filteredItems.map(item => (
                                        <div key={item._id} className="relative flex items-center mb-4">
                                            {/* Trash Button (Outside the Div) */}
                                            <AnimatePresence>
                                                {revealedItems[item._id] && (
                                                    <motion.button
                                                        initial={{ opacity: 0, x: -50 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 }}}
                                                        transition={{ duration: 0.5, stiffness: 300, damping: 80, ease: "easeOut" }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="absolute right-0 rounded-xl h-24 w-48 lg:w-96 bg-red-500 text-white p-4 flex items-center justify-end"
                                                        onClick={() => handleDelete(item._id, item.quantity)}
                                                    >
                                                        <motion.span
                                                            initial={{ x: -9 }}
                                                            animate={{ x: 9 }}
                                                            exit={{ x: -9 }}
                                                            transition={{ duration: 0.5, stiffness: 300, damping: 80, ease: "easeOut" }}>
                                                                <FaTrash className="text-2xl mr-3"/></motion.span>
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                                
                                            <motion.div className={`relative bg-white p-4 rounded-xl w-full h-24 flex items-center justify-start gap-4
                                                    `}
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0.5}
                                                    onDragEnd={(event, info) => handleDragEnd(event, info, item)}
                                                    // whileHover={{ scale: 1.025, transition: { duration: 0.4, ease: "easeOut"} }}
                                                    animate={{ x: revealedItems[item._id] ? -60 : 0,
                                                        scale: selectedItems.includes(item._id) ? 1.05 : 1,
                                                        // padding: selectedItems.includes(item._id) ? "1rem" : "0.5rem" 
                                                    }}
                                                    exit={{ opacity: 0, scale: 0 }}
                                                    transition={{ type: "spring", duration: 1, stiffness: 300, damping: 80, 
                                                        mass: 1, scale:{ ease: "easeOut", stiffness: 800 }}}
                                                >
                                                {(!item.isAvailable || !sellers.find(s => s._id === item.sellerId)?.is_selling) && (
                                                    <>
                                                        <p className="absolute inset-0 flex items-center justify-center text-white z-30 text-xs">
                                                            Unavailable
                                                        </p>
                                                        <div className="absolute inset-0 bg-black opacity-50 rounded-xl z-20"></div>
                                                    </>
                                                )}

                                                {/* Toggle to select/deselect the item */}
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(item._id)}
                                                        onChange={() => handleToggleItem(item._id)}
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
                                                            className={`w-4 h-4 text-white ${selectedItems.includes(item._id) ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth="3"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </motion.div>
                                                </label>
                                                <div className="relative flex justify-center items-center text-center">
                                                    {item.imageUrl ? (<img
                                                        src={item.imageUrl}
                                                        alt={item.name}
                                                        className="w-20 h-20 object-cover rounded-md"
                                                    />) : (
                                                        <>
                                                            <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                                                No image uploaded
                                                            </p>
                                                            <div className="w-20 h-20 bg-gray-400 rounded-md" />
                                                        </>
                                                    )}
                                                </div>
                                                <div className="relative flex-1">
                                                    <h3 className="text-sm">{item.name}</h3>
                                                    <p className="text-sm text-orange-500">UC {formatAmount(item.price)}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <button className={`w-5 h-5 rounded-full flex items-center justify-center text-xl 
                                                        transition ${item.quantity === 1 ? 'bg-gray-300 text-gray-500' : 'bg-orange-400 text-white hover:bg-orange-500'}`}
                                                        onClick={() => handleDecreaseQuantity(item._id)}
                                                        disabled={item.quantity === 1}>-</button>
                                                    <span className="w-6 text-center text-sm font-semibold text-gray-800">{item.quantity}</span>
                                                    <button className={`w-5 h-5 rounded-full flex items-center justify-center text-xl 
                                                        transition ${item.quantity === 20 ? 'bg-gray-300 text-gray-500' : 'bg-orange-400 text-white hover:bg-orange-500'}`}
                                                        onClick={() => handleIncreaseQuantity(item._id)}
                                                        disabled={item.quantity === 20}>+</button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            <div className="w-full">
                                {/* Add Button */}
                                <div className="fixed inset-x-0 bottom-0 flex flex-row justify-between 
                                    items-center px-4 py-6 z-20 bg-white gap-4">
                                    <div className="flex flex-col justify-start min-w-[100px] max-w-[150px] overflow-hidden">
                                        <span className="text-sm">Total</span>
                                        <span className="text-2xl font-bold">UC {getTotalSelectedPrice()}</span>
                                    </div>
                                    <motion.button
                                        onClick={handleOrder}
                                        className={`w-1/2 h-14 rounded-xl text-white text-sm font-semibold shadow-md flex justify-center items-center transition-color duration-300 ${
                                            selectedItems.length === 0 || isProcessing
                                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-orange-400 to-red-500'
                                        }`}
                                        whileHover={ selectedItems.length === 0 || isProcessing ? { scale: 1 } : { scale: 1.05 }}
                                        whileTap={ selectedItems.length === 0 || isProcessing ? { scale: 1 } : { scale: 0.95 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                                        disabled={selectedItems.length === 0 || isProcessing}
                                    >
                                        {isProcessing ? 'Processing...' : 'Proceed to payment'}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerOrders;
