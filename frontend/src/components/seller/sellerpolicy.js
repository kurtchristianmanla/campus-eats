import UsePolicy from '../utils/usepolicy';
import { useEffect } from 'react';
import { useNotification } from '../utils/notification';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';

const backend_url = process.env.REACT_APP_BACKEND_URL;
const address = `${backend_url}`;

const SellerPolicy = () => {
    const [socket, setSocket] = useState(null); 
    const { showNotification } = useNotification();

    // Extract sellerId from the token stored in localStorage
    const token = localStorage.getItem('token');
    const sellerId = token ? jwtDecode(token).user_id : null;

    useEffect(() => {

        // Initialize the Socket.IO connection
        const socketConnection = io(address);
        setSocket(socketConnection);

        // Join the seller-specific room
        socketConnection.emit('joinSellerRoom', sellerId);

        const receiveNewOrder = (data) => {
            if (data.sellerId === sellerId) {
                showNotification('New Order Received!', `Order #${data.newOrder.orderNumber}`, 'seller');
                toast.info(
                    'New Order Received!'
                );
                console.log('New Order Received:', data.newOrder.orderNumber);
            }
        };

        const orderStatusChanged = (data) => {
            if (data.order.sellerId === sellerId) {
                showNotification('Order Status Updated!', `Order #${data.order.orderNumber}`, 'seller');
            }
        };

        const warningOverdueOrders = (data) => {
            if (data.order.sellerId === sellerId) {
                toast.info(
                    data.message, {
                    duration: 5000,
                });
            }
        };

        // Listen for new orders
        socketConnection.on('newOrder', receiveNewOrder);
        socketConnection.on('updateOrder', orderStatusChanged);
        socketConnection.on('overdueOrder', warningOverdueOrders);

        // Clean up the socket connection when the component unmounts
        return () => {
            socketConnection.off('newOrder', receiveNewOrder); // Remove the listener
            socketConnection.off('updateOrder', orderStatusChanged);
            socketConnection.off('overdueOrder', warningOverdueOrders);
            socketConnection.disconnect(); // Disconnect the socket
        };
    }, [sellerId, showNotification]);
    
    return (
        <UsePolicy
            user_type_route={(-1)}
        />
    )
};

export default SellerPolicy;
