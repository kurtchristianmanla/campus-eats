// api/orderService.js
import api from './interceptor';
import { toast } from 'react-toastify';

// Create order(s) from cart
export const createOrders = async (token, cartItems, isPreOrder, scheduledTime = null) => {
    // Group items by seller
    const itemsBySeller = cartItems.reduce((acc, item) => {
        if (!acc[item.sellerId]) {
        acc[item.sellerId] = [];
        }
        acc[item.sellerId].push(item);
        return acc;
    }, {});

    // Create orders for each seller
    const orderPromises = Object.entries(itemsBySeller).map(([sellerId, items]) => {
        return api.post('/order/create', {
                items,
                sellerId,
                orderType: isPreOrder ? 'pre-order' : 'regular',
                scheduledTime: isPreOrder ? scheduledTime : null,
            }, 
            {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    });

    // return Promise.all(orderPromises);
    return Promise.allSettled(orderPromises).then(results => {
        results.forEach(result => {
            if (result.status === "rejected") {
                console.error("Order creation failed:", result.reason);
            }
        });
        return results;
    });
};

// Seller: Update to preparing
export const startPreparingOrder = async (token, orderId) => {
    // return api.put(`/order/prepare/${orderId}`);
    try {
        const response = await api.put(`/order/prepare/${orderId}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });
        return response.data;  // Returns the updated order
    } catch (error) {
        console.error('Failed to update order status:', error.response?.data || error.message);
        throw error;  // Re-throw to handle errors in the UI
    }
};

// Seller: Mark as ready
export const markOrderReady = async (token, orderId) => {
    // return api.put(`/order/ready/${orderId}`);
    try {
        const response = await api.put(`/order/ready/${orderId}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });
        return response.data;  // Returns the updated order
    } catch (error) {
        console.error('Failed to update order status:', error.response?.data || error.message);
        throw error;  // Re-throw to handle errors in the UI
    }
};

// Customer: Complete order
export const completeOrder = async (token, orderId) => {
    // return api.put(`/order/complete/${orderId}`);
    try {
        const response = await api.put(`/order/complete/${orderId}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });
        return response.data;  // Returns the updated order
    } catch (error) {
        console.error('Failed to update order status:', error.response?.data || error.message);
        throw error;  // Re-throw to handle errors in the UI
    }
};

// Either party: Cancel order
export const cancelOrder = async (token, orderId, reason) => {
    // return api.put(`/order/cancel/${orderId}`, { reason });
    try {
        const response = await api.put(
            `/order/cancel/${orderId}`,
            { reason }, // Send the reason in the request body
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Order cancellation failed:", error.response?.data || error.message);
        throw error;
    }
};

// Fetch orders based on the user's token
export const getOrders = async (token) => {
    try {
        const response = await api.get('/order', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

// Get single order details
export const getOrderDetails = async (token, orderId) => {
    // return api.get(`/order/${orderId}`);
    try {
        const response = await api.get(`/order/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};