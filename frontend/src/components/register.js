import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback } from 'react';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const Register = () => {
  const [formData, setFormData] = useState({
    user_type: 'customer',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '' // New field for verification code
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false); // Track if verification code is sent
  const [isVerified, setIsVerified] = useState(false); // Track if email is verified
  const navigate = useNavigate();

  const checkToken = useCallback(async () => {
      const token = localStorage.getItem('token'); // Retrieve token from localStorage
      if (token) {
          navigate('/');
          return; 
      }
  }, [navigate]);
  

  useEffect(() => {
    document.title = "Campus Eats | Register";

    checkToken();

    // Disable scrolling and zooming
    document.body.style.overflow = 'hidden';
    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Clean up the styles on component unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
    };
  }, [checkToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    const emailRegex = /^.+@phinmaed\.com$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  // Step 1: Send Verification Code
  const sendVerificationCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    // Validate email
    if (!validateEmail(formData.email)) {
      setErrorMessage('Email must end with \'@phinmaed.com\', provided by the university');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${address}/user/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Verification code sent to your email.');
        setIsVerificationSent(true); // Set verification code as sent
      } else {
        setErrorMessage(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setErrorMessage('An error occurred while sending the verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify the Code
  const verifyCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${address}/user/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Email verified successfully!');
        setIsVerified(true); // Set email as verified
      } else {
        setErrorMessage(data.message || 'Invalid or expired verification code');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setErrorMessage('An error occurred while verifying the code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    // Validate password
    if (!validatePassword(formData.password)) {
      setErrorMessage('Password must be at least 8 characters long, contain an uppercase letter and a number.');
      setLoading(false);
      return;
    }

    // Password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${address}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: formData.user_type,
          email: formData.email,
          password: formData.password,
          isVerified: true // Ensure email is verified
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting...');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          verificationCode: ''
        });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrorMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setErrorMessage('An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginMessage_1 = "Welcome friend, enter your details so let's get started in ordering food.";

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-100"
      initial={{ opacity: 0 }} // Initial state (hidden)
      animate={{ opacity: 1 }} // Animate to fully visible
      transition={{ duration: 0.5 }} // Animation duration
    >
      <motion.div
        className="mt-[-5rem] w-full max-w-sm bg-white p-6 rounded-lg shadow-md"
        initial={{ y: -50, opacity: 0 }} // Start slightly above and hidden
        animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
        transition={{ delay: 0.2, duration: 0.5 }} // Delay and duration
      >
        <motion.h2
          className="text-2xl font-bold text-left text-gray-800 mb-4"
          initial={{ x: -20, opacity: 0 }} // Start slightly left and hidden
          animate={{ x: 0, opacity: 1 }} // Move to original position and fade in
          transition={{ delay: 0.4, duration: 0.5 }} // Delay and duration
        >
          Create an account
        </motion.h2>

        <motion.h2
          className="text-xs text-left text-gray-800 mb-4"
          initial={{ x: -20, opacity: 0 }} // Start slightly left and hidden
          animate={{ x: 0, opacity: 1 }} // Move to original position and fade in
          transition={{ delay: 0.6, duration: 0.5 }} // Delay and duration
        >
          {loginMessage_1}
        </motion.h2>

        {errorMessage && (
          <motion.p
            className="text-red-500 text-left text-xs mb-4"
            initial={{ scale: 0.8, opacity: 0 }} // Start small and hidden
            animate={{ scale: 1, opacity: 1 }} // Scale up and fade in
            transition={{ duration: 0.3 }} // Animation duration
          >
            {errorMessage}
          </motion.p>
        )}

        {successMessage && (
          <motion.p
            className="text-green-500 text-left text-xs mb-4"
            initial={{ scale: 0.8, opacity: 0 }} // Start small and hidden
            animate={{ scale: 1, opacity: 1 }} // Scale up and fade in
            transition={{ duration: 0.3 }} // Animation duration
          >
            {successMessage}
          </motion.p>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <motion.div
            className="mb-4"
            initial={{ y: 20, opacity: 0 }} // Start slightly below and hidden
            animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
            transition={{ delay: 0.8, duration: 0.5 }} // Delay and duration
          >
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter email"
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
              focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isVerificationSent}
            />
          </motion.div>

          {/* Send Verification Code Button */}
          {!isVerificationSent && (
            <motion.button
              type="button"
              onClick={sendVerificationCode}
              className="w-full py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white 
              font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 
              hover:from-blue-500 hover:to-blue-600 mb-4"
              whileHover={{ scale: 1.05 }} // Scale up on hover
              whileTap={{ scale: 0.95 }} // Scale down on tap
              initial={{ opacity: 0 }} // Start hidden
              animate={{ opacity: 1 }} // Fade in
              transition={{ delay: 1, duration: 0.5 }} // Delay and duration
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </motion.button>
          )}

          {/* Verification Code Input */}
          {isVerificationSent && !isVerified && (
            <motion.div
              className="mb-4"
              initial={{ y: 20, opacity: 0 }} // Start slightly below and hidden
              animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
              transition={{ delay: 1.2, duration: 0.5 }} // Delay and duration
            >
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                type="text"
                id="verificationCode"
                name="verificationCode"
                placeholder="Enter verification code"
                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                value={formData.verificationCode}
                onChange={handleChange}
                required
              />
              <motion.button
                type="button"
                onClick={verifyCode}
                className="w-full py-3 bg-gradient-to-r from-green-400 to-green-500 text-white 
                font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 
                hover:from-green-500 hover:to-green-600 mt-4"
                whileHover={{ scale: 1.05 }} // Scale up on hover
                whileTap={{ scale: 0.95 }} // Scale down on tap
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </motion.button>
            </motion.div>
          )}

          {/* Password Input */}
          {isVerified && (
            <>
              <motion.div
                className="mb-6"
                initial={{ y: 20, opacity: 0 }} // Start slightly below and hidden
                animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
                transition={{ delay: 1.4, duration: 0.5 }} // Delay and duration
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    onFocus={() => {
                      if (!showPassword) {
                        setShowPassword(true);
                        setTimeout(() => setShowPassword(false), 1000);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/4 leading-tight 
                    text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                className="mb-6"
                initial={{ y: 20, opacity: 0 }} // Start slightly below and hidden
                animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
                transition={{ delay: 1.6, duration: 0.5 }} // Delay and duration
              >
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                    focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    onFocus={() => {
                      if (!showConfirmPassword) {
                        setShowConfirmPassword(true);
                        setTimeout(() => setShowConfirmPassword(false), 1000);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/4 text-gray-500 
                    hover:text-gray-700"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white 
                font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 
                hover:from-orange-500 hover:to-orange-600"
                whileHover={{ scale: 1.05 }} // Scale up on hover
                whileTap={{ scale: 0.95 }} // Scale down on tap
              >
                {loading ? 'Registering...' : 'Register'}
              </motion.button>
            </>
          )}
        </form>

        {/* Link to Login */}
        <motion.div
          className="mt-2 text-center"
          initial={{ y: 20, opacity: 0 }} // Start slightly below and hidden
          animate={{ y: 0, opacity: 1 }} // Move to original position and fade in
          transition={{ delay: 1, duration: 0.5 }} // Delay and duration
        >
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-orange-300 hover:underline">
              Login here
            </a>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Register;