import { motion } from 'framer-motion';



const Loading = () => {

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-orange-50 to-brown-50">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mb-4 z-10"></div>

            {/* Logo */}
            <div className="absolute z-0">
                <img
                    src="/test/campus-eats-logo.png"
                    alt="Campus Eats Logo"
                    className="w-48 h-48 opacity-50 blur-sm"
                />
            </div>

            {/* Loading Text */}
            {/* <p className="text-xl font-semibold text-black">Loading</p> */}

            {/* Loading Text with Dots Animation */}
            <p className="text-xl font-semibold text-black flex items-center z-10">
                Loading
                <motion.span
                    initial={{ y: 0, x: 0 }}
                    animate={{
                        y: [0, -10, 0],
                        x: [0, 0, 0],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="inline-block"
                >.</motion.span>
                <motion.span
                    initial={{ y: 0, x: 0 }}
                    animate={{
                        y: [0, -10, 0],
                        x: [0, 0, 0],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.1 // Staggered delay for the second dot
                    }}
                    className="inline-block"
                >.</motion.span>
                <motion.span
                    initial={{ y: 0, x: 0 }}
                    animate={{
                        y: [0, -10, 0],
                        x: [0, 0, 0],
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.2 // Staggered delay for the third dot
                    }}
                    className="inline-block"
                >.</motion.span>
            </p>
    
            {/* Optional: Subtle Animation */}
            <p className="mt-2 text-xs text-gray-500 animate-pulse z-10">
                Please wait while Campus Eats prepare everything for you
            </p>
        </div>
    );
};

export default Loading;
