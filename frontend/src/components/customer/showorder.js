// src/components/MenuForm.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FaMinus, FaPlus } from 'react-icons/fa';
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
    const [name, setName] = useState('');
    const [itemName, setItemName] = useState('');
    const [minPrepTime, setMinTime] = useState('');
    const [maxPrepTime, setMaxTime] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [showAdded, setShowAdded] = useState(false);

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
                console.log('Circles:', circles); // Debugging: Log the circles
    
                if (circles.length >= 2) {
                    const firstCircle = circles[0];
                    const lastCircle = circles[circles.length - 1];
    
                    const firstCircleCenter = firstCircle.offsetTop + (firstCircle.offsetHeight / 2);
                    const lastCircleCenter = lastCircle.offsetTop + (lastCircle.offsetHeight / 2);
    
                    const calculatedLineHeight = lastCircleCenter - firstCircleCenter;
                    console.log('Calculated Line Height:', calculatedLineHeight); // Debugging: Log the calculated height
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
            <AnimatePresence>
                {orderToRate &&
                    orderToRate.items.map((item) => 
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
                    )
                }
            </AnimatePresence>
            <AnimatePresence>
                {(Object.values(showRatingForm).some(value => value) && orderToRate) && (
                    <motion.div
                        className="fixed inset-0 bg-black z-[60]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    ></motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-2 p-4">
                <div className="relative overflow-visible lg:px-8">
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20  }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-3xl font-bold">
                            Status: {order?.status.charAt(0).toUpperCase() + order?.status.slice(1)}
                            {order?.queueNumber && (
                                <p className='text-sm'>
                                <span>Queue:</span>
                                <span>{order.queueNumber}</span></p>
                            )} 
                    </motion.h1>
                </div>
                <div className="p-4 bg-white rounded-xl w-full max-h-[36rem] lg:max-h-[26rem] md:max-h-[26rem] overflow-y-auto 
                            scrollbar-hide flex flex-col gap-4">
                    <div className="relative flex justify-start items-start text-center">
                        <h2 className="font-semibold flex flex-row items-center gap-1 text-gray-800 text-md">
                            <FaStore className="text-gray-600 font-normal text-sm" />
                            {seller || "Unknown Store"}
                            <span>- Order #{order?.orderNumber || "N/A"}</span>
                        </h2>
                    </div>

                    {order?.items.map((item, index) => (
                        <div key={index} className="flex flex-row items-center justify-start gap-4">
                            <div className="relative w-24 h-24 flex justify-start items-start text-center">
                                {item.imageUrl ? (<img
                                    src={`${address}${item.imageUrl}`}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-md"
                                />) : (
                                    <>
                                        <p className="absolute inset-0 flex items-center justify-center text-white z-10 text-xs">
                                            No image uploaded
                                        </p>
                                        <div className="bg-gray-400 rounded-md" />
                                    </>
                                )}
                            </div>

                            <div className="flex flex-row flex-grow">
                                <span>{item.quantity}x {item.name}</span>
                            </div>

                            <div className="flex flex-col items-end">
                                
                                <div className="">
                                    <div className="flex justify-between gap-1 font-semibold">
                                        {/* <span>Amount</span> */}
                                        <span>₱{item.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex flex-col justify-end items-end text-center">
                        <span className="block text-2xl font-bold text-gray-700">Total ₱{order?.totalAmount}</span>
                        <span className="text-xs font-bold text-gray-400">Payment {order?.paymentStatus}</span>
                    </div>

                    <div className="border-b" />

                    <div className="relative" ref={containerRef}>
                            {/* Steps - in reverse order for bottom-to-top display */}
                            <div className="space-y-4">
                            {[...visibleSteps].reverse().map((step, index) => {
                                const reversedIndex = visibleSteps.length - 1 - index;
                                const isPast = reversedIndex < currentStepIndex;
                                const isCurrent = reversedIndex === currentStepIndex;
                                const historyItem = getHistoryItemForStatus(step.status);
                                const timestamp = historyItem ? formatTimestamp(historyItem.timestamp) : '';
                                const isCancelled = step.status === 'cancelled';
                                const isCompleted = step.status === 'completed';

                                return (
                                    <div key={step.id} className="flex items-start">
                                        {/* Circle indicator */}
                                        <motion.div 
                                            className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full status-circle ${
                                                isCompleted ? 'bg-green-500' :
                                                isCancelled && isCurrent ? 'bg-red-500' : 
                                                isCurrent ? 'bg-orange-500' : 
                                                isPast ? 'bg-gray-400' : 'bg-gray-200'
                                            }`}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: index * 0.15 }}
                                            >
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
                                        </motion.div>
                                        
                                        {/* Content */}
                                        <div className="ml-2 pt-0.5">
                                            <motion.div
                                                initial={{ x: 10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: index * 0.15 + 0.1 }}
                                                style={getCancelledStyle(isCancelled && isCurrent)}
                                                className={isCancelled && isCurrent ? 'pl-2' : ''}
                                            >
                                                <div className="flex flex-col">
                                                    <h3 className={`text-xs font-medium ${
                                                        isCompleted ? 'text-green-600' :
                                                        isCancelled && isCurrent ? 'text-red-600' :
                                                        isCurrent ? 'text-orange-600' : 'text-gray-600'
                                                    }`}>
                                                        {step.label}
                                                    </h3>
                                                    {timestamp && (
                                                        <span className="text-xs text-gray-400 mt-0.5">{timestamp}</span>
                                                    )}
                                                    {isCancelled && historyItem && historyItem.reason && (
                                                    <p className="text-xs text-red-500 mt-1 max-w-xs">
                                                        {historyItem.reason}
                                                    </p>
                                                    )}
                                                </div>
                                                {isCurrent && !isCancelled && !isCompleted && (
                                                    <p className="text-xs text-orange-500 mt-0.5 italic">Current status</p>
                                                )}
                                                {isCompleted && (
                                                    <p className="text-xs text-green-500 mt-0.5 italic">Order completed</p>
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Vertical line that's properly sized */}
                        {lineHeight > 0 && (
                        <>
                            {/* Background line */}
                            <div 
                            className="absolute left-[15.1px] w-0.5 bg-gray-200 rounded z-0"
                            style={{
                                top: `${4}px`,
                                height: `${lineHeight}px`
                            }}
                            ></div>
                            
                            {/* Animated progress line */}
                            <motion.div 
                            className={`absolute left-[15.1px] w-0.5 rounded z-0 ${
                                order.status === 'cancelled' ? 'bg-red-400' : 'bg-gray-400'
                            }`}
                            style={{
                                top: `${4}px`,
                                height: `${lineHeight * progress}px`
                            }}
                            initial={{ height: 0 }}
                            animate={{ height: `${lineHeight * progress}px` }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            ></motion.div>
                        </>
                        )}
                    </div>

                    {/* Add Button */}
                    {order?.status === 'ready' && (
                        <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-20">
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

                        {order?.status === 'pending' && (
                            <CancelOrderForm orderId={order._id} token={token} label={'Cancel Order'} setOrder={setOrder} />
                        )}
                </div>
            </div>
        </div>
    );
};

export default ShowOrder;
