const mongoose = require('mongoose');

const username = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;
const host = 'localhost';
const port = 27017;
const database = "campus_eats_db";

console.log('MongoDB Credentials:', username, password);

// const mongoURI = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB Database!');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

// Export mongoose for use in other parts of the application
module.exports = mongoose;
