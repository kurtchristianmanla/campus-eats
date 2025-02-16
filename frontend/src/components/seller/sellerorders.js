import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import Header from '../utils/header';
import api from '../api/interceptor';
import Loading from '../utils/loading';
import { getOrders, startPreparingOrder, markOrderReady } from '../api/orderService';
import { toast } from 'react-toastify';
import CancelOrderForm from '../utils/cancelorderform';
import { motion, AnimatePresence } from 'framer-motion';

const protocol = process.env.REACT_APP_PROTOCOL || "http";
const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

const address = `${protocol}://${host_ip}:${backend_port}`;

const ManageOrders = () => {
    const [seller, setSeller] = useState([]);
    const [socket, setSocket] = useState(null); // Track the socket connection
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState([]);
    const [isSelling, setIsSelling] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

//   const navigate = useNavigate();

    // Function to fetch transaction data
    const fetchSellerData = async () => {
        const token = localStorage.getItem('token');
        try {
          const response = await api.get('/seller/manage-orders', {
              headers: {
                  'Authorization': `Bearer ${token}`,
              },
          });
      
          setSeller(response.data);
          setIsSelling(response.data.user.is_selling);
          setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setError('Error fetching orders.');
            setLoading(false);
        }
    };

    // Notification with sound
    const showNotification = (title, body) => {
        if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, { body });
            });
        }
    };
      
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

        fetchSellerData();

        fetchOrders();

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        const receiveNewOrder = (data) => {
            if (data.sellerId === sellerId) {
                // console.log(data.newOrder);
                // setOrders(prevOrders => [data.newOrder, ...prevOrders]);
                setOrders(prevOrders => {
                    const isDuplicate = prevOrders.some(order => order._id === data.newOrder._id);
                    if (!isDuplicate) {
                        return [data.newOrder, ...prevOrders];
                    }
                    return prevOrders; // Skip adding if duplicate
                });

                showNotification('New Order Received!', `Order ID: ${data.newOrder._id}`);
                
                // Optionally play a sound or show notification
                // playNotificationSound('New Order Received!');
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.sellerId === sellerId) {
                setOrders(prevOrders => {
                    return prevOrders.map(order => 
                        order._id === data.order._id 
                            ? { ...order, ...data.order } // Update the existing order
                            : order
                    );
                });
        
                showNotification('Order Status Updated!', `Order ID: ${data.order._id}`);
            }
        };

        const queueNumberUpdated = (data) => {
            console.log("Received Orders:", data);
            data.orders.forEach(updatedOrder => {  
                console.log("ID Order:", updatedOrder._id);
                if (updatedOrder.customerId === sellerId) {  
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
        socketConnection.on('updateQueue', queueNumberUpdated);
        socketConnection.on('overdueOrder', warningOverdueOrders);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('newOrder', receiveNewOrder); // Remove the listener
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('updateQueue', queueNumberUpdated);
            socketConnection.off('overdueOrder', warningOverdueOrders);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [sellerId, fetchOrders]);

    const toggleIsSelling = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await api.put('/seller/set-status', {
                is_selling: !isSelling,
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        
            console.log(response.data.status);
        
            if (response.status === 200) {
                setIsSelling(response.data.status);
            } else {
                toast.error(response.data.message || 'Changing Status Failed');
            }
        } catch (error) {
            console.error('Error setting store availability:', error);
            toast.error(error.response.data.message || 'Error setting store availability.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrepareOrder = async (orderId) => {
        try {
            const updatedOrder = await startPreparingOrder(token, orderId);
            console.log('Order status updated:', updatedOrder.status);
    
            // Update UI, show success notification, etc.
            toast.success(`Order #${orderId} is now in ${updatedOrder.status === 'preparing' ? "preparing" : "pre-order"} status.`);
        } catch (error) {
            toast.error('Failed to update the order.');
        }
    };

    const handleOrderReady = async (orderId) => {
        try {
            const updatedOrder = await markOrderReady(token, orderId);
            console.log('Order updated:', updatedOrder);
    
            // Update UI, show success notification, etc.
            toast.success(`Order #${orderId} is now in "Ready" status.`);
        } catch (error) {
            toast.error('Failed to update the order.');
        }
    };

    if (loading) {
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

                {/* Header */}
                <Header
                    headerName={'Manage Orders'}
                    navigateTo={'/seller'}
                />
                <p className="text-center text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            <Header headerName={'Manage Orders'} navigateTo={'/seller'} />

            <div className="w-full">
                <h2 className="text-2xl font-bold mb-4">Orders</h2>

                {/* Order Tabs */}
                <div className="flex mb-4 overflow-x-hidden">
                    {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            className={`px-4 py-2 rounded text-sm ${
                                activeTab === status ? 'bg-orange-500 text-white' : 'bg-gray-200'
                            }`}
                            onClick={() => setActiveTab(status)}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="grid gap-4">
                    {orders
                        .filter(order => order.status === activeTab)
                        .map((order) => (
                            <motion.div
                                key={order._id}
                                className="border p-4 rounded-lg shadow-md bg-white"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold">Order #{order.orderNumber}</h3>
                                        <p className="text-gray-600">
                                            {new Date(order.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                            order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                            'bg-red-100 text-red-800'
                                        }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div className="mt-4">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between py-2">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>₱{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total Amount */}
                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between font-bold">
                                        <span>Total</span>
                                        <span>₱{order.totalAmount}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-4 flex gap-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handlePrepareOrder(order._id)}
                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                            >
                                                Accept
                                            </button>
                                            <CancelOrderForm orderId={order._id} token={token} label={'Reject'} />
                                        </>
                                    )}
                                    {order.status === 'preparing' && (
                                        <>
                                            <button
                                                onClick={() => handleOrderReady(order._id)}
                                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                            >
                                                Mark as Ready
                                            </button>
                                            <CancelOrderForm orderId={order._id} token={token} label={'Cancel Preparing'} />
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                </div>
            </div>

            {/* Store Status Toggle */}
            <div className="fixed bottom-0 p-4 z-20 w-full max-w-md">
                <button
                    onClick={toggleIsSelling}
                    className="w-full px-10 py-3 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md hover:scale-105 transform transition duration-300"
                >
                    MAKE STORE {isSelling ? 'OFFLINE' : 'ONLINE'}
                </button>
            </div>
        </div>
    );
}

export default ManageOrders;
