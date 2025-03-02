// redisClient.js
const redis = require('redis');

const client = redis.createClient();

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

client.connect().then(() => {
  console.log('Redis client connected');
}).catch((err) => {
  console.error('Redis connection failed:', err);
});

module.exports = client;