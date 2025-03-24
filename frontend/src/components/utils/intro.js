import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";

const Intro = ({ onFinish }) => {
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        const hasSeenIntro = localStorage.getItem("hasSeenIntro");
        if (hasSeenIntro) {
            setShowIntro(false);
        } else {
            setShowIntro(true);
        }
    }, []);

    const handleFinish = () => {
        localStorage.setItem("hasSeenIntro", "true");
        setShowIntro(false);
        onFinish();
    };

    if (!showIntro) return null;

    return (
        <div className="w-screen h-screen flex items-center justify-center bg-white">
            <Swiper pagination={true} modules={[Pagination]} className="w-full h-full">
                <SwiperSlide>
                    <div className="flex flex-col items-center bg-orange-500 justify-center h-full text-center p-6">
                        <img src="/test/ceat-white.png" alt="Campus Eats" className="w-48 mb-6 scale-y-110" />
                        <h1 className="text-2xl font-bold text-white">Campus Eats</h1>
                        <p className="text-white text-xs mt-2">
                            Welcome to Campus Eats!
                        </p>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/test/shapes-ceats.png" alt="Shape" className="relative w-60" />
                        <img src="/test/plate-ceats.png" alt="Discover Stores" className="absolute z-10 w-40" />
                    </div>
                    <h2 className="text-md text-orange-500 font-bold">Discover Concessionaire Stores</h2>
                    <p className="text-gray-600 text-xs mt-2">
                    Effortlessly browse menus and enjoy quick, convenient meals at your favorite campus dining spots.
                    </p>
                </div>
                </SwiperSlide>
                <SwiperSlide>
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/test/shapes-ceats.png" alt="Shape" className="relative w-60" />
                        <img src="/test/food-ceats.png" alt="Choose Dishes" className="absolute z-10 w-40" />
                    </div>
                    <h2 className="text-md font-bold text-orange-500">Choose Favorite Dishes!</h2>
                    <p className="text-gray-600 text-xs mt-2">
                    Select your favorite meals, and order with just a tap. Say goodbye to long queues and enjoy fast, hassle-free service.
                    </p>
                    <p className="text-gray-600 text-xs mt-8">
                    Ready to indulge in your favorites? Let’s dive in!
                    </p>
                </div>
                </SwiperSlide>
                <SwiperSlide>
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="flex items-center justify-center mb-6">
                        <img src="/test/shapes-ceats.png" alt="Shape" className="relative w-60" />
                        <img src="/test/deliver-ceats.png" alt="Get Your Food" className="absolute z-10 w-40" />
                    </div>
                    <h2 className="text-md font-bold text-orange-500">Get Your Food</h2>
                    <p className="text-gray-600 text-xs mt-2">
                    Skip the lines, order ahead, and get your food ready when you are. It’s quick, easy, and hassle-free.

                    Hungry? Let’s get started!
                    </p>
                    <button 
                    onClick={handleFinish} 
                    className="fixed bottom-16 h-10 w-40 flex items-center justify-center bg-orange-500 text-white px-6 py-3 rounded-lg 
                        font-medium shadow-md hover:bg-orange-600"
                    >
                    Get Started
                    </button>
                </div>
                </SwiperSlide>
            </Swiper>
        </div>
    );
};

export default Intro;
