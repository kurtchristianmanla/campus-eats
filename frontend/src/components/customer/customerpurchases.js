import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/interceptor';
import { getOrders } from '../api/orderService';
import Header from '../utils/header';
import ShowOrder from './showorder';
import { FaStore } from 'react-icons/fa';
import { useNotification } from '../utils/notification';
import { SkeletonOrderItem } from '../utils/skeletonloading';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const CustomerPurchases = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState([]);
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
    const { showNotification } = useNotification();

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
        } finally {
            setIsLoading(false); // Set loading to false when done
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
        document.title = "Campus Eats | Orders";

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

                // Show notification with updated status text
                if (data.order.status !== 'completed'){
                    showNotification(
                    'Order Status Updated!', 
                    `Order #${data.order.orderNumber} is now ${statusText}.`,
                    'customer'
                    );
                }
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
    }, [userId, token, fetchOrders, checkCustomerAccess, fetchSellers, showNotification]);

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
                            className="text-3xl font-bold p-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-700">
                                        {activeTab === 'pending' ? 'Active' : 
                                        activeTab === 'completed' ? 'Completed' : 
                                        'Cancelled'}:
                                    </span>
                                    <span className="text-gray-700">
                                        {orders.filter(order => {
                                            if (activeTab === "pending") return ["pending", "pre-order", "preparing", "ready"].includes(order.status);
                                            return order.status === activeTab;
                                        }).length}
                                    </span>
                                </div>
                            </motion.h1>
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
                    {isLoading ? (
                        <div className="flex flex-col gap-4">
                            {[...Array(4)].map((_, index) => (
                                <motion.div
                                    key={`skeleton-${index}`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ 
                                        delay: index * 0.1,
                                        duration: 0.3,
                                        ease: "easeOut"
                                    }}
                                >
                                    <SkeletonOrderItem />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
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
                                    onClick={() => handleOrderView(order)}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ 
                                        hover: { duration: 0.2, ease: "easeOut" },
                                        x: { duration: 0.5, ease: "easeOut" }
                                    }}
                                >
                                    {/* Store Name Row */}
                                    <div className='flex flex-row justify-between items-center border-b pb-1 mb-2'>
                                        <h2 className="font-semibold flex items-center gap-2 text-gray-800 text-sm min-w-0 truncate">
                                            <FaStore className="text-gray-600 text-sm flex-shrink-0" />
                                            <span className="truncate">
                                                {sellers.find(s => s._id === order.sellerId)?.store_name || "Unknown Store"}
                                            </span>
                                        </h2>
                                        {order?.orderType === "pre-order" && (
                                            <span className="font-light italic text-orange-500 text-xs whitespace-nowrap">
                                                ({order?.orderType})
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Order Content Row */}
                                    <div className="flex items-start gap-3 w-full">
                                        {/* Image Container - Fixed Size */}
                                        <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                                            {order.items[0].imageUrl ? (
                                                <img
                                                    src={order.items[0].imageUrl}
                                                    alt={order.orderNumber}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-500 text-xs">No image</span>
                                                </div>
                                            )}
                                            {order.items.length > 1 && (
                                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                                    <span className="text-white text-xs">+{order.items.length - 1}</span>
                                                </div>
                                            )}
                                        </div>
                                
                                        {/* Order Details - Flexible Width */}
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-sm mb-1 truncate">Order #{order.orderNumber || "N/A"}</h3>
                                            <div className="text-xs space-y-1">
                                                {order.items.slice(0, 2).map((item, index) => (
                                                    <div key={index} className="flex justify-between">
                                                        <span className="truncate">{item.quantity}x {item.name}</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <div className="text-gray-500">+{order.items.length - 2} more items</div>
                                                )}
                                            </div>
                                        </div>
                                
                                        {/* Right Side Status/Amount - Fixed Width */}
                                        <div className="flex flex-col items-end w-24 flex-shrink-0 gap-1">
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap
                                                ${order.status === 'ready' ? 'bg-orange-100 text-orange-800' :
                                                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                  'bg-yellow-100 text-yellow-800'}`}
                                            >
                                                {order.status}
                                            </span>
                                            
                                            <div className="text-xs font-semibold text-right">
                                                UC {order.totalAmount}
                                            </div>
                                
                                            {order.queueNumber && (
                                                <div className="text-xs font-bold text-gray-700">
                                                    <div className="flex items-center gap-1">
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
                    )}
                    </div>
                </div>
        </div>
    );
};

export default CustomerPurchases;
