import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from "framer-motion";

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const checkToken = useCallback(async () => {
        const token = localStorage.getItem('token'); // Retrieve token from localStorage

        if (token) {
            navigate('/');
            return; 
        }


    }, [navigate]);

    useEffect(() => {
        document.title = "Campus Eats | Login";

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

    const handleSubmit = async (event) => {

    //   console.log('handleSubmit called!');

      event.preventDefault();

    //   alert('You are here.');

      if (!email || !password) {
          alert('Please fill in both fields.');
          return;
      }

      setLoading(true); // Set loading to true
      setErrorMessage('');

      const loginData = { email, password };
      console.log('Submitting login data:', loginData);

      try {
          const response = await fetch(`${address}/user/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(loginData),
              credentials: 'include',
          });

          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : await response.text();
          console.log('Response data:', data);

          if (response.ok) {
              alert('Login successful');
            //   localStorage.setItem('token', data.token); // Store token
              localStorage.setItem('token', data.access_token);
              setEmail(''); // Clear username
              setPassword(''); // Clear password
              // navigate('/home'); // Redirect to the dashboard

              if (data.user_type === 'customer') {
                navigate('/home'); // Redirect to home for customers
              } else if (data.user_type === 'seller') {
                navigate('/seller'); // Redirect to seller dashboard
              } else if (data.user_type === 'admin') {
                navigate('/admin'); // Redirect to admin dashboard
              }

          } else {
              // alert(data.message || 'Login failed');
              setErrorMessage(data.message || 'Invalid username or password');
          }
      } catch (error) {
          console.error('Error during login:', error);
          // alert('An error occurred during login. Please try again.');
          setErrorMessage('An error occurred during login. Please try again.');
      } finally {
          setLoading(false); // Reset loading state
      }
    };

    const loginMessage_1 = "Good to see you again, enter your details below to continue ordering.";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mt-[-5rem] w-full max-w-sm bg-white p-6 rounded-lg shadow-md"
            >
                <h2 className="text-2xl font-bold text-left text-gray-800 mb-4">Login to your account</h2>

                <h2 className="text-xs text-left text-gray-800 mb-4">{loginMessage_1}</h2>

                {errorMessage && <p className="text-red-500 text-left text-xs mb-4">{errorMessage}</p>}

                <form onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter email"
                            className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                            focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'} // Toggle between text and password
                                id="password"
                                placeholder="Enter password"
                                className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
                                focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                                className="absolute right-3 top-1/2 transform -translate-y-1/4 leading-tight 
                                text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Eye icon */}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white 
                        font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 
                        hover:from-orange-500 hover:to-orange-600 mb-1"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="text-center mt-2">
                    <a 
                        href="/forgot-password" 
                        className="text-sm text-orange-400 hover:underline">
                        Forgot Password?
                    </a>
                </div>

                {/* Link to Register */}
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <a href="/register" className="text-orange-300 hover:underline">
                            Create an account
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
