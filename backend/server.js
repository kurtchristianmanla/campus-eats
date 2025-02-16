// EXPRESS SERVER
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const http = require('http');
// const https = require('https');
const fs = require('fs');
// const { Server } = require('socket.io');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const cronjob = require('./jobs/cronjob')
const initializeSocket = require('./socket');

const app = express();
const port = 3000;

const options = {
    key: fs.readFileSync('./cert/localhost+1-key.pem'),  // Update with correct path
    cert: fs.readFileSync('./cert/localhost+1.pem')      // Update with correct path
};

// Create an HTTP server to attach the WebSocket server
const server = http.createServer(options, app);

const io = initializeSocket(server);

// // Session middleware setup
// app.use(session({
//     secret: 'mioqmioq', // Change this to a strong secret key
//     resave: false,
//     saveUninitialized: true,
//     cookie: {
//         secure: false,  // Set to true for HTTPS
//         httpOnly: true, // To prevent JavaScript from accessing the cookie
//         sameSite: 'strict'  // Or 'lax', depending on your needs
//     } // Set to true if using HTTPS
// }));

// Dynamically set the allowed origin
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.254.152:3001', 
    'http://192.168.254.152:3000',
    'http://192.168.254.153:3001',
    'http://192.168.72.22:3001',
    'http://192.168.137.1:3001'
];

// app.use(cors());
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          // Allow the request if the origin matches the allowed list
          callback(null, true);
        } else {
          // Reject the request if the origin is not allowed
          callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,  // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

// Import routes
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/manage');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');
const customerRoutes = require('./routes/customer');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const ratingRoutes = require('./routes/rating')

const transactionRoutes = require('./models/transaction'); 

// Test Route
app.get('/', (req, res) => {
    res.send('System backend is running!');
});

// Attach io to all requests
app.use((req, res, next) => {
    req.io = io; // Now req.io is available in all routes
    next();
});

// Use routes
app.use('/payment', paymentRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);
app.use('/customer', customerRoutes);
app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);

// require('./utils/ordercancel');
cronjob(io);

app.use('/transaction', transactionRoutes);

app.use('/rating', ratingRoutes);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React frontend
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start the server
server.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
