import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/interceptor';
import { getOrders, completeOrder } from '../api/orderService';
import CancelOrderForm from '../utils/cancelorderform';
import RateProduct from '../utils/rateproduct';
import Header from '../utils/header';
import ShowOrder from './showorder';
import { FaStore } from 'react-icons/fa';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const CustomerPurchases = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState([]);
    const [showRatingForm, setShowRatingForm] = useState({});
    const [orderToRate, setOrderToRate] = useState(null);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);
    const [profilePicture, setProfilePicture] = useState(null);

    const [sellers, setSellers] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [viewOrder, setViewOrder] = useState(false);

    const token = localStorage.getItem('token');

    // Function to check if the user is an admin
    const checkCustomerAccess = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

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

    const fetchOrders = useCallback(async () => {
        try {
            const fetchedOrders = await getOrders(token); // Await the result
            setOrders(fetchedOrders || []); // Set orders to the fetched data or an empty array
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]); // Optionally set to an empty array on error
        }
    }, [token]);

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
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, []);

    useEffect(() => {

        checkCustomerAccess();

        fetchOrders();

        fetchSellers();

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);
        
        socketConnection.emit("registerUser", userId);

        const orderStatusChanged = (data) => {
            if (data.order.customerId === userId) {
                console.log("You heree");
                setOrders(prevOrders => {
                    return prevOrders.map(order => 
                        order._id === data.order._id 
                            ? { ...order, ...data.order } // Update the existing order
                            : order
                    );
                });
            }
        };

        const queueNumberUpdated = (data) => {
            console.log("Received Orders:", data);
            data.orders.forEach(updatedOrder => {  
                console.log("ID Order:", updatedOrder._id);
                if (updatedOrder.customerId === userId) {  
                    setOrders(prevOrders => {
                        return prevOrders.map(order =>  
                            order._id === updatedOrder._id  
                                ? { ...order, ...updatedOrder }  
                                : order  
                        )  
                    });  
                }  
            }); 
        }

        // Listen for new orders
        socketConnection.on('updateOrder', orderStatusChanged);
        socketConnection.on('updateQueue', queueNumberUpdated);
        
        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('updateQueue', queueNumberUpdated);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [userId, token, fetchOrders, checkCustomerAccess, fetchSellers]);

    useEffect(() => {
        // Update `selectedOrder` whenever `orders` change
        if (selectedOrder) {
            const updatedOrder = orders.find(o => o._id === selectedOrder._id);
            if (updatedOrder) {
                setSelectedOrder(updatedOrder);
            }
        }
    }, [orders, selectedOrder]);

    console.log("Selected Order:", selectedOrder);

    const tabs = ['pending', 'completed', 'cancelled'];

    const handleOrderView = (order) => {
        setSelectedOrder(order);
        setViewOrder(true);
    };

    return (
        <div className="flex flex-col items-center p-4">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                {viewOrder && (
                    <div className="absolute fixed inset-0 w-full h-full bg-gradient-to-br from-[#f5f5f7] to-gray-100 z-[60] 
                            overflow-hidden">
                        {/* Navigation Bar */}
                        <header
                            className="w-full flex justify-between items-center px-4 py-3 fixed top-4 z-30 bg-[#f5f5f7]"
                        >
                            <button className="text-gray-600 flex flex-row items-center gap-2" onClick={() => setViewOrder(false)}>
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
                                <h1 className="text-lg font-bold text-gray-800">Order Details</h1>
                            </button>
                        </header>

                        <ShowOrder
                            orderSelected={selectedOrder ? selectedOrder : null}
                            seller={sellers.find(s => s._id === selectedOrder.sellerId)?.store_name}
                        />
                    </div>
                )}


                {/* Header */}
                <Header
                    headerName={'My Orders'}
                    navigateTo={'/customer'}
                    bgColor={'[#f5f5f7]'}
                />
                
                <div className="absolute fixed inset-0 w-full h-full bg-gradient-to-br from-[#f5f5f7] to-gray-100 z-[0] 
                        overflow-hidden">
                    
                    <div className="mt-12 relative overflow-visible lg:px-8">
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20  }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="text-3xl font-bold p-4">Orders: {orders.length}</motion.h1>
                    </div>
                    
                    <div className="relative w-full">
                        <div className="flex flex-row w-full justify-start relative">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative text-sm font-semibold pb-2 transition w-[100px] ${
                                        activeTab === tab ? "text-orange-500" : "text-gray-600 hover:text-orange-400"
                                    }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        {/* Animated Bottom Border */}
                        <motion.div
                            className="absolute bottom-0 h-[3px] bg-orange-500"
                            layoutId="underline"
                            initial={false}
                            animate={{
                                left: `${tabs.indexOf(activeTab) * 100}px`,
                                width: "100px",
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                    </div>

                    <div className="w-full fixed p-4 max-h-[800px] pb-52 overflow-y-auto">
                        {/* Orders list */}
                        <div className="flex flex-col gap-4">
                            {orders
                                .filter(order => {
                                    if (activeTab === "pending") return ["pending", "pre-order", "preparing", "ready"].includes(order.status);
                                    return order.status === activeTab;
                                })
                                .map((order) => (
                                <motion.div 
                                    key={order._id} 
                                    className="p-4 bg-white rounded-xl w-full flex flex-col gap-2"
                                    onClick={() => {
                                    //     if (item.isAvailable) {
                                            handleOrderView(order);
                                    //     }
                                    }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20  }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ hover: { duration: 0.3, ease: "easeOut" },
                                                    x: { duration: 2, ease: "easeOut" }}}
                                >
                                    <div className='flex flex-row justify between border-b mb-1 gap-1'>
                                        <h2 className="font-semibold flex flex-row items-center gap-1 text-gray-800 text-md">
                                            <FaStore className="text-gray-600 font-normal text-sm" />
                                            {sellers.find(s => s._id === order.sellerId)?.store_name || "Unknown Store"}
                                        </h2>
                                        {(order?.orderType === "pre-order") && (
                                            <h4 className="font-light italic flex flex-row items-center gap-1 text-orange-500 text-xs">
                                                ({order?.orderType})
                                            </h4>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-row items-center justify-start gap-4">
                                        <div className="relative w-20 h-20 flex justify-start items-center text-center">
                                            {order.items.length > 1 && ( <>
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md z-10">
                                                    <p className="text-white text-xs">+{order.items.length - 1}</p>
                                                </div>
                                            </> )}
                                            {order.items[0].imageUrl ? (<img
                                                src={order.items[0].imageUrl}
                                                alt={order.orderNumber}
                                                className="w-20 h-20 object-cover rounded-md"
                                            />) : (
                                                <>
                                                    <p className="absolute inset-0 flex items-center justify-center bg-gray-400 rounded-md text-white z-10 text-xs">
                                                        No image uploaded
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex flex-row flex-grow">
                                            <div>
                                                <h3 className="font-bold text-sm">Order #{order.orderNumber || "N/A"}</h3>
                                                {/* <p className="text-gray-600">
                                                    {new Date(order.updatedAt).toLocaleString()}
                                                </p> */}
                                                <div className="text-xs">
                                                    {order.items.map((item, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span>{item.quantity}x {item.name}</span>
                                                    </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span
                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold
                                                    ${order.status === 'ready' ? 'bg-orange-100 text-orange-800' :
                                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {order.status}
                                            </span>
                                            
                                            <div className="pt-2 text-xs">
                                                <div className="flex justify-between gap-1 font-semibold">
                                                    {/* <span>Amount</span> */}
                                                    <span>₱{order.totalAmount}</span>
                                                </div>
                                            </div>

                                            {order.queueNumber && (
                                                <div className="pt-1 text-xs font-bold text-gray-700">
                                                    <div className="flex justify-between gap-1">
                                                        <span>Queue:</span>
                                                        <span>{order.queueNumber}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
        </div>
    );
};

export default CustomerPurchases;
