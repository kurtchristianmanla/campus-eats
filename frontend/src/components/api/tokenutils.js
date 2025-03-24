import { jwtDecode } from 'jwt-decode';
import { refreshAccessToken } from './interceptor';

export const checkTokenExpiration = async () => {
    const token = localStorage.getItem('token');
    const sessionToken = localStorage.getItem('sessionToken');

    if (!token || !sessionToken) {
        return null; // No token, user needs to log in
    }

    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Current time in seconds

        // If the token is expired or about to expire (within 1 minute), refresh it
        if (decoded.exp - currentTime < 60) {
            const newToken = await refreshAccessToken();
            if (!newToken) {
                throw new Error('Failed to refresh token');
            }
            localStorage.setItem('token', newToken);
            return newToken;
        }

        return token; // Token is still valid
    } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token'); // Remove invalid token
        localStorage.removeItem('sessionToken');
        return null;
    }
};