const { Server } = require('socket.io');

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: '*', // Adjust this to your frontend's origin
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
    });

    io.on('connection', (socket) => {
        console.log('New Socket.IO connection established.');

        socket.on('message', (message) => {
            console.log(`Received message: ${message}`);
            io.emit('message', `Server received: ${message}`);
        });

        socket.on('joinSellerRoom', (sellerId) => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) socket.leave(room);
            });
            socket.join(`seller_${sellerId}`);
            console.log(`Seller ${sellerId} joined their room`);
        });

        socket.on('registerUser', (userId) => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) socket.leave(room);
            });
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        socket.on('updateBalance', (data) => {
            const { userId } = data;
            io.to(`user_${userId}`).emit('balanceAdded', data);
            console.log(`Balance update sent to user ${userId}`);
        });

        socket.on('sellerStatusChanged', (data) => {
            const { storeName, isSelling } = data;
            console.log(`Store '${storeName}' is now ${isSelling ? 'available' : 'unavailable'}.`);
        });

        socket.on('menuAdded', (data) => {
            io.to(`seller_${data.sellerId}`).emit('menuAdded', data);
        });

        socket.on('menuUpdated', (data) => {
            io.to(`seller_${data.sellerId}`).emit('menuUpdated', data);
        });

        socket.on('menuDeleted', (data) => {
            io.to(`seller_${data.sellerId}`).emit('menuDeleted', data);
        });

        socket.on('newOrder', (data) => {
            io.to(`seller_${data.sellerId}`).emit('newOrder', data);
        });

        socket.on('updateOrder', (data) => {
            io.to(`seller_${data.order.sellerId}`).emit('updateOrder', data);
            io.to(`user_${data.order.customerId}`).emit('updateOrder', data);
        });

        // socket.on('updateQueue', (data) => {
        //     io.to(`seller_${data.order.sellerId}`).emit('updateOrder', data);
        //     io.to(`user_${data.order.customerId}`).emit('updateOrder', data);
        // });

        // socket.on('overdueOrder', (data) => {
        //     if (data.warningOrders.length > 0) {
        //         data.warningOrders.forEach(order => {
        //             io.to(`seller_${order.sellerId}`).emit('overdueOrder', { 
        //                 message: `Order #${order._id} is overdue!`, 
        //                 order 
        //             });
        //         });
        //     }
        // });

        socket.on('disconnect', () => {
            console.log('A client disconnected.');
        });

        socket.emit('welcome', 'Welcome to the Socket.IO server!');
    });

    return io;
};

module.exports = initializeSocket;
