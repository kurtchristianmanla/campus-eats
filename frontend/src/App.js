import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, Slide } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';

import Login from './components/login.js';
import Register from './components/register.js';
import ForgotPassword from './components/forgotpassword.js';

import AdminDashboard from './components/admin/admindashboard.js';
import Accounts from './components/admin/accounts.js';
import AddSeller from './components/admin/addseller.js';
import Topup from './components/admin/topup.js';
import Cashout from './components/admin/cashout.js';
import Transactions from './components/admin/transactions.js';
import ProfileAdmin from './components/admin/adminprofile.js';

import SellerHomepage from './components/seller/sellerpage.js';
import ProfileSeller from './components/seller/sellerprofile.js';
import ManageOrders from './components/seller/sellerorders.js';
import SellerMenu from './components/seller/sellermenu.js';
import SellerHistory from './components/seller/history.js';

import CustomerPage from './components/customer/customerpage.js';
import ProfileCustomer from './components/customer/customerprofile.js';
import CustomerOrders from './components/customer/customerorders.js';
import CustomerPayment from './components/customer/customerpayment.js';
import CustomerPurchases from './components/customer/customerpurchases.js';

import checkTokenAndRedirect from './components/api/helpers.js';
import ProtectedRoute from './components/api/protectroute.js';
import { checkTokenExpiration } from './components/api/tokenutils'; // Import the token utility
import './App.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const protectedRoute = (role, Component) => (
    <ProtectedRoute allowedRoles={[role]}>
      <Component />
    </ProtectedRoute>
  );

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
              console.log('Service Worker registered:', registration);
          })
          .catch(error => {
              console.error('Service Worker registration failed:', error);
          });
    });
  }

  useEffect(() => {
    const excludedPaths = [
      '/register', 
      '/forgot-password'
    ];
    if (!excludedPaths.includes(location.pathname)) {
      const validateToken = async () => {
        const token = await checkTokenExpiration();

        if (!token) {
          navigate('/login'); // Redirect to login if token is invalid or expired
        }
      };

      validateToken();
    }
    // document.title = "Campus Eats";
    // Check for the token when the app loads
    // checkTokenAndRedirect(navigate);
  }, [navigate, location.pathname]);

  // Get token from localStorage (for the fallback route check)
  const token = localStorage.getItem('token');
  let userRole = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      userRole = decoded.user_type;
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  return (
    <div className="Campus Eats">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        transition={Slide} // Apply the animation globally
        style={{
            width: '90%',          // Responsive width
            maxWidth: '300px',     // Limit width on larger screens
            marginTop: '20px',     // Adjust margin
            right: '10px',         // Use 'right' instead of marginRight
            left: 'auto'           // Ensure it's aligned to the right
        }}
        />

      <Routes>
        <Route path="/login" element={<Login />} /> {/* Route for Login */}
        <Route path="/register" element={<Register />} /> {/* Route for Register */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer Route */}
        <Route path="/customer" element={protectedRoute('customer', CustomerPage)} />
        <Route path="/customer/profile" element={protectedRoute('customer', ProfileCustomer)} />
        <Route path="/customer/cart" element={protectedRoute('customer', CustomerOrders)} />
        <Route path="/customer/payment" element={protectedRoute('customer', CustomerPayment)} />
        <Route path="/customer/my-orders" element={protectedRoute('customer', CustomerPurchases)} />
        

        {/* Seller Route */}
        <Route path="/seller" element={protectedRoute('seller', SellerHomepage)} />
        <Route path="/seller/profile" element={protectedRoute('seller', ProfileSeller)} />
        <Route path="/seller/manage-orders" element={protectedRoute('seller', ManageOrders)} />
        <Route path="/seller/menu" element={protectedRoute('seller', SellerMenu)} />
        <Route path="/seller/history" element={protectedRoute('seller', SellerHistory)} />

        {/* Admin Route */}
        <Route path="/admin" element={protectedRoute('admin', AdminDashboard)} />
        <Route path="/admin/accounts" element={protectedRoute('admin', Accounts)} />
        <Route path="/admin/addseller" element={protectedRoute('admin', AddSeller)} />
        <Route path="/admin/top-up" element={protectedRoute('admin', Topup)} />
        <Route path="/admin/cash-out" element={protectedRoute('admin', Cashout)} />
        <Route path="/admin/transactions" element={protectedRoute('admin', Transactions)} />
        <Route path="/admin/profile" element={protectedRoute('admin', ProfileAdmin)} />

        {/* Fallback Route */}
        {/* <Route path="*" element={<Navigate to="/login" />} /> */}

        {/* Fallback Route */}
        <Route
          path="*"
          element={
            // token && (
              // If logged in, navigate to the appropriate dashboard
              <Navigate
                to={`/${userRole || ''}`}
                replace
              />
            // ) : (
            //   // If not logged in, redirect to login
            //   <Navigate to="/login" replace />
            // )
          }
        />

      </Routes>
    </div>
  );
}

export default App;
