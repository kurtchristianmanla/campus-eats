import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Header from '../utils/header';
import api from '../api/interceptor';

const AddSeller = () => {
  const [formData, setFormData] = useState({
    username: '',
    store_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    user_type: 'seller',
    is_selling: false,
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Campus Eats | Add Seller";

    // Disable scrolling and zooming
    document.body.style.overflow = 'hidden';
    document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    // Clean up the styles on component unmount
    return () => {
      document.body.style.overflow = 'auto';
      document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
    };
  }, []);

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

  const handleAddSeller = async (event) => {
    event.preventDefault();

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    // Validate email
    if (!validateEmail(formData.email)) {
      setErrorMessage('Email must end with \'@phinmaed.com\', provided by the university');
      setLoading(false);
      return;
    }

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

    const token = localStorage.getItem('token');

    try {
      const response = await api.post('/admin/addseller', {
          username: formData.username,
          user_type: formData.user_type,
          is_selling: formData.is_selling,
          store_name: formData.store_name,
          email: formData.email,
          password: formData.password
      }, {
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
          }
      });
  
      if (response.status === 200) {
          setSuccessMessage('Registration successful! Redirecting...');
          setFormData({
              username: '',
              store_name: '',
              email: '',
              password: '',
              confirmPassword: ''
          });
          setTimeout(() => {
              navigate('/admin/accounts');
          }, 2000);
      } else {
          setErrorMessage(response.data.message || 'Registration failed');
      }
    } catch (error) {
        console.error('Error during registration:', error);
        setErrorMessage( error.response.data.message || 'An error occurred during registration. Please try again.');
    } finally {
        setLoading(false);
    }  
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center p-4">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      <Header
          headerName={'Accounts'}
          navigateTo={'/admin/accounts'}
      />
            
      <div className="flex-1 space-y-4 w-full h-auto max-h-[560px] 
                        max-w-sm bg-white p-6 rounded-lg shadow-md">

        {errorMessage && <p className="text-red-500 text-left text-xs mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 text-left text-xs mb-4">{successMessage}</p>}

        <form onSubmit={handleAddSeller}>
          {/* Username Input */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
              focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* Store Name Input */}
          <div className="mb-4">
            <label htmlFor="store_name" className="block text-sm font-medium text-gray-700">Store Name</label>
            <input
              type="text"
              id="store_name"
              name="store_name"
              placeholder="Enter store name"
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none 
              focus:ring-2 focus:ring-blue-500 leading-tight placeholder-orange-300"
              value={formData.store_name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
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
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
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
          </div>

          {/* Confirm Password */}
          <div className="mb-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
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
          </div>

          {/* Submit Button */}
          <div className="mb-1">
            <button
              type="submit"
              className={`p-3 mt-4 w-full bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-md 
                hover:scale-105 transform transition duration-300 text-white font-semibold shadow-md 
                hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 
                focus:ring-opacity-50 ${loading ? 'cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Add Seller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSeller;