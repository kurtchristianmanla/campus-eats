// src/components/MenuForm.js
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FaMinus, FaPlus } from 'react-icons/fa';
import api from '../api/interceptor';
import { addToCart } from '../utils/cart';
import Popup from "../utils/popup";

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ShowItem = ({ userId, menuItemId, fetchMenu, item, setViewItem}) => {
    const [name, setName] = useState('');
    const [itemName, setItemName] = useState('');
    const [minPrepTime, setMinTime] = useState('');
    const [maxPrepTime, setMaxTime] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');

    const [showAdded, setShowAdded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Fetch data for editing a menu item if menuItemId is provided
    useEffect(() => {
        if (menuItemId) {
            console.log('Menu Item ID:', menuItemId);
            api.get(`/menu/item/${menuItemId}`)
                .then((response) => {
                    const menuItem = response.data.menuItem;
                    console.log(response.data);
                    console.log(menuItem);
                    setName(menuItem.name);
                    setItemName(menuItem.name);
                    setMinTime(menuItem.minPrepTime);
                    setMaxTime(menuItem.maxPrepTime);
                    setPrice(menuItem.price);
                    setImageUrl(menuItem.imageUrl);
                    setDescription(menuItem.description || "No description set");
                })
                .catch((error) => {
                    console.error('Error fetching menu item:', error);
                });
        } else {
            // If no menuItemId, reset form fields for adding new item
            setName('');
            setMinTime('');
            setMaxTime('');
            setPrice('');
            setImageUrl('');
            setDescription('');
        }
    }, [menuItemId, imageUrl]);

    const handleAddToCart = (itemId, quantity) => {
        setIsAdding(true);

        api.get(`/menu/item/${itemId}`)
            .then((response) => {
                const menuItem = response.data.menuItem;
                addToCart(userId, menuItem, quantity);
                setShowAdded(true);
            })
            .catch((error) => {
                console.error('Error fetching menu item:', error);
            })
            .finally(() => {
                setIsAdding(false);
            });
    };

    return (
        <div className="mt-24 flex flex-col w-full">
            <AnimatePresence>
                {showAdded && (
                    <Popup 
                        setShowAdded={setShowAdded}
                    />
                )}
            </AnimatePresence>
            <form className="space-y-2">
                <div className="flex justify-center">
                    <div className={`rounded-xl w-52 h-52 flex items-center justify-center relative 
                                mb-4 overflow-hidden bg-indigo-500 text-white text-6xl font-bold`}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={name}
                                className={`w-52 h-52 object-cover rounded-xl w-full h-full absolute inset-0`}
                            />
                        ) : (
                            `${itemName.charAt(0).toUpperCase()}`
                        )}
                    </div>
                </div>
                {/* Counter */}
                <div className="flex justify-center">
                    <div className="bg-gradient-to-br flex items-center justify-between from-orange-400 via-orange-400 to-orange-500 
                                rounded-full px-2 py-2 space-x-2 w-32">
                        <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                            className="text-white text-md p-2"
                            >
                            <FaMinus />
                            </button>
                        <span className="text-md font-semibold text-white">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity((prev) => Math.min(prev + 1, 20))}
                            className="text-white text-md p-2"
                            >
                            <FaPlus />
                        </button>
                    </div>
                </div>
                <div className="flex justify-center items-center text-center px-4">
                    <span className="block text-2xl font-bold text-gray-700 mt-4">{itemName}</span>
                </div>
                <div className="flex justify-center gap-2 items-center">
                    <div className="flex justify-between gap-8 w-auto items-center">
                        <span className="block text-sm font-medium text-gray-700">{price} UC</span>
                        <span className="text-sm font-medium text-gray-700">{minPrepTime}-{maxPrepTime} min</span>
                    </div>
                </div>
                <div className="flex justify-center items-center">
                    <span className="block text-sm font-medium text-gray-700 mt-3 px-4 text-center">{description}</span>
                </div>
                {/* Add Button */}
                <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-20">
                    <motion.button
                        type="button"
                        className={`w-full max-w-xs px-10 py-3 rounded-2xl text-white text-lg font-semibold shadow-md ${
                            isAdding
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}
                        whileHover={{ scale: isAdding ? 1 : 1.05 }}
                        whileTap={{ scale: isAdding ? 1 : 0.95 }}
                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        onClick={() => handleAddToCart(menuItemId, quantity)}
                        disabled={isAdding}
                    >
                        {isAdding ? 'Adding...' : 'Add to cart'}
                    </motion.button>
                </div>
            </form>
        </div>
    );
};

export default ShowItem;
