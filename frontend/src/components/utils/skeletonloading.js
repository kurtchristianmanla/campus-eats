import { motion } from "framer-motion";

const SkeletonCard = ({ width = 'w-full', height = 'h-24' }) => (
    <div className={`${width} ${height} bg-gray-200 rounded-xl animate-pulse`}></div>
);

const SkeletonItemCard = () => (
    <div className="relative bg-gray-200 p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block scroll-ml-4 first:ml-0 flex flex-col overflow-hidden animate-pulse">
        <div className="relative flex justify-center mb-2">
            <div className="w-44 h-44 bg-gray-300 rounded-md" />
        </div>
        <div className="text-left mb-auto">
            <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-300 rounded mb-6"></div>
            <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-1/4 bg-gray-300 rounded"></div>
            <div className="h-3 w-1/4 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);

const SkeletonMenuItem = () => (
    <div className="p-4 rounded-xl flex flex-col items-center cursor-pointer animate-pulse">
        {/* Image placeholder - matches exact dimensions and indigo-500 background */}
        <div className="flex-shrink-0 justify-center mb-3">
            <div className="w-52 h-52 bg-gray-300 text-gray-300 text-6xl font-bold rounded-lg 
                overflow-hidden flex items-center justify-center relative" />
        </div>
        
        {/* Name */}
        <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
        
        {/* Price and time */}
        <div className="flex justify-between items-center gap-4">
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 rounded"></div>
        </div>
    </div>
);

const SkeletonMenuSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 overflow-y-auto mt-4 scrollbar-hide">
        {[...Array(6)].map((_, index) => (
        <motion.div
            key={`menu-skel-${index}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ y: { duration: 1, ease: "easeOut" }}}
        >
            <SkeletonMenuItem />
        </motion.div>
        ))}
    </div>
);

const SkeletonSellerCard = () => (
    <div className="relative bg-gray-200 p-4 rounded-xl w-52 h-68 flex-shrink-0 inline-block 
                    scroll-ml-4 first:ml-0 flex flex-col overflow-hidden animate-pulse">
        <div className="relative flex justify-center mb-2">
            <div className="w-44 h-44 bg-gray-300 rounded-md"></div>
        </div>
        <div className="text-left mb-auto">
            <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-300 rounded mb-6"></div>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    <div className="h-3 w-6 bg-gray-300 rounded ml-1"></div>
                </div>
                <div className="h-3 w-10 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);

const SkeletonItemDetail = () => (
    <div className="mt-24 flex flex-col w-full animate-pulse">
        {/* Image Skeleton */}
        <div className="flex justify-center">
            <div className="rounded-xl w-52 h-52 bg-gray-300 mb-4"></div>
        </div>

        {/* Quantity Selector Skeleton */}
        <div className="flex justify-center">
            <div className="bg-gray-300 rounded-full px-2 py-2 w-32 h-12"></div>
        </div>

        {/* Name Skeleton */}
        <div className="flex justify-center mt-4 px-4">
            <div className="h-8 w-3/4 bg-gray-300 rounded"></div>
        </div>

        {/* Price and Time Skeleton */}
        <div className="flex justify-center gap-8 mt-2">
            <div className="h-5 w-16 bg-gray-300 rounded"></div>
            <div className="h-5 w-24 bg-gray-300 rounded"></div>
        </div>

        {/* Description Skeleton */}
        <div className="flex justify-center mt-3 px-4">
            <div className="h-4 w-3/4 bg-gray-300 rounded"></div>
        </div>

        {/* Add Button Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-20">
            <div className="w-full max-w-xs h-12 bg-gray-300 rounded-2xl"></div>
        </div>
    </div>
);

export { SkeletonCard, SkeletonItemCard, SkeletonMenuItem, SkeletonSellerCard, SkeletonMenuSection,
    SkeletonItemDetail
};