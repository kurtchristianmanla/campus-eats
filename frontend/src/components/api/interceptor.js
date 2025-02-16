import axios from 'axios';

// const protocol = process.env.REACT_APP_PROTOCOL || "http";
// const host_ip = process.env.REACT_APP_HOST_IP || "localhost";
// const backend_port = process.env.REACT_APP_BACKEND_PORT || "3000";

// const address = `${protocol}://${host_ip}:${backend_port}`;

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

// Create an Axios instance
const api = axios.create({
  baseURL: address, // Your API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to refresh the access token
export const refreshAccessToken = async () => {
    try {
        console.log('Function refreshAccessToken is being called...');
        console.log('Address: ', address);
        const response = await axios.post(`${address}/user/refresh`, {}, {
            withCredentials: true, // Include cookies (to send refresh token)
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Refresh response:', response.data);
        
        if (response.data.access_token) {
            console.log('Successfully updated token');
            localStorage.setItem('token', response.data.access_token);
            return response.data.access_token;
        } else {
            throw new Error('No access token in response');
        }
    } catch (error) {
        console.error('Refresh token error:', error.response?.data || error.message);
        return null;
    }
};

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration and retry failed requests
api.interceptors.response.use(
  (response) => response,  // If the response is valid, return it
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Mark the request to avoid infinite retry loops
      originalRequest._retry = true;

      try {
        // Refresh the access token
        const newAccessToken = await refreshAccessToken();

        // Update the Authorization header with the new token
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request with the new access token
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Optionally, log the user out if the refresh fails
      }
    }
    return Promise.reject(error);
  }
);

export default api;
