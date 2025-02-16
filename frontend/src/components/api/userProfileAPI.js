import { jwtDecode } from 'jwt-decode';
import api from './interceptor';

export const fetchUserProfile = async (token) => {
    const decoded = jwtDecode(token);
    try {
        const response = await api.get(`/${decoded.user_type}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        return response.data; // Axios automatically parses the JSON response
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error; // Rethrow to handle in the caller
    }
};

export const updateUserProfile = async (token, formData) => {
    const decoded = jwtDecode(token);
    try {
        const response = await api.put(`/${decoded.user_type}/profile`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });

        return response.data; // Return JSON response if successful
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;  // Rethrow to handle in the caller
    }
};

export const changeUserPassword = async (token, currentPassword, newPassword) => {
    const decoded = jwtDecode(token);
    try {
        const response = await api.put(`/${decoded.user_type}/change-password`, {
            currentPassword,
            newPassword,
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data; // Return the response data, Axios handles JSON parsing
    } catch (error) {
        console.error('Error changing password:', error);
        throw error;  // Rethrow to handle in the caller
    }
};
