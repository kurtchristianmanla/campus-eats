import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { handleLogout } from './logout';
import { refreshAccessToken } from './interceptor';
import Loading from '../utils/loading';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkToken = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;
                console.log('You got 1 here');

                // If the token is expired, try to refresh it
                if (decoded.exp - currentTime < 60) {
                    // localStorage.removeItem('token');
                    // handleLogout(navigate);
                    // setLoading(false);
                    // return;
                    const refreshedToken = await refreshAccessToken();  
                    console.log(refreshedToken);
                    if (!refreshedToken) {
                        // localStorage.removeItem('token'); // Remove expired token
                        // navigate('/login'); // Redirect to login
                        console.log('You got logged out');
                        handleLogout(navigate);
                        return null;
                    }
                }

                // Validate the user's role
                if (!allowedRoles.includes(decoded.user_type)) {
                    console.log('You got 4 here');
                    const routeMap = {
                        admin: '/admin',
                        seller: '/seller',
                        customer: '/customer',
                    };
                    setLoading(false);
                    return <Navigate to={routeMap[decoded.user_type] || '/'} replace />;
                }

                setIsAuthenticated(true);
                console.log('You got 5 here');
            } catch (error) {
                console.error('Token validation error:', error);
                // localStorage.removeItem('token');
                handleLogout(navigate);
            } finally {
                setLoading(false);
            }
        };

        checkToken();
    }, [allowedRoles, navigate]);

    if (loading) {
        return <Loading />;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
