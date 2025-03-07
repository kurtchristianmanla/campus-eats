import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBook, FaShoppingBag, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, toggleSidebar, user, username, profilePicture, address, handleLogout }) => {
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false); // State for loading

    const handleLogoutClick = async () => {
        setIsLoggingOut(true); // Set loading state to true
        await handleLogout(); // Call the logout function
        setIsLoggingOut(false); // Reset loading state
    };

    return (
        <AnimatePresence>
            {isSidebarOpen && (
                <motion.div
                    className="fixed top-0 right-0 w-80 h-full bg-white text-black p-4 z-[100]"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <button className="text-4xl text-gray-800" onClick={toggleSidebar}>
                        &times;
                    </button>
                    <div className="p-2 w-full max-w-3xl mt-2">
                        <div className="flex flex-col items-start">
                            <div className="flex-shrink-0">
                                <div className="w-24 h-24 bg-indigo-500 text-white text-6xl font-bold flex justify-center 
                                            items-center rounded-full overflow-hidden mb-1">
                                    {profilePicture ? (
                                        <img
                                            src={profilePicture}
                                            alt="Profile"
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        `${username.charAt(0).toUpperCase()}`
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 mt-1">
                                <div className="flex items-end">
                                    <h1 className="text-lg mr-1 font-bold">
                                        {user?.first_name || user?.last_name
                                            ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                                            : 'Name yet to be set'}
                                    </h1>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <motion.button
                        onClick={() => navigate("/customer/profile")}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        className="h-16 relative flex items-center w-full mt-2 p-2 text-left bg-gradient-to-r from-white to-white font-semibold 
                                hover:from-orange-400 hover:to-red-500 hover:text-white rounded-md pr-4 border-b border-t"
                    >
                        <FaUser className="ml-2 text-xl mr-4" />
                        Profile
                    </motion.button>

                    <motion.button
                        onClick={() => navigate("/customer/my-orders")}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        className="h-16 relative flex items-center w-full p-2 text-left bg-gradient-to-r from-white to-white font-semibold 
                                hover:from-orange-400 hover:to-red-500 hover:text-white rounded-md pr-4 border-b"
                    >
                        <FaShoppingBag className="ml-2 text-xl mr-4" />
                        My Orders
                    </motion.button>

                    <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 z-20">
                        <motion.button
                            onClick={handleLogoutClick}
                            disabled={isLoggingOut} // Disable button while logging out
                            className={`w-2/3 px-10 py-3 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 
                                text-white text-sm font-semibold shadow-md ${
                                    isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            whileHover={{ scale: isLoggingOut ? 1 : 1.05 }} // Disable hover effect while logging out
                            whileTap={{ scale: isLoggingOut ? 1 : 0.95 }} // Disable tap effect while logging out
                            transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        >
                            {isLoggingOut ? 'Logging Out...' : 'Log Out'}
                        </motion.button>
                    </div>

                    <motion.button
                        onClick={() => navigate("/customer/use-policy")}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ hover: { duration: 0.3, ease: "easeOut" }}}
                        className="h-16 relative flex items-center w-full p-2 text-left bg-gradient-to-r from-white to-white font-semibold 
                                hover:from-orange-400 hover:to-red-500 hover:text-white rounded-md pr-4 border-b"
                    >
                        <FaBook className="ml-2 text-xl mr-4" />
                        Use Policy
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
