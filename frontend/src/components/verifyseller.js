import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from './api/interceptor';
import { motion } from 'framer-motion';

const SellerVerify = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    const verifySeller = async () => {
      try {
        await api.get(`/seller/verify-seller?token=${token}`);
        // Redirect after successful verification
        navigate('/login', { state: { verified: true } });
      } catch (error) {
        navigate('/');
      }
    };

    if (token) verifySeller();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="flex items-center justify-center ">
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
        <h1 className="text-md font-bold mb-4">Verifying your seller account...</h1>
        <p className="text-[10px]">Please wait while we verify your email address.</p>
      </div>
    </div>
  );
};

export default SellerVerify;