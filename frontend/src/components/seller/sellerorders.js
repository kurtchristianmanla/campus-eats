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

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ManageOrders = () => {
    const [seller, setSeller] = useState([]);
    const [socket, setSocket] = useState(null); // Track the socket connection
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState([]);
    const [isSelling, setIsSelling] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // const [showAcceptButton, setShowAcceptButton] = useState(true);
    // const [showReadyButton, setShowReadyButton] = useState(true);
    const [buttonStates, setButtonStates] = useState({});
    const [visibleTransactions, setVisibleTransactions] = useState({});


    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

    const toggleButtonState = (orderId, buttonType, value) => {
        setButtonStates(prev => ({
            ...prev,
            [orderId]: {
                ...prev[orderId],  // Preserve existing states for the order
                [buttonType]: value // Update only the specified button state
            }
        }));
    };

    const toggleVisibility = (orderId) => {
        setVisibleTransactions((prevState) => ({
            ...prevState,
            [orderId]: !prevState[orderId], // Toggle only the clicked order
        }));
    };
    
    const handleTabClick = (status) => {
        setActiveTab(status);
        setButtonStates({}); // Reset all button states when changing tabs
    };

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
                    // if (!isDuplicate) {
                    //     return [data.newOrder, ...prevOrders];
                    // }
                    if (!isDuplicate) {
                        const newOrders = [...prevOrders, data.newOrder]; // Append instead of prepend
                        return newOrders.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
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
                if (updatedOrder.sellerId === sellerId) {  
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
            toast.success(`Order #${updatedOrder.orderNumber} is now in ${updatedOrder.status === 'preparing' ? "preparing" : "pre-order"} status.`);
        } catch (error) {
            toast.error('Failed to update the order.');
        }
    };

    const handleOrderReady = async (orderId) => {
        try {
            const updatedOrder = await markOrderReady(token, orderId);
            console.log('Order updated:', updatedOrder);
    
            // Update UI, show success notification, etc.
            toast.success(`Order #${updatedOrder.orderNumber} is now in "Ready" status.`);
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

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
            <Header headerName={'Manage Orders'} navigateTo={'/seller'} />

            <div className="w-full">
                <h2 className="text-xl font-bold mb-4">{seller?.user.store_name || "Seller"} 
                    <span className='text-orange-500 ml-1'>Orders</span>
                </h2>

                {/* Order Tabs */}
                <div className="grid grid-cols-3 scrollbar-hide gap-1 mb-4">
                    {['pending', 'pre-order', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => {
                        const orderCount = orders.filter(order => order.status === status).length;
                        const shouldShowCount = ['pending', 'pre-order', 'preparing', 'ready'].includes(status);

                    return (
                        <button
                            key={status}
                            className={`px-4 py-2 h-10 rounded text-sm transition-all duration-200 relative flex items-center justify-center 
                            ${
                                activeTab === status ? 
                                'bg-orange-500 text-white shadow-md' : 
                                'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            onClick={() => handleTabClick(status)}
                        >
                            <span className='text-xs'>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            {shouldShowCount && orderCount > 0 && ( 
                                <span className="ml-1 bg-red-500 text-white text-[10px] text-center font-semibold px-2 rounded-full">
                                    {orderCount}
                                </span>
                            )}
                        </button>
                    )})}
                </div>

                {/* Orders List */}
                <div className="grid gap-4 mb-20">
                    {orders
                        .filter(order => order.status === activeTab)
                        .sort((a, b) => {
                            if (activeTab === 'completed' || activeTab === 'cancelled') {
                                return new Date(b.updatedAt) - new Date(a.updatedAt); // Latest first
                            } else {
                                return new Date(a.updatedAt) - new Date(b.updatedAt); // Earliest first
                            }
                        })
                        .map((order) => (
                            <motion.div
                                key={order._id}
                                className="border p-4 rounded-lg shadow-md bg-white"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {(order?.orderType === "pre-order" && 
                                    (order?.status === "pending" || order?.status === "preparing" || order?.status === "pre-order")) 
                                && (
                                    <h4 className="font-semibold flex flex-row items-center text-purple-500 text-xs">
                                        Scheduled at {formatTimestamp(order?.scheduledTime)}
                                    </h4>
                                )}
                                {order?.status === "cancelled" && (() => {
                                    const cancellation = order?.statusHistory?.find(entry => entry.status === "cancelled");
                                    return (
                                        <h4 className="font-semibold flex flex-row items-center text-red-500 text-[10px]">
                                            {cancellation?.reason ? `Reason: ${cancellation.reason}` : "No reason provided"}
                                        </h4>
                                    );
                                })()}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold">Order #{order.orderNumber}</h3>
                                        <p className="text-gray-600 text-xs">
                                            {new Date(order.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className='flex flex-col items-end'>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'pre-order' ? 'bg-purple-100 text-purple-800' : 
                                                order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {order.status}
                                        </span>
                                        {order.status === "preparing" &&(
                                            <span className='text-xs font-bold p-1'>Queue: {order?.queueNumber}</span>)}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="mt-4">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-2">
                                            <div className='flex flex-row items-center'>
                                                <span className='text-md max-w-[200px]'>{item.quantity}x {item.name}</span>
                                                {(order?.status === "pending" || order?.status === "preparing" || order?.status === "pre-order")
                                                && (
                                                    <span className='ml-1 text-[12px] text-blue-500'>({item.minPrepTime}-{item.maxPrepTime} min prep)</span>
                                                )}
                                            </div>
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

                                <div className="flex flex-col items-end font-boldmt-2">
                                {visibleTransactions[order._id] ? (
                                    <button
                                        onClick={() => toggleVisibility(order._id)}
                                        className="text-[10px] text-blue-500 hover:underline"
                                    >
                                        Transaction ID: <span className='italic'>{order?.paymentTransactionId}</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => toggleVisibility(order._id)}
                                        className="text-[10px] text-blue-500 hover:underline"
                                    >
                                        Payment {order.paymentStatus}
                                    </button>
                                )}
                                </div>

                                {/* Action Buttons */}
                                <div className={`${(order.status === 'pending' || order.status === 'preparing') ? 'mt-4' : ''} flex flex-row justify-end gap-2`}>
                                    {order.status === 'pending' && (
                                        <>
                                            {buttonStates[order._id]?.accept !== false && (
                                                <button
                                                    onClick={() => {
                                                        handlePrepareOrder(order._id);
                                                        toggleButtonState(order._id, 'accept', false);
                                                    }}
                                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                            <div className={`${buttonStates[order._id]?.accept === false ? "w-full" : ""}`}>
                                                <CancelOrderForm 
                                                    orderId={order._id} 
                                                    token={token} 
                                                    label={'Reject'} 
                                                    setShowAcceptButton={(value) => toggleButtonState(order._id, 'accept', value)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {order.status === 'preparing' && (
                                        <>
                                            {buttonStates[order._id]?.ready !== false && (
                                                <button
                                                    onClick={() => {
                                                        handleOrderReady(order._id);
                                                        toggleButtonState(order._id, 'ready', false);
                                                    }}
                                                    className="bg-blue-500 flex-grow text-white px-4 py-2 rounded hover:bg-blue-600"
                                                >
                                                    Mark as Ready
                                                </button>
                                            )}
                                            <div className={`${buttonStates[order._id]?.ready === false ? "w-full" : ""}`}>
                                                <CancelOrderForm 
                                                    orderId={order._id} 
                                                    token={token} 
                                                    label={'Cancel Preparing'} 
                                                    setOrder={setOrders}
                                                    setShowAcceptButton={(value) => toggleButtonState(order._id, 'ready', value)}
                                                />
                                            </div>
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
                    className="w-full px-10 py-3 rounded-lg shadow-lg bg-gradient-to-r from-orange-400 to-red-500 text-white text-lg font-semibold shadow-md hover:scale-105 transform transition duration-300"
                >
                    MAKE STORE {isSelling ? 'OFFLINE' : 'ONLINE'}
                </button>
            </div>
        </div>
    );
}

export default ManageOrders;
