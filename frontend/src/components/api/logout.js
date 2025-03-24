import { useNavigate } from 'react-router-dom';
import api from './interceptor';

export const handleLogout = async (navigate) => {
    try {
        const response = await api.post('/user/logout', {}, { withCredentials: true });
        if (response.status !== 200) {
            throw new Error('Logout failed');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('sessionToken');
        navigate('/login'); // Redirect user to login page
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

// Hook version for components that need it
const useHandleLogout = () => {
    const navigate = useNavigate();
    return () => handleLogout(navigate);
};

// const useHandleLogout = () => {
//     const navigate = useNavigate();

//     const handleLogout = async () => {
//         try {
//             // Send logout request to the server
//             const response = await api.post('/user/logout', {}, {
//                 withCredentials: true, // Ensure cookies (refresh token) are sent
//             });
        
//             if (response.status !== 200) {
//                 throw new Error('Logout failed');
//             }
        
//             // Remove access token from localStorage
//             localStorage.removeItem('token');
        
//             // Redirect the user to the login page
//             navigate('/login'); // React Router navigation to login page
//         } catch (error) {
//             console.error('Error during logout:', error);
//         }        
//     };

//     return handleLogout;
// };

export default useHandleLogout;
