import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import { motion } from "framer-motion";
import { toast } from 'react-toastify';
import api from '../api/interceptor';

import ItemReviews from './itemreviews';
import Header from '../utils/header';
import { FaStar } from 'react-icons/fa';
import { useNotification } from '../utils/notification';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const SellerReviews = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);  // State for menu items
    const [selectedItem, setSelectedItem] = useState(null); // To track the item being edited
    const [isFormVisible, setIsFormVisible] = useState(false); // To toggle form visibility
    const [store, setStore] = useState('');
    const [socket, setSocket] = useState(null); // Track the socket connection
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [groupedReviews, setGroupedReviews] = useState({});
    const selectedItemReviews = groupedReviews[selectedItem?._id] || [];

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;
    
    const { showNotification } = useNotification();

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

    const checkSellerAccess = useCallback(async () => {
            const token = localStorage.getItem('token'); // Retrieve token from localStorage
    
            if (!token) {
                // No token, redirect to login
                navigate('/');
                return;
            }
    
            try {
                // Decode the token
                const decoded = jwtDecode(token);
    
                // Check if user_type is 'admin'
                if (decoded.user_type !== 'seller') {
                    alert('Access Denied: Seller only');
                    navigate('/'); // Redirect to another page
                }
    
                const response = await api.get(`/seller/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                // Handle the response
                const data = response.data;
                setStore(data.user.store_name || 'Seller');
                setRating(data.user.seller_rating || 0);
            } catch (error) {
                if (error.response) {
                    console.error('Error response:', error.response.data);
                } else if (error.request) {
                    console.error('Error request:', error.request);
                } else {
                    console.error('Error message:', error.message);
                }
                navigate('/'); // Redirect to login if token is invalid or any error occurs
            }
        }, [navigate]);

    const fetchReviews = useCallback(async () => {
        api.get(`/seller/reviews`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        }).then((response) => {
            console.log(response.data);
            // Group reviews by productId
            const grouped = response.data.reduce((acc, review) => {
                if (!acc[review.productId]) {
                    acc[review.productId] = [];
                }
                acc[review.productId].push(review);
                return acc;
            }, {});

            setGroupedReviews(grouped);
            setReviews(response.data);
        }).catch((error) => {
            console.error('Error fetching menu items:', error);
        });
    }, [token]);

    // Fetch menu items from the backend
    useEffect(() => {
        if (!sellerId) {
            console.error("No seller ID found in token");
            return;
        }
        console.log('Seller ID:', sellerId);

        checkSellerAccess();

        fetchMenu(sellerId);

        fetchReviews();

    }, [sellerId, fetchMenu, checkSellerAccess, fetchReviews]);
    
    useEffect(() => {
        document.title = "Campus Eats | Reviews";

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        const receiveNewOrder = (data) => {
            if (data.sellerId === sellerId) {
                showNotification('New Order Received!', `Order #${data.newOrder.orderNumber}`, 'seller');
                toast.info(
                    'New Order Received!'
                );
                console.log('New Order Received:', data.newOrder.orderNumber);
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.sellerId === sellerId) {
                showNotification('Order Status Updated!', `Order #${data.order.orderNumber}`, 'seller');
            }
        };

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
        socketConnection.on('overdueOrder', warningOverdueOrders);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('newOrder', receiveNewOrder); // Remove the listener
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('overdueOrder', warningOverdueOrders);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [sellerId, showNotification]);

    const handleItemClick = (item) => {
        setSelectedItem(item);
        setIsFormVisible(true);
    };

    return (
        <>
            {/* Menu Form (Add/Edit Item) */}
            {isFormVisible ? (
                <div className={`min-h-screen bg-[#f5f5f7] flex flex-col items-center p-4`}>
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                    <header className={`z-30 w-full flex items-center gap-2 sticky mb-2 top-0 bg-[#f5f5f7] fixed py-3`}>
                        <button className="text-gray-600" onClick={() => setIsFormVisible(false)}>
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
                        <h1 className="text-lg font-bold text-gray-800">Reviews</h1>
                    </header>
                    <ItemReviews 
                            item={selectedItem}
                            setIsFormVisible={setIsFormVisible}
                            reviews={selectedItemReviews}
                    />
                </div>
            ) : (
                <div className={`min-h-screen bg-[#f5f5f7] flex flex-col p-4`}>
                    <Header
                        headerName={'Customize Menu'}
                        navigateTo={`/seller`}
                        bgColor={'[#f5f5f7]'}
                    />

                    <div className="ml-4 mb-4 lg:w-[36rem]">
                        <h1 className='font-semibold flex flex-row items-center'>
                            <span>{store} - </span>
                            <span className="text-yellow-400 ml-1"><FaStar /></span>
                            <span> {rating?.toFixed(1)} Ratings</span>
                        </h1>
                    </div>

                    {/* Menu Items List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 scrollbar-hide overflow-y-auto mb-4">
                        {menuItems.map((item) => (
                            <motion.div key={item._id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                                className="p-4 rounded-xl flex flex-col items-center cursor-pointer"
                                onClick={() => handleItemClick(item)}
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
                                    </div>
                                </div>
                                <h1 className="font-semibold text-2xl text-center">{item.name}</h1>
                                <div className="flex justify-between items-center gap-1 text-sm">
                                    {item?.averageRating ? (
                                        <>
                                            <p className="text-yellow-400"><FaStar /></p>
                                            <p>{item?.averageRating.toFixed(1)}</p>
                                        </>
                                    ) : (
                                        <p>No ratings</p>
                                    )}
                                    <p className='ml-4'>{groupedReviews[item._id]?.length || 0} Reviews</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default SellerReviews;
