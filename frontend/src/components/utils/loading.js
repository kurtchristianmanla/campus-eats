import { motion } from 'framer-motion';



const Loading = () => {

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 p-8">
            <div className="rounded-lg bg-white flex flex-col justify-center items-center p-6 w-full h-[250px] ">
                {/* Logo */}
                <div className="">
                    <motion.img
                        src="/test/campus-eats-logo.png"
                        alt="Campus Eats Logo"
                        className="w-20 h-20 mb-4"
                        animate={{ y: [0, -10, 0] }} // Move the logo up and down
                        transition={{
                        duration: 1.5, // Duration of one bounce cycle
                        repeat: Infinity, // Loop the animation infinitely
                        ease: "easeInOut", // Smooth easing
                        }}
                    />
                </div>

                {/* Spinner */}
                {/* <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mb-4 z-10"></div> */}


                {/* Loading Text */}
                {/* <p className="text-xl font-semibold text-black">Loading</p> */}

                {/* Loading Text with Dots Animation */}
                <p className="text-xl font-semibold text-black gap-1 flex items-center z-10">
                    Loading
                    <div className="relative h-4 w-4">
                        {/* <div
                            className="absolute h-4 w-4 z-10 animate-spin rounded-full border-2 text-gray-400 
                            border-solid border-current border-r-transparent align-[-0.125em] 
                            motion-reduce:animate-[spin_1.5s_linear_infinite]"
                            /> */}
                        <div
                            className="absolute h-4 w-4 z-0 animate-spin rounded-full border-2 text-orange-400 
                            border-solid border-current border-r-transparent align-[-0.125em]
                            motion-reduce:animate-[spin_6s_linear_infinite]"
                            />
                    </div>
                    {/* <motion.span
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
                    >.</motion.span> */}
                </p>
        
                {/* Optional: Subtle Animation */}
                <p className="mt-2 text-[10px] text-gray-500 animate-pulse z-10">
                    Please wait while Campus Eats prepare everything for you
                </p>
            </div>
        </div>
    );
};

export default Loading;
