import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { handleLogout } from './logout';
import { refreshAccessToken } from './interceptor';
import { checkTokenExpiration } from './tokenutils';
import Loading from '../utils/loading';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const validateToken = async () => {
            const token = await checkTokenExpiration();

            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const decoded = jwtDecode(token);

                // Check if the user's role is allowed
                if (!allowedRoles.includes(decoded.user_type)) {
                    navigate('/'); // Redirect to a default route
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Token validation error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [allowedRoles, navigate]);

    if (loading) {
        return <Loading />;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
