const Redis = require('ioredis');

// Load Redis URL from environment variables
const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false, // Required for Upstash
  },
});

// Event listeners for better debugging
redis.on('connect', () => console.log('Connected to Upstash Redis'));
redis.on('error', (err) => console.error('Redis Error:', err));
redis.on('close', () => console.log('Redis connection closed'));

// Gracefully close Redis when app stops
process.on('SIGINT', async () => {
  await redis.quit();
  console.log('Redis client disconnected');
  process.exit(0);
});

module.exports = redis;
