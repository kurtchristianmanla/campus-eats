import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';
import { motion } from "framer-motion";
import api from '../api/interceptor';

import MenuForm from './menuform';
import Header from '../utils/header';

const protocol = process.env.REACT_APP_PROTOCOL || "http";
const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

const address = `${protocol}://${host_ip}:${backend_port}`;

const SellerMenu = () => {
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);  // State for menu items
    const [selectedItem, setSelectedItem] = useState(null); // To track the item being edited
    const [isFormVisible, setIsFormVisible] = useState(false); // To toggle form visibility
    const [store, setStore] = useState('');
    const [socket, setSocket] = useState(null); // Track the socket connection

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

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

    // Fetch menu items from the backend
    useEffect(() => {
        if (!sellerId) {
            console.error("No seller ID found in token");
            return;
        }
        console.log('Seller ID:', sellerId);

        checkSellerAccess();

        fetchMenu(sellerId);

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        // Use fat arrow function to preserve the state context
        const handleMenuAdded = (data) => {
            if (data.sellerId === sellerId) {
                console.log('New menu item added:', data.newItem);
                setMenuItems((prevItems) => [...prevItems, data.newItem]);
            }
        };

        const handleMenuUpdated = (data) => {
            if (data.sellerId === sellerId) {
                console.log('Menu item updated:', data.updatedItem);
                setMenuItems((prevItems) =>
                    prevItems.map((item) =>
                        item._id === data.updatedItem._id ? data.updatedItem : item
                    )
                );
            }
        };

        const handleMenuDeleted = (data) => {
            if (data.sellerId === sellerId) {
                console.log('Menu item deleted:', data.deletedItem);
                setMenuItems((prevItems) =>
                    prevItems.filter((item) => item._id !== data.deletedItem._id)
                );
            }
        };

        // Add event listeners with the context-preserving functions
        socketConnection.on('menuAdded', handleMenuAdded);
        socketConnection.on('menuUpdated', handleMenuUpdated);
        socketConnection.on('menuDeleted', handleMenuDeleted);

        // Cleanup the Socket.IO connection when the component unmounts
        return () => {
            socketConnection.off('menuAdded', handleMenuAdded);
            socketConnection.off('menuUpdated', handleMenuUpdated);
            socketConnection.off('menuDeleted', handleMenuDeleted);
            socketConnection.disconnect();
        };
    }, [sellerId, fetchMenu, checkSellerAccess]);

    // Handle Edit Item click
    const handleEditItem = (item) => {
        setSelectedItem(item);
        setIsFormVisible(true); // Show the form when an item is selected for editing
    };

    // Handle Add New Item
    const handleAddNewItem = () => {
        setSelectedItem(null);  // Clear selected item
        setIsFormVisible(true); // Show the form to add a new item
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
                        <h1 className="text-lg font-bold text-gray-800">Customize Menu</h1>
                    </header>
                    <MenuForm 
                            menuItemId={selectedItem ? selectedItem._id : null} 
                            fetchMenu={fetchMenu}
                            item={selectedItem}
                            setIsFormVisible={setIsFormVisible}
                            store={store}
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
                        <h1 className='font-semibold'>{store}</h1>
                    </div>

                    {/* Menu Items List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 scrollbar-hide overflow-y-auto mb-16">
                        {menuItems.map((item) => (
                            <motion.div key={item._id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                                className="p-4 rounded-xl flex flex-col items-center cursor-pointer"
                                onClick={() => handleEditItem(item)}
                            >
                                {/* Item Picture */}
                                <div className="flex-shrink-0 justify-center mb-3">
                                    <div className="w-52 h-52 bg-indigo-500 text-white text-6xl font-bold
                                             rounded-lg overflow-hidden flex items-center justify-center relative">
                                        {item.imageUrl ? (
                                            <img
                                                src={`${address}${item.imageUrl}`}
                                                alt={`${item.name}`}
                                                className="object-cover w-full h-full"
                                                />
                                        ) : (
                                            `${item.name.charAt(0).toUpperCase()}`
                                        )}
                                        {!item.isAvailable && (
                                            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-lg z-5">
                                                <p className="text-white text-xs font-semibold z-5">Unavailable</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h1 className="font-semibold text-2xl text-center">{item.name}</h1>
                                <div className="flex justify-between items-center gap-4 text-sm text-gray-600">
                                    <p>{item.price} Php</p>
                                    <p>{item.minPrepTime}-{item.maxPrepTime} Min</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Add Button */}
                    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-20">
                        <motion.button
                            onClick={handleAddNewItem}
                            className="w-full max-w-xs w-full px-10 py-3 rounded-md bg-gradient-to-r from-orange-400 to-red-500 
                                text-white text-lg font-semibold shadow-md"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        >
                            ADD NEW ITEM
                        </motion.button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SellerMenu;
