import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const Register = () => {
  const [formData, setFormData] = useState({
    user_type: 'customer',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const history = useNavigate();

  useEffect(() => {
    document.title = "Campus Eats | Register";

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

  const handleSubmit = async (event) => {
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

    try {
      const response = await fetch(`${address}/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: formData.user_type,
          email: formData.email,
          password: formData.password
        })
      });

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting...');
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
        });
        setTimeout(() => {
          history('/login');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="mt-[-5rem] w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-left text-gray-800 mb-4">Create an account</h2>
        <h2 className="text-xs text-left text-gray-800 mb-4">{loginMessage_1}</h2>

        {errorMessage && <p className="text-red-500 text-left text-xs mb-4">{errorMessage}</p>}
        {successMessage && <p className="text-green-500 text-left text-xs mb-4">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
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
          <div className="mb-6">
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
                onFocus={() => {
                  if (!showPassword) {
                    setShowPassword(true);
                    setTimeout(() => setShowPassword(false), 1000); // Show for 1 second
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
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
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
                onFocus={() => {
                  if (!showConfirmPassword) {
                    setShowConfirmPassword(true);
                    setTimeout(() => setShowConfirmPassword(false), 1000); // Show for 1 second
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
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading} // Disable submit if password error exists
            className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white 
            font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 
            hover:from-orange-500 hover:to-orange-600"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Link to Login */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-orange-300 hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
