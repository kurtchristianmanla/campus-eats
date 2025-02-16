import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaStore, FaShoppingCart } from "react-icons/fa";

const Popup = ({ setShowAdded }) => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
        setShowAdded(false);
        }, 105000); // Auto close after 5 seconds

        return () => clearTimeout(timer); // Cleanup timeout if component unmounts
    }, [setShowAdded]);

    return (
        <motion.div
            className="fixed top-20 left-0 right-0 z-[70] w-full h-full flex justify-center items-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <motion.div
                className="bg-white p-4 h-24 w-[20rem] rounded-lg shadow-xl flex flex-col gap-4 justify-center"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                exit={{ y: -100 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <div className="flex items-center">
                    <h3 className="text-md">Item added to cart successfully</h3>
                </div>
                <div className="flex gap-4 items-center justify-end">
                    <button className="flex items-center justify-between gap-1 hover:underline cursor-pointer"
                            onClick={() => navigate("/customer/cart")}>
                        <h3 className="text-xs">View Cart</h3>
                        <FaShoppingCart className="text-xs"/>
                    </button>
                    <button onClick={() => setShowAdded(false)} className="flex items-center justify-between gap-1 
                                cursor-pointer hover:underline">
                        <h3 className="text-xs">Add More to Cart</h3>
                        <FaStore className="text-xs"/>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Popup;
