import api from './interceptor';

// Get average rating for a product
export const getAverageProductRating = async (productId) => {
    try {
        const response = await api.get(`/rating/product/average/${productId}`);
        return response.data.averageRating;
    } catch (error) {
        console.error("Error fetching product rating:", error);
        return "No ratings yet";
    }
};

// Submit a product rating
export const rateProduct = async (token, productId, orderId, rating, review) => {
    try {
        const response = await api.post(
            '/rating/product',
            { productId, orderId, rating, review },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error submitting product rating:", error.response?.data?.message || error.message);
        throw error;
    }
};

// Get average rating for a seller
export const getAverageSellerRating = async (sellerId) => {
    try {
        const response = await api.get(`/rating/seller/average/${sellerId}`);
        return response.data.averageRating;
    } catch (error) {
        console.error("Error fetching seller rating:", error);
        return "No ratings yet";
    }
};

// Submit a seller rating
export const rateSeller = async (sellerId, rating, review, token) => {
    try {
        const response = await api.post(
            `/rating/seller`,
            { sellerId, rating, review },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error("Error submitting seller rating:", error.response?.data?.message || error.message);
        throw error;
    }
};
