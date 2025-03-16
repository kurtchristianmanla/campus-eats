import ProfileUser from '../utils/userProfilePage';
import { useEffect } from 'react';
import { useNotification } from '../utils/notification';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const ProfileCustomer = () => {
    const [socket, setSocket] = useState(null); 
    const { showNotification } = useNotification();

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const userId = token ? jwtDecode(token).user_id : null;

    useEffect(() => {
        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        socketConnection.emit("registerUser", userId);

        const orderStatusChanged = (data) => {
            if (data.order.customerId === userId) {

                // Map status to user-friendly text
                const statusTextMap = {
                    'cart': 'Cart',
                    'pending': 'Pending',
                    'preparing': 'Preparing',
                    'ready': 'Ready for Pickup',
                    'completed': 'Completed',
                    'cancelled': 'Cancelled',
                    'pre-order': 'Pre-Order'
                };

                // Get the user-friendly status text
                const statusText = statusTextMap[data.order.status] || 'Unknown Status';

                if (data.order.status === 'cancelled') {
                    toast.error(
                        `Order #${data.order.orderNumber} is now ${statusText}.`
                    );
                } else {
                    toast.success(
                        `Order #${data.order.orderNumber} is now ${statusText}.`
                    );
                }

                // Show notification with updated status text
                showNotification(
                    'Order Status Updated!', 
                    `Order #${data.order.orderNumber} is now ${statusText}.`
                );
            }
        };

        // Listen for new orders
        socketConnection.on('updateOrder', orderStatusChanged);
        
        // Clean up the styles on component unmount
        return () => {
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.disconnect();
            // document.body.style.overflow = 'auto';
            // document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1.0');
        };
    }, [showNotification, userId]);
    
    return (
        <ProfileUser
            user_type_route={(-1)}
        />
    )
};

export default ProfileCustomer;
