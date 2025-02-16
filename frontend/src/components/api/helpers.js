import { jwtDecode } from 'jwt-decode';
import { refreshAccessToken } from './interceptor';
import { handleLogout } from '../utils/logout';

const checkTokenAndRedirect = async (navigate) => {
    let token = localStorage.getItem('token'); // Retrieve token from localStorage
    if (!token) {
        const refreshedToken = await refreshAccessToken();  
        console.log(refreshedToken);
        if (!refreshedToken) {
            // localStorage.removeItem('token'); // Remove expired token
            // navigate('/login'); // Redirect to login
            console.log('You are not logged in');
            navigate('/login');
            return null;
        }
        // navigate('/');
        // refreshAccessToken();
        // return null; // No token, continue with the normal flow (show login page)
    }

    console.log('You are here');
    try {
        // Decode the token to check user details
        const decoded = jwtDecode(token);

        const currentTime = Date.now() / 1000; // Current time in seconds

        // Check if the token has expired
        if (decoded.exp < currentTime) {
            const refreshedToken = await refreshAccessToken();  
            console.log(refreshedToken);
            if (!refreshedToken) {
                // localStorage.removeItem('token'); // Remove expired token
                // navigate('/login'); // Redirect to login
                console.log('You got logged out');
                handleLogout(navigate);
                return null;
            }
            
            token = localStorage.getItem('token');
        }

        // if (!token) {
        //     // navigate('/login');
        //     handleLogout(navigate);
        //     return null; // No token, continue with the normal flow (show login page)
        // }

        // Decode the new token if refreshed, else use existing one
        const finalDecoded = jwtDecode(token);

        const routeMap = {
            admin: '/admin',
            seller: '/seller',
            customer: '/customer',
          };
        
          // Extract the current user type and the current pathname
        const userType = finalDecoded.user_type;
        const currentPath = window.location.pathname;
        
        //   // Check if the user is on a page that doesn't match their role-specific route
        //   if (routeMap[userType] && !currentPath.startsWith(routeMap[userType])) {
        //     navigate(routeMap[userType]);  // Redirect the user to their appropriate dashboard
        //     return null;  // Don't proceed with further logic
        //   }
        
        //   // Handle cases where non-admin users try to access admin routes
        //   const nonAdminRoutes = ['/login',
        //                           '/register', 
        //                           '/forgot-password'];

        //   if (nonAdminRoutes.includes(currentPath)) {
        //     // Redirect to the correct dashboard if the user is logged in but on a non-admin page
        //     navigate(routeMap[userType] || '/home');  // Default to home for any unknown roles
        //     return null;
        //   }

        // Check if the user is on a restricted route for their role
        if (userType !== 'admin' && currentPath.startsWith('/admin')) {
            navigate(routeMap[userType] || '/'); // Redirect to their dashboard
            return null;
        }

        // Handle other role-specific restrictions (add more conditions as needed)
        if (userType !== 'seller' && currentPath.startsWith('/seller')) {
            navigate(routeMap[userType] || '/'); // Redirect to their dashboard
            return null;
        }

        if (userType !== 'customer' && currentPath.startsWith('/customer')) {
            navigate(routeMap[userType] || '/'); // Redirect to their dashboard
            return null;
        }

        return finalDecoded;

    } catch (error) {
        console.error('Invalid token:', error);
        // localStorage.removeItem('token'); // Remove invalid token
        navigate('/login');
        // handleLogout(navigate);
        return null; // Token invalid, return null
    }
};

export default checkTokenAndRedirect;
