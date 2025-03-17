import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaHeart, FaStar, FaShoppingCart } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import api from '../api/interceptor';
import useHandleLogout from '../api/logout';
import { io } from 'socket.io-client';
import ShowItem from './showitem';
import Sidebar from './sidebar';
import { getOrders } from '../api/orderService';
import { useNotification } from '../utils/notification';
import { toast } from 'react-toastify';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const CustomerPage = () => {
    const navigate = useNavigate();
    const handleLogout = useHandleLogout();
    const { showNotification } = useNotification();
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null); // Track the socket connection

    const [sellers, setSellers] = useState([]);
    const [ratedItems, setRatedItems] = useState([]);
    const [viewState, setViewState] = useState('selectStores');
    const [viewSeller, setViewSeller] = useState(null);
    const [viewStoreName, setViewStoreName] = useState('');
    const [menuItems, setMenuItems] = useState([]);
    const [recommendation, setRecommendation] = useState([]);
    const [lastOrder, setLastOrder] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewItem, setViewItem] = useState(false);
    const [orders, setOrders] = useState([]);

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

            const response = await api.get(`${address}/customer/profile`, {
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
    
    const fetchRatedItems = useCallback(async () => {
        const token = localStorage.getItem('token');

        try {
            // Using Axios to make the GET request
            const response = await api.get('/customer/find-items', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            setRatedItems(response.data); // Update state with user data
            // console.log(sellers);
            setLoading(false); // Set loading to false
        } catch (error) {
            console.error('Error fetching items:', error);
            setLoading(false);
        }
    }, []);

    const fetchMenu = useCallback((sellerId) => {
        // Fetch menu items
        api.get(`/menu/seller/${sellerId}`)
            .then((response) => {
                setMenuItems(response.data.menuItems || []);
            })
            .catch((error) => {
                console.error('Error fetching menu items:', error);
            });
    }, []);

    const fetchRecommendations = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            // Using Axios to make the GET request
            const response = await api.get('/customer/recommendations', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log(response.data);
            setRecommendation(response.data.recommendedItems); // Update state with user data
            setLastOrder(response.data.lastOrder);
            // console.log(sellers);
            setLoading(false); // Set loading to false
        } catch (error) {
            console.error('Error fetching items:', error);
            setLoading(false);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        const token = localStorage.getItem('token');

        try {
            const fetchedOrders = await getOrders(token); // Await the result
            setOrders(fetchedOrders || []); // Set orders to the fetched data or an empty array
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]); // Optionally set to an empty array on error
        }
    }, []);

    // Run the check when the component mounts
    useEffect(() => {
        document.title = "Campus Eats | Customer";

        // Disable scrolling and zooming
        // document.body.style.overflow = 'hidden';
        document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

        checkCustomerAccess();
        
        fetchSellers();
        fetchRatedItems();
        fetchRecommendations();
        fetchOrders();

        if (viewSeller) {
            fetchMenu(viewSeller);
        }

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

        // Use fat arrow function to preserve the state context
        const handleMenuAdded = (data) => {
            if (data.sellerId === viewSeller) {
                console.log('New menu item added:', data.newItem);
                setMenuItems((prevItems) => [...prevItems, data.newItem]);
            }
        };

        const handleMenuUpdated = (data) => {
            if (data.sellerId === viewSeller) {
                console.log('Menu item updated:', data.updatedItem);
                setMenuItems((prevItems) =>
                    prevItems.map((item) =>
                        item._id === data.updatedItem._id ? data.updatedItem : item
                    )
                );
            }

            setRatedItems((prevItems) =>
                prevItems.map((item) =>
                    item._id === data.updatedItem._id ? { ...item, ...data.updatedItem } : item
                )
            );
        };

        const handleMenuDeleted = (data) => {
            if (data.sellerId === viewSeller) {
                console.log('Menu item deleted:', data.deletedItem);
                setMenuItems((prevItems) =>
                    prevItems.filter((item) => item._id !== data.deletedItem._id)
                );
            }
        };
        
        const orderStatusChanged = (data) => {
            if (data.order.customerId === userId) {
                setOrders(prevOrders => {
                    return prevOrders.map(order => 
                        order._id === data.order._id 
                            ? { ...order, ...data.order } // Update the existing order
                            : order
                    );
                });

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

        socketConnection.on('sellerStatusChanged', updateShowSeller);
        
        // Add event listeners with the context-preserving functions
        socketConnection.on('menuAdded', handleMenuAdded);
        socketConnection.on('menuUpdated', handleMenuUpdated);
        socketConnection.on('menuDeleted', handleMenuDeleted);
        
        // Clean up the styles on component unmount
        return () => {
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('balanceAdded', updateBalance);
            socketConnection.off('sellerStatusChanged', updateShowSeller);
            socketConnection.off('menuAdded', handleMenuAdded);
            socketConnection.off('menuUpdated', handleMenuUpdated);
            socketConnection.off('menuDeleted', handleMenuDeleted);
            socketConnection.disconnect();
            // document.body.style.overflow = 'auto';
            // document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [checkCustomerAccess, fetchSellers, viewSeller, fetchMenu, userId, 
        fetchRatedItems, fetchRecommendations, fetchOrders, showNotification]);

    const [sellersWithRatings, setSellersWithRatings] = useState([]);

    useEffect(() => {
        const updatedSellers = sellers.map(store => ({
            ...store,
            sellerRating: store.seller_rating ? store.seller_rating.toFixed(1) : "No ratings",
        }));
        setSellersWithRatings(updatedSellers);
    }, [sellers]);

    // Count sellers with a random rating of 4 or higher
    const countSellersWithHighRating = sellersWithRatings.filter(store => parseFloat(store.sellerRating) >= 4).length;

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen); // Toggle the sidebar visibility
    };

    const toggleViewStores = () => {
        setViewState(prev => (prev === 'allStores' ? 'selectStores' : 'allStores'));
    };

    const toggleViewSellers = () => {
        setViewState('selectStores');
        setViewSeller(null);
    };

    // Handle View Seller
    const handleViewSeller = (store) => {
        setViewStoreName(store.store_name)
        setViewSeller(store._id);
        setViewState('showMenu');
    };

    const handleOrderItem = (item) => {
        setSelectedItem(item);
        setViewItem(true);
    };

    // Disable scrolling when sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }

        // Cleanup function to remove the class when the component unmounts
        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isSidebarOpen]);

    return (
        <div className={`min-h-screen bg-gradient-to-br from-[#f5f5f7] to-gray-100 w-full ${viewItem ? 'fixed' : ''}`}>
            {viewItem && (
                <div className="absolute fixed inset-0 w-full h-full bg-gradient-to-br from-[#f5f5f7] to-gray-100 z-[60] 
                        overflow-hidden">
                    {/* Navigation Bar */}
                    <header
                        className="w-full flex justify-between items-center px-4 py-3 fixed top-0 z-30 bg-[#f5f5f7]"
                    >
                        <button className="text-gray-600" onClick={() => setViewItem(false)}>
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

                    <ShowItem
                        userId={userId}
                        menuItemId={selectedItem ? selectedItem._id : null} 
                        fetchMenu={fetchMenu}
                        item={selectedItem}
                        setViewItem={setViewItem}
                    />
                </div>
            )}

            {/* Navigation Bar */}
            <header
                className="w-full flex justify-between items-center px-4 py-3 fixed top-0 z-30 bg-[#f5f5f7]"
            >
                <motion.button className="text-2xl text-gray-800 hover:text-orange-600 transition-colors duration-300 ease-out" 
                        onClick={() => navigate('/customer/cart')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        animate: { duration: 1, ease: "easeInOut" },
                        hover: { duration: 0.3, ease: "easeOut" },
                    }}
                ><FaShoppingCart />
                </motion.button>
                <motion.div className='flex justify-between items-center'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
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
                </motion.div>

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
                orderCount={orders.filter(order => ['preparing', 'ready'].includes(order.status)).length}
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

            {/* Logo */}
            <motion.div
                className="absolute z-0 top-60 left-11  transform translate-x-[-50%]
                        translate-y-[-50%] md:translate-x-0 md:translate-y-0 md:top-4 md:left-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            >
                <img
                src="/test/campus-eats-logo.png"
                alt="Campus Eats Logo"
                className="w-128 h-128 md:w-48 md:h-48 object-contain opacity-20 blur-sm"
                />
            </motion.div>

            {/* Main Content */}
            <div className="mt-12 relative overflow-visible lg:px-8">
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20  }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="text-3xl font-bold p-4">Enjoy Delicious Food</motion.h1>
                
                {(lastOrder !== null && viewState === 'selectStores') && (
                    <>
                        {/* Recommendations */}
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10  }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex justify-between items-center mt-2 px-4">
                            <p className="text-sm font-semibold text-gray-800">
                                <span>Since you last ordered</span>
                                <span className="ml-1 text-orange-500">{lastOrder?.items[0].name}</span>
                                <span>, you might be interested in</span>
                            </p>
                        </motion.div>

                        <div className="px-4 overflow-x-auto scrollbar-hide scroll-smooth w-full overflow-hidden">
                            <div className="flex my-2 flex-nowrap gap-4 pb-4 min-w-max lg:grid lg:grid-cols-5 overflow-visible">
                            {recommendation.length === 0 ? (
                                <div className="text-center text-xl text-gray-500 mb-4">No popular foods available</div>
                            ) : (
                                recommendation
                                    .filter(item => item.isAvailable && item.sellerId?.is_selling)
                                    .sort((a, b) => b.averageRating - a.averageRating)
                                    .map((item, index) => (
                                    <motion.div key={index} className="relative bg-white p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block 
                                                scroll-ml-4 first:ml-0 flex flex-col overflow-hidden justify-between"
                                            onClick={() => {
                                                if (item.isAvailable && item.sellerId?.is_selling) {
                                                    handleOrderItem(item);
                                                }
                                            }}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20  }}
                                            whileHover={(item.isAvailable && item.sellerId?.is_selling) ? { scale: 1.05 } : { scale: 1 }}
                                            whileTap={(item.isAvailable && item.sellerId?.is_selling) ? { scale: 0.95 } : { scale: 1 }}
                                            transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                            x: { duration: 2, ease: "easeOut" }}}
                                    >
                                        <div className="flex justify-center mb-2 flex-col">
                                            {item.imageUrl ? (<img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-44 h-44 object-cover rounded-md"
                                            />) : (
                                                <div className="relative">
                                                    <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                                        No image uploaded
                                                    </p>
                                                    <div className="w-44 h-44 bg-gray-400 rounded-md" />
                                                </div>
                                            )}
                                            <h3 className="font-medium text-sm mt-2">{item.name}</h3>
                                            <p className="text-[0.6rem] text-gray-500 mb-6">{item.sellerId?.store_name}</p>
                                        </div>
                                        <div className="text-left">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center text-sm">
                                                    {item.price} UC
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )))}
                            </div>
                        </div>
                    </>
                )}

                {/* Popular Restaurants Header */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10  }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="flex justify-between items-center px-4">
                    {viewSeller ? (
                            <>
                                <motion.span
                                key={`${viewState}-${viewSeller}`}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5  }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-sm font-semibold text-gray-600">{viewStoreName}</motion.span>
                                <span className="text-xs text-orange-500 hover:underline cursor-pointer"
                                        onClick={toggleViewSellers}>
                                    Browse other store menus
                                </span>
                            </>
                        ):(
                        <>
                            <motion.span
                                key={`${viewState}-${viewSeller}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10  }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-sm font-semibold text-gray-600">{viewState === 'selectStores' ? 'Popular stores' : 'All stores'}</motion.span>
                            <span className="text-xs text-orange-500 hover:underline cursor-pointer"
                                    onClick={toggleViewStores}>
                                {viewState === 'selectStores' ? 'View all stores' : 'View popular stores'}
                                ({viewState === 'selectStores' ? sellers.length : countSellersWithHighRating})
                            </span>
                        </>
                    )}
                </motion.div>

                {viewState === 'showMenu' && (
                    // Menu Items List
                    <>
                        {menuItems.length === 0 ? (
                            <div className="px-4 mt-4 overflow-x-auto w-full overflow-hidden">
                                <span className="text-center text-xl text-gray-500">This store currently has no products available.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 overflow-y-auto mt-4 scrollbar-hide">
                                {menuItems.map((item) => (
                                    <motion.div key={item._id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20  }}
                                        whileHover={ item.isAvailable ? { scale: 1.05 } : { scale: 1 } }
                                        whileTap={ item.isAvailable ? { scale: 0.95 } : { scale: 1 } }
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                    y: { duration: 1, ease: "easeOut" }}}
                                        className="p-4 rounded-xl flex flex-col items-center cursor-pointer"
                                        onClick={() => { 
                                            if (item.isAvailable) {
                                                handleOrderItem(item);
                                            }
                                        }}
                                    >
                                        {/* Item Picture */}
                                        <div className="flex-shrink-0 justify-center mb-3">
                                            <div className="w-52 h-52 bg-indigo-500 text-white text-6xl font-bold
                                                        rounded-lg overflow-hidden flex items-center justify-center relative">
                                                {item.imageUrl ? (
                                                    <img
                                                        src={item.imageUrl}
                                                        alt={`${item.name}`}
                                                        className="object-cover w-full h-full"
                                                        />
                                                ) : (
                                                    `${item.name.charAt(0).toUpperCase()}`
                                                )}
                                                {!item.isAvailable && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg z-10">
                                                        <p className="text-white text-xs font-semibold z-20">Unavailable</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <h1 className="font-semibold text-2xl text-center">{item.name}</h1>
                                        <div className="flex justify-between items-center gap-4 text-sm text-gray-600">
                                            <p>{item.price} UC</p>
                                            <p>{item.minPrepTime}-{item.maxPrepTime} Min</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {viewState === 'allStores' && (
                    <div className="px-4 overflow-y-auto scrollbar-hide h-full w-full overflow-visible">
                        <div className="flex flex-col gap-4 pb-4 mt-6 overflow-visible">
                        {sellers
                            // Sort sellers by their random rating
                            .sort((a, b) => a.store_name.localeCompare(b.store_name))
                            .map((store, index) => (
                            <motion.div key={index} className="relative bg-white p-4 rounded-xl w-full h-24 flex items-center justify-end
                                    shadow-md overflow-hidden"
                                onClick={() => {
                                    if (store.is_selling) {
                                        handleViewSeller(store);
                                    }
                                }}
                                whileHover={store.is_selling ? { x: -10 } : { scale: 1 }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -20  }}
                                whileTap={store.is_selling ? { scale: 0.95 } : { scale: 1 }}
                                transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                y: { duration: 1, ease: "easeOut" }}}
                            >
                                {!store.is_selling && (
                                    <>
                                        <p className="absolute inset-0 flex items-center justify-center text-white z-30 text-xs">
                                            Unavailable
                                        </p>
                                        <div className="absolute inset-0 bg-black opacity-50 rounded-xl z-20"></div>
                                    </>
                                )}
                                <div className="relative z-10 flex justify-between items-center h-full w-full">
                                    <div className="text-left">
                                        <h3 className="font-medium text-lg">{store.store_name}</h3>
                                        <p className="text-[0.7rem] text-gray-500">{store.location || 'PHINMA UPANG'}</p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-20">
                                        {store.seller_rating  && (<FaStar className="w-4 h-4 text-yellow-500" />)}
                                        <span className="text-xs">
                                            {store.seller_rating ? store.seller_rating.toFixed(1) : "No ratings"}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-center items-center h-full">
                                    {store.profile_picture ? (<img
                                        src={store.profile_picture}
                                        alt={store.store_name}
                                        className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-xl"
                                    />) : (
                                        <>
                                            <div className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-xl bg-white"/>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                        </div>
                    </div>
                )}
                
                {viewState === 'selectStores' && (
                    <div className="px-4 overflow-x-auto scrollbar-hide scroll-smooth w-full overflow-hidden">
                        <div className="flex my-2 flex-nowrap gap-4 pb-4 min-w-max lg:grid lg:grid-cols-5 overflow-visible">
                        {(sellersWithRatings
                            .filter((store) => store.sellerRating >= 4 && store.sellerRating <= 5)
                            .sort((a, b) => b.sellerRating - a.sellerRating)).length === 0 ? (
                            <div className="text-center text-xl text-gray-500 mb-4">No popular stores available</div>
                        ) : (
                            sellersWithRatings
                                .filter((store) => store.sellerRating >= 4 && store.sellerRating <= 5)
                                // Sort sellers by their random rating
                                .sort((a, b) => b.sellerRating - a.sellerRating)
                                .map((store, index) => (
                                <motion.div key={index} className="relative bg-white p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block 
                                            scroll-ml-4 first:ml-0 flex flex-col overflow-hidden"
                                        onClick={() => {
                                            if (store.is_selling) {
                                                handleViewSeller(store);
                                            }
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20  }}
                                        whileHover={store.is_selling ? { scale: 1.05 } : { scale: 1 }}
                                        whileTap={store.is_selling ? { scale: 0.95 } : { scale: 1 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                        x: { duration: 1, ease: "easeOut" }}}
                                >
                                {!store.is_selling && (
                                    <>
                                        <p className="absolute inset-0 flex items-center justify-center text-white z-30 text-xs">
                                            Unavailable
                                        </p>
                                        <div className="absolute inset-0 bg-black opacity-50 rounded-xl z-20"></div>
                                    </>
                                )}
                                <div className="relative flex justify-center mb-2">
                                    {store.profile_picture ? (<img
                                        src={store.profile_picture}
                                        alt={store.store_name}
                                        className="w-44 h-44 object-cover rounded-md"
                                    />) : (
                                        <>
                                            <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                                No image uploaded
                                            </p>
                                            <div className="w-44 h-44 bg-gray-400 rounded-md" />
                                        </>
                                    )}
                                </div>
                                <div className="text-left mb-auto">
                                    <h3 className="font-medium text-sm">{store.store_name}</h3>
                                    <p className="text-[0.7rem] text-gray-500 mb-6">{store.location || 'PHINMA UPANG'}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center">
                                            {store.seller_rating  && (<FaStar className="w-4 h-4 text-yellow-500" />)}
                                            <span className="text-xs ml-1">
                                                {store.sellerRating}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )))}
                        </div>
                    </div>
                )}

                {/* Online Stores */}
                {viewState === 'selectStores' && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10  }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex justify-between items-center mt-2 px-4">
                        <span className="text-sm font-semibold text-gray-600">Online Stores</span>
                    </motion.div>
                )}

                {viewState === 'selectStores' && (
                    <div className="px-4 overflow-x-auto scrollbar-hide scroll-smooth w-full overflow-hidden">
                        <div className="flex my-2 flex-nowrap gap-4 pb-4 min-w-max lg:grid lg:grid-cols-5 overflow-visible">
                        {(sellersWithRatings
                            .filter((store) => store.is_selling).length === 0) ? (
                            <div className="text-center text-xl text-gray-500 mb-4">No online stores available</div>
                        ) : (
                            sellersWithRatings
                                .filter((store) => store.is_selling)
                                .sort((a, b) => a.store_name.localeCompare(b.store_name))
                                .map((store, index) => (
                                <motion.div key={index} className="relative bg-white p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block 
                                            scroll-ml-4 first:ml-0 flex flex-col overflow-hidden"
                                        onClick={() => {
                                            if (store.is_selling) {
                                                handleViewSeller(store);
                                            }
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20  }}
                                        whileHover={store.is_selling ? { scale: 1.05 } : { scale: 1 }}
                                        whileTap={store.is_selling ? { scale: 0.95 } : { scale: 1 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                        x: { duration: 2, ease: "easeOut" }}}
                                >
                                {!store.is_selling && (
                                    <>
                                        <p className="absolute inset-0 flex items-center justify-center text-white z-30 text-xs">
                                            Unavailable
                                        </p>
                                        <div className="absolute inset-0 bg-black opacity-50 rounded-xl z-20"></div>
                                    </>
                                )}
                                <div className="relative flex justify-center mb-2">
                                    {store.profile_picture ? (<img
                                        src={store.profile_picture}
                                        alt={store.store_name}
                                        className="w-44 h-44 object-cover rounded-md"
                                    />) : (
                                        <>
                                            <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                                No image uploaded
                                            </p>
                                            <div className="w-44 h-44 bg-gray-400 rounded-md" />
                                        </>
                                    )}
                                </div>
                                <div className="text-left mb-auto">
                                    <h3 className="font-medium text-sm">{store.store_name}</h3>
                                    <p className="text-[0.7rem] text-gray-500 mb-6">{store.location || 'PHINMA UPANG'}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center">
                                            {store.seller_rating && (<FaStar className="w-4 h-4 text-yellow-500" />)}
                                            <span className={`text-xs ${store.seller_rating ? "ml-1" : ""}`}>
                                                {store.sellerRating}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )))}
                        </div>
                    </div>
                )}

                {/* Popular Foods */}
                {viewState === 'selectStores' && (
                    <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10  }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex justify-between items-center mt-2 px-4">
                        <span className="text-sm font-semibold text-gray-600">Popular Foods</span>
                    </motion.div>
                )}

                {viewState === 'selectStores' && (
                    <div className="px-4 overflow-x-auto scrollbar-hide scroll-smooth w-full overflow-hidden">
                        <div className="flex my-2 flex-nowrap gap-4 pb-4 min-w-max lg:grid lg:grid-cols-5 overflow-visible">
                        {ratedItems.length === 0 ? (
                            <div className="text-center text-xl text-gray-500 mb-4">No popular foods available</div>
                        ) : (
                            ratedItems
                                .sort((a, b) => b.averageRating - a.averageRating)
                                .map((item, index) => (
                                <motion.div key={index} className="relative bg-white p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block 
                                            scroll-ml-4 first:ml-0 flex flex-col overflow-hidden justify-between"
                                        onClick={() => {
                                            // if (item.isAvailable) {
                                            //     handleOrderItem(item);
                                            // }
                                            const sellerInfo = sellers.find(s => s._id === item.sellerId); // Find the seller
                                            if (item.isAvailable && sellerInfo?.is_selling) {
                                                handleOrderItem(item);
                                            }
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20  }}
                                        whileHover={(item.isAvailable && sellers.find(s => s._id === item.sellerId)?.is_selling) ? { scale: 1.05 } : { scale: 1 }}
                                        whileTap={(item.isAvailable && sellers.find(s => s._id === item.sellerId)?.is_selling) ? { scale: 0.95 } : { scale: 1 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                        x: { duration: 2, ease: "easeOut" }}}
                                >
                                {(!item.isAvailable || !sellers.find(s => s._id === item.sellerId)?.is_selling) && (
                                    <>
                                        <p className="absolute inset-0 flex items-center justify-center text-white z-30 text-xs">
                                            Unavailable
                                        </p>
                                        <div className="absolute inset-0 bg-black opacity-50 rounded-xl z-20"></div>
                                    </>
                                )}
                                <div className="flex justify-center mb-2 flex-col">
                                    {item.imageUrl ? (<img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="w-44 h-44 object-cover rounded-md"
                                    />) : (
                                        <div className="relative">
                                            <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                                No image uploaded
                                            </p>
                                            <div className="w-44 h-44 bg-gray-400 rounded-md" />
                                        </div>
                                    )}
                                    <h3 className="font-medium text-sm mt-2">{item.name}</h3>
                                    <p className="text-[0.7rem] text-gray-500 mb-6">{item.price} UC</p>
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center">
                                            {item.averageRating  && (<FaStar className="w-4 h-4 text-yellow-500" />)}
                                            <span className="text-xs">
                                                {item.averageRating.toFixed(1)}</span>
                                        </div>
                                        <FaHeart className="w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            </motion.div>
                        )))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerPage;
