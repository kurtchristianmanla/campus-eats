const Redis = require('ioredis');

// Separate configurations for different Redis client types
const baseRedisConfig = {
  tls: {
    rejectUnauthorized: false // Required for Upstash
  },
  enableReadyCheck: false, // Critical for Bull compatibility
  maxRetriesPerRequest: null // Critical for Bull compatibility
};

// Main Redis client
const redis = new Redis(process.env.REDIS_URL, baseRedisConfig);

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
