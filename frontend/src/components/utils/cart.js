// utils/cart.js

const getCartKey = (userId) => `cart_${userId}`;
const getPayKey = (userId) => `pay_${userId}`;

export const getCart = (userId) => {
    const cart = localStorage.getItem(getCartKey(userId));
    // return cart ? JSON.parse(cart) : [];

    const parsedCart = cart ? JSON.parse(cart) : [];

    // Ensure all items have a status, defaulting to 'cart'
    return parsedCart.map(item => ({
        ...item,
        status: item.status || 'cart'
    }));
};

export const addToCart = (userId, item, quantity) => {
    console.log("Added to", userId);
    const cart = getCart(userId);
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === item._id); // Compare using _id or another unique identifier

    if (existingItemIndex > -1) {
        // If the item already exists, update the quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // If the item doesn't exist, add it to the cart
        cart.push({ ...item, quantity: quantity, status: 'cart' });
    }

    // Save the updated cart to localStorage
    localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
};

export const removeFromCart = (userId, itemId, quantity) => {
    const cart = getCart(userId);
    const existingItemIndex = cart.findIndex(item => item._id === itemId);

    if (existingItemIndex > -1) {
        // Decrease quantity if more than 1 is left
        if (cart[existingItemIndex].quantity > quantity) {
            cart[existingItemIndex].quantity -= quantity;
        } else {
            // Remove item completely if quantity is less than or equal to the specified quantity
            cart.splice(existingItemIndex, 1);
        }
    }

    localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
};

export const clearCart = (userId) => {
    localStorage.removeItem(getCartKey(userId));
};

export const getItemsToPay = (userId) => {
    const items = localStorage.getItem(getPayKey(userId));
    return items ? JSON.parse(items) : [];
};

export const addToPay = (userId, items) => {
    // Clear previous items to pay
    localStorage.removeItem(getPayKey(userId));
    
    const itemsToPay = getItemsToPay(userId);
    items.forEach(item => {
        if (!itemsToPay.some(existingItem => existingItem._id === item._id)) {
            itemsToPay.push(item);
        }
    });
    localStorage.setItem(getPayKey(userId), JSON.stringify(itemsToPay));
};

export const clearItemsToPay = (userId) => {
    localStorage.removeItem(getPayKey(userId));
};

export const updateItemStatus = (userId, itemId, newStatus) => {
    const cart = getCart(userId);
    const itemIndex = cart.findIndex(item => item._id === itemId);

    if (itemIndex !== -1) {
        cart[itemIndex].status = newStatus;
        localStorage.setItem(getCartKey(userId), JSON.stringify(cart));
    }
};

export const removePaidItemsFromCart = (userId) => {
    const cartItems = getCart(userId);
    const payItems = getItemsToPay(userId);

    // Filter out items present in the payItems
    const updatedCart = cartItems.filter(
        (cartItem) => !payItems.some((payItem) => payItem._id === cartItem._id)
    );

    // Save the updated cart back to localStorage
    localStorage.setItem(getCartKey(userId), JSON.stringify(updatedCart));

    return updatedCart; // Optional: Return the updated cart
};
