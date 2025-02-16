// src/components/MenuForm.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { TrashIcon } from "@heroicons/react/outline";
import { motion, AnimatePresence } from "framer-motion";
import api from '../api/interceptor';

const protocol = process.env.REACT_APP_PROTOCOL || "http";
const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

const address = `${protocol}://${host_ip}:${backend_port}`;

const MenuForm = ({ menuItemId, fetchMenu, item, setIsFormVisible, store }) => {
    const [name, setName] = useState('');
    const [itemName, setItemName] = useState('');
    const [minPrepTime, setMinTime] = useState('');
    const [maxPrepTime, setMaxTime] = useState('');
    const [minValue, setMinValue] = useState(0);
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const [showImage, setShowImage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

    // Fetch data for editing a menu item if menuItemId is provided
    useEffect(() => {
        if (menuItemId) {
            console.log('Menu Item ID:', menuItemId);
            api.get(`${address}/menu/item/${menuItemId}`)
                .then((response) => {
                    const menuItem = response.data.menuItem;
                    console.log(response.data);
                    console.log(menuItem);
                    setName(menuItem.name);
                    setItemName(menuItem.name);
                    setMinTime(menuItem.minPrepTime);
                    setMaxTime(menuItem.maxPrepTime);
                    setMinValue(menuItem.minPrepTime);
                    setPrice(menuItem.price);
                    setDescription(menuItem.description);
                    setImageUrl(menuItem.imageUrl);
                    setShowImage(`${address}${imageUrl}`);
                    setIsAvailable(menuItem.isAvailable);
                    setSelectedFile(null);
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
            setDescription('');
            setImageUrl('');
            setShowImage('');
            setIsAvailable(true);
            setSelectedFile(null);
        }
    }, [menuItemId, imageUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // const menuData = { name, minPrepTime, maxPrepTime, price, selectedFile, isAvailable, sellerId };
        const menuData = new FormData();
        menuData.append('name', name);
        menuData.append('minPrepTime', minPrepTime);
        menuData.append('maxPrepTime', maxPrepTime);
        menuData.append('description', description);
        menuData.append('price', price);
        menuData.append('isAvailable', isAvailable);
        menuData.append('sellerId', sellerId);

        // Convert to lowercase and replace spaces with underscores
        const formattedStore = store.toLowerCase().replace(/\s+/g, '_');
        const formattedName = name.toLowerCase().replace(/\s+/g, '_');

        if (selectedFile) {
            // menuData.append('imageUrl', selectedFile, `${store}_${name}_item.jpg`);
            
            // Use the formatted strings in your menuData
            menuData.append('imageUrl', selectedFile, `${formattedStore}-${formattedName}-item.jpg`);
        }

        console.log('Menudata: ', menuData);

        if (menuItemId) {
            // Update menu item
            api.put(`/menu/update/${menuItemId}`, menuData, {
                headers: { 'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` },
            })
                .then(() => {
                    fetchMenu(sellerId); // Refresh menu list
                    alert('Menu item updated successfully');
                    setIsFormVisible(false);
                })
                .catch((error) => {
                    console.error('Error updating menu item:', error);
                    alert('Failed to update menu item');
                });
        } else {
            // Add new menu item
            api.post(`/menu/add`, menuData, {
                headers: { 'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` },
            })
                .then(() => {
                    fetchMenu(sellerId); // Refresh menu list
                    alert('Menu item added successfully');
                    setIsFormVisible(false);
                })
                .catch((error) => {
                    console.error('Error adding menu item:', error);
                    alert('Failed to add menu item');
                });
        }
    };

    const handleDelete = () => {
        api.delete(`/menu/delete/${menuItemId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(() => {
                fetchMenu(sellerId); // Refresh menu list
                alert('Menu item deleted successfully');
                setIsFormVisible(false);
            })
            .catch((error) => {
                console.error('Error deleting menu item:', error);
                alert('Failed to delete menu item');
            });
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];

        const maxSizeInMB = 5; // Set max size in MB
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

        if (file) {
            if (file.size > maxSizeInBytes) {
                alert(`File size exceeds ${maxSizeInMB} MB. Please select a smaller file.`);
                event.target.value = ''; // Clear the input
            } else {
                console.log(file);
        
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedFile(file);
                    console.log(selectedFile);
                    setShowImage(reader.result);
                };
                reader.readAsDataURL(file);
                console.log(reader);
            }
        }
    };

    return (
        <div className="flex flex-col w-[20rem]">
            <div className="-ml-1 mb-2">
                <h2 className="font-semibold mb-2">{menuItemId ? 'Edit' : 'Add'} Menu Item</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex justify-center">
                    <div className={`bg-white rounded-xl w-52 h-52 flex items-center justify-center relative mb-2 overflow-hidden`}>
                        <input 
                            type="file" 
                            accept="image/*"  
                            className="hidden" 
                            maxLength="5MB"
                            id="imageUpload"
                            onChange={handleImageUpload}
                            />
                        <label 
                            htmlFor="imageUpload" 
                            className="absolute z-20 text-white cursor-pointer"
                        >
                            Edit
                        </label>
                        <div className="absolute rounded-xl z-10 inset-0 bg-black opacity-30"></div>
                        {menuItemId ? (<img
                            src={showImage}
                            alt={item.name}
                            className={` w-52 h-52 object-cover rounded-xl mb-2 absolute inset-0`}
                        />) : (
                        showImage && (<img
                            src={showImage}
                            alt="Item Icon"
                            className={` w-52 h-52 object-cover rounded-xl mb-2 absolute inset-0`}
                        />)
                        )}
                    </div>
                </div>
                <div className="flex justify-center gap-2 items-center px-4">
                    {menuItemId && (<h1 className="font-semibold text-2xl text-center">{itemName}</h1>)}
                    {confirmDelete !== menuItemId && (
                        <div className="flex">
                            <motion.button type="button"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card expansion
                                    setConfirmDelete(menuItemId); // Show confirmation buttons
                                }}
                                className="op-1 right-4 text-red-600 hover:text-red-800"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </motion.button>
                        </div>
                    )}
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mt-4">Item Name</label>
                    <input
                        type="text"
                        id="name"
                        placeholder="Enter item name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md placeholder:text-xs"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                        type="text"
                        id="description"
                        placeholder="Enter item description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md placeholder:text-xs"
                    />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (Php)</label>
                    <input
                        type="number"
                        id="price"
                        min="1"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md placeholder:text-xs"
                        required
                    />
                </div>
                <div className="flex items-center">
                    <div className="flex flex-col">
                        <label htmlFor="estimatedPrepTime" className="block text-sm font-medium text-gray-700">Estimated Prep Time (Min)</label>
                        <div id="estimatedPrepTime">
                            <input
                                type="number"
                                value={minPrepTime}
                                min="0"
                                placeholder="Min"
                                onChange={(e) => {
                                    setMinTime(e.target.value);
                                    setMinValue(e.target.value);
                                }}
                                className="w-24 p-2 border border-gray-300 rounded-md placeholder:text-xs"
                                required
                            />
                            <span className="text-sm font-medium text-gray-700 ml-2 mr-2">to</span>
                            <input
                                type="number"
                                min={minValue}
                                placeholder="Max"
                                value={maxPrepTime}
                                onChange={(e) => setMaxTime(e.target.value)}
                                className="w-24 p-2 border border-gray-300 rounded-md placeholder:text-xs"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isAvailable"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        className="hidden" // Hide the default checkbox
                    />
                    <label
                        htmlFor="isAvailable"
                        className="flex items-center cursor-pointer mb-5"
                    >
                        <div className="relative">
                            <div className={`block w-10 h-6 rounded-full flex items-center px-1
                                        ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`}>
                                <AnimatePresence>
                                    <motion.div
                                        className="bg-white w-4 h-4 rounded-full"
                                        initial={{ x: 0 }}
                                        animate={{ x: isAvailable ? '100%' : 0 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                    />
                                </AnimatePresence>
                            </div>
                        </div>
                        <span className="ml-2 text-sm font-medium text-gray-700">Available</span>
                    </label>
                </div>
                <div className="flex gap-2 h-12">
                    {(confirmDelete === menuItemId) && (menuItemId !== null) ? (
                        <>
                            <motion.button type="button"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card expansion
                                    handleDelete(); // Confirm delete
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 
                                    text-white rounded hover:from-red-500 hover:to-red-700 w-2/3"
                            >
                                Confirm Deletion
                            </motion.button>
                            <motion.button type="button"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent card expansion
                                    setConfirmDelete(null); // Cancel delete
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 w-1/3"
                            >
                                Cancel
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <motion.button type="submit" className={`py-2 px-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-md
                                        ${menuItemId ? 'w-2/3' : 'w-full'}`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                            >
                                {menuItemId ? 'Update Item' : 'Add Item'}
                            </motion.button>
                            {menuItemId && (
                                <motion.button type="button" className='py-2 px-4 bg-gray-400 text-white rounded-md
                                        w-1/3' onClick={() => setIsFormVisible(false)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}>
                                Cancel
                                </motion.button>
                            )}
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};

export default MenuForm;
