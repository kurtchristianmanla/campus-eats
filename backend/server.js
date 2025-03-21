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
const webPush = require("web-push");
const bodyParser = require("body-parser");

const cronjob = require('./jobs/cronjob')
const initializeSocket = require('./socket');

const app = express();
const port = 3000;

// Create an HTTP server to attach the WebSocket server
const server = http.createServer(app);

const io = initializeSocket(server);

// Dynamically set the allowed origin
const allowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://192.168.254.153:3001',
    'http://192.168.254.152:3001',
    'https://campus-eats-iota.vercel.app',
    'https://campus-eats-g5p3.onrender.com'
];

// app.use(cors());
app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie']
}));

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

// Import routes
const userRoutes = require('./routes/manage');
const adminRoutes = require('./routes/admin');
const sellerRoutes = require('./routes/seller');
const customerRoutes = require('./routes/customer');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/order');
const ratingRoutes = require('./routes/rating');
const subscribeRoutes = require('./routes/subscribe');
const queueRoutes = require('./routes/livequeue');

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
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/seller', sellerRoutes);
app.use('/customer', customerRoutes);
app.use('/menu', menuRoutes);
app.use('/order', orderRoutes);
app.use('/live-queue', queueRoutes);

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

const vapidKeys = {
    publicKey: "BEStfNvXPWzeQaUIY-g5lLoEf7WlIemaHqNv_3zinelWE441m04K9peJ1odXqbhK_DGxk5bVIGCTmrGWXaaxPYI",
    privateKey: "EIBWzpDpnxvZk_gQbNlTJOItdftTNAuZ0zFEHByjAv0",
};

webPush.setVapidDetails(
    "mailto:kurtchristianmanla@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

app.use('/push', subscribeRoutes);
  
// Start the server
server.listen(port, '0.0.0.0', () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
