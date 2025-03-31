// src/components/MenuForm.js
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'react-toastify';
import { getOrderDetails, completeOrder } from '../api/orderService';
import RateProduct from '../utils/rateproduct';
import { FaStore } from 'react-icons/fa';
import CancelOrderForm from '../utils/cancelorderform';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ShowOrder = ({ orderSelected, seller }) => {

    const [order, setOrder] = useState(null);
    const [showRatingForm, setShowRatingForm] = useState({});
    const [orderToRate, setOrderToRate] = useState(null);

    const token = localStorage.getItem('token');

    // Fetch data for editing a menu item if menuItemId is provided
    useEffect(() => {
        if (orderSelected) {
            setOrder(orderSelected);
        }
    }, [orderSelected]);

    console.log(order);

    const handleCompleteOrder = async () => {
        try {
            const updatedOrder = await completeOrder(token, order._id );
            console.log('Order updated:', updatedOrder);

            setOrder(updatedOrder);

            setOrderToRate(order);
            
            // Show rating form for each product in the order
            setShowRatingForm((prev) => {
                const newState = { ...prev };
                order.items.forEach(item => {
                    newState[item.productId] = true; // Show rating form for this product
                });
                return newState;
            });
    
            // Update UI, show success notification, etc.
            toast.success(`Order ${order.orderNumber} is now complete.`);
        } catch (error) {
            toast.error('Failed to complete the order.');
        }
    };

    const containerRef = useRef(null);
    const [lineHeight, setLineHeight] = useState(0);

    // Define all possible status steps in order
    const allPossibleSteps = [
        { id: 1, status: "pending", label: "Order Pending" },
        { id: 2, status: "preparing", label: "Preparing" },
        { id: 3, status: "ready", label: "Ready for Pickup" },
        { id: 4, status: "completed", label: "Completed" },
        { id: 5, status: "cancelled", label: "Cancelled" }
    ];

    // Filter steps based on what's in the status history
    const statusesInHistory = order?.statusHistory.map(h => h.status);
    const visibleSteps = allPossibleSteps.filter(step => 
        statusesInHistory?.includes(step.status)
    );

    // Format the timestamp to a readable format with date and time
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + 
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    // Get history item for a specific status
    const getHistoryItemForStatus = (status) => {
        return order.statusHistory.find(h => h.status === status);
    };

    // Calculate progress based on visible steps
    const currentStepIndex = visibleSteps.findIndex(step => step.status === order.status);
    const progress = (currentStepIndex + 1) / visibleSteps.length;

    // Special styling for cancelled status
    const getCancelledStyle = (isCancelled) => {
        if (!isCancelled) return {};
        return { borderLeft: '2px solid #EF4444' };
    };

    // Calculate line height after component mounts and when window resizes
    useEffect(() => {
        const calculateLineHeight = () => {
            if (containerRef.current) {
                const container = containerRef.current;
                const circles = container.querySelectorAll('.status-circle');
    
                if (circles.length >= 2) {
                    const firstCircle = circles[0];
                    const lastCircle = circles[circles.length - 1];
    
                    const firstCircleCenter = firstCircle.offsetTop + (firstCircle.offsetHeight / 2);
                    const lastCircleCenter = lastCircle.offsetTop + (lastCircle.offsetHeight / 2);
    
                    const calculatedLineHeight = lastCircleCenter - firstCircleCenter;
                    setLineHeight(calculatedLineHeight);
                }
            }
        };
    
        calculateLineHeight();
        window.addEventListener('resize', calculateLineHeight);
    
        return () => {
            window.removeEventListener('resize', calculateLineHeight);
        };
    }, [order, visibleSteps]); 

    return (
        <div className="mt-12 flex flex-col w-full">
            {/* Rating Forms */}
            <AnimatePresence>
                {orderToRate && orderToRate.items.map((item) => 
                    showRatingForm[item.productId] && (
                        <RateProduct 
                            key={item.productId}
                            token={token} 
                            productId={item.productId} 
                            productName={item.name}
                            orderId={orderToRate._id}
                            setShowRatingForm={setShowRatingForm}
                        />
                    )
                )}
            </AnimatePresence>

            {/* Dark overlay for rating forms */}
            <AnimatePresence>
                {(Object.values(showRatingForm).some(value => value) && orderToRate) && (
                    <motion.div
                        className="fixed inset-0 bg-black z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="space-y-2 p-4">
                {/* Order Header */}
                <div className="relative overflow-visible lg:px-8">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20  }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-3xl font-bold bg-white rounded-xl p-4 mt-2 overflow-hidden relative">
                        Order #{order?.orderNumber || "N/A"}
                        <span className="block text-lg font-normal text-gray-600">
                            {order?.status.charAt(0).toUpperCase() + order?.status.slice(1)}
                            {order?.queueNumber && (
                                <span className="ml-2">- Queue: {order.queueNumber}</span>
                            )}
                        </span>
                        <motion.div
                            className="absolute top-0 right-0 opacity-70"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
                        >
                            <img
                                src="/test/campus-eats-logo.png"
                                alt="Campus Eats Logo"
                                className="w-32 h-32 object-contain opacity-30 blur-xs"
                            />
                        </motion.div>
                    </motion.h1>
                    
                    <div className="flex items-center mt-2 px-2">
                        <FaStore className="text-gray-700 mr-2" />
                        <span className="font-semibold text-gray-700">{seller || "Unknown Store"}</span>
                    </div>

                    {order?.orderType === "pre-order" && (
                        <div className="text-sm text-orange-500 mt-1 px-2">
                            {order?.status === "pre-order" || order?.status === "pending" ? 
                                `Scheduled for ${formatTimestamp(order?.scheduledTime)}` : 
                                "Pre-Order"}
                        </div>
                    )}
                </div>

                <div className='overflow-y-auto flex-1 max-h-[32rem]'>
                    <div className="space-y-2 mb-2">
                        {order?.items.map((item, index) => (
                            <div key={index} className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                                {/* Fixed size image container */}
                                <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                            <span className="text-xs text-gray-500">No image</span>
                                        </div>
                                    )}
                                </div>

                                {/* Item details */}
                                <div className="ml-3 flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-800">
                                        {item.quantity}x {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-xs text-gray-500 truncate">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="ml-2 text-right w-16 flex-shrink-0">
                                    <span className="font-semibold">UC {item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg p-4 shadow-sm mb-2">
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">Payment Status</span>
                            <span className={`text-sm ${
                                order?.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-500'
                            }`}>
                                {order?.paymentStatus}
                            </span>
                        </div>
                        {order?.paymentTransactionId && (
                            <div className="text-xs text-gray-400 mt-1 truncate">
                                Transaction: {order.paymentTransactionId}
                            </div>
                        )}
                        <div className="mt-4 pt-2 border-t">
                            <h3 className="text-lg font-bold text-right">Total UC {order?.totalAmount}</h3>
                        </div>
                    </div>

                    {/* Ready for pickup notice */}
                    {order?.status === "ready" && (
                        <div className="mb-2 p-3 bg-orange-50 rounded-lg text-[10px] text-orange-800">
                            <strong>Reminder:</strong> Your order is available for pickup and must be claimed within 1 day. For perishable items, please claim as soon as possible. For non-perishable goods, check with the seller if next-day pickup is allowed. Unclaimed orders may no longer be available. Thank you!
                        </div>
                    )}

                    {/* Status Tracker */}
                    <div className="bg-white rounded-lg p-4 shadow-sm relative mb-4" ref={containerRef}>
                        <h3 className="font-bold text-gray-800 mb-3">Order Status</h3>
                        
                        <div className="space-y-4">
                            {[...visibleSteps].reverse().map((step, index) => {
                                const reversedIndex = visibleSteps.length - 1 - index;
                                const isPast = reversedIndex < currentStepIndex;
                                const isCurrent = reversedIndex === currentStepIndex;
                                const historyItem = order?.statusHistory?.find(h => h.status === step.status);
                                const isCancelled = step.status === 'cancelled';
                                const isCompleted = step.status === 'completed';

                                return (
                                    <div key={step.id} className="flex items-start">
                                        {/* Status indicator circle */}
                                        <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full status-circle flex items-center justify-center ${
                                            isCompleted ? 'bg-green-500' :
                                            isCancelled && isCurrent ? 'bg-red-500' : 
                                            isCurrent ? 'bg-orange-500' : 
                                            isPast ? 'bg-gray-400' : 'bg-gray-200'
                                        }`}>
                                            {isCancelled && isCurrent ? (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                </svg>
                                            ) : isCompleted ? ( // Checkmark for completed
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            ) : isPast || isCurrent ? (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            ) : (
                                                <span className="text-gray-500 text-xs">{step.id}</span>
                                            )}
                                        </div>
                                        
                                        {/* Status details */}
                                        <div className="ml-3">
                                            <div className={`text-sm font-medium ${
                                                isCompleted ? 'text-green-600' :
                                                isCancelled && isCurrent ? 'text-red-600' :
                                                isCurrent ? 'text-orange-600' : 'text-gray-600'
                                            }`}>
                                                {step.label}
                                            </div>
                                            {historyItem?.timestamp && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {formatTimestamp(historyItem.timestamp)}
                                                </div>
                                            )}
                                            {isCancelled && historyItem?.reason && (
                                                <div className="text-xs text-red-500 mt-1">
                                                    {historyItem.reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Status timeline */}
                        {lineHeight > 0 && (
                            <>
                                <div 
                                    className="absolute left-[27px] top-16 w-0.5 bg-gray-200 rounded-full z-0"
                                    style={{ height: `${lineHeight}px` }}
                                />
                                <div 
                                    className={`absolute left-[27px] top-16 w-0.5 rounded-full z-0 ${
                                        order?.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
                                    }`}
                                    style={{ height: `${lineHeight * (currentStepIndex + 1) / visibleSteps.length}px` }}
                                />
                            </>
                        )}
                    </div>

                    {order?.status === 'pending' && (
                        <div className="p-4 bg-white rounded-md -mt-2">
                            <CancelOrderForm 
                                orderId={order._id} 
                                token={token} 
                                label={'Cancel Order'} 
                                setOrder={setOrder} 
                                />
                        </div>
                    )} 
                </div>
            </div>

            {/* Fixed action buttons at bottom */}
            <div className="sticky bottom-0 p-4 z-[100]">
                {order?.status === 'ready' && (
                    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4">
                        <motion.button
                            type="button"
                            className="w-full max-w-xs w-full px-10 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 
                                text-white text-lg font-semibold shadow-md"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                            onClick={handleCompleteOrder}
                        >
                            Complete Order
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );

};

export default ShowOrder;
