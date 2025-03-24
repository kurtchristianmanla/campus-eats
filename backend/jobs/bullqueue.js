// services/queue.js
const Queue = require('bull');
const Redis = require('ioredis');
const redis = require('../middleware/redisclient');
const autoCancelOrders = require('./ordercancel');
const autoPrepareOrders = require('./preparepreorder');
const autoCancelOverdueOrders = require('./overdueorders');
const autoCompleteReadyOrders = require('./completeready');

// Initialize queue with Redis connection
const orderQueue = new Queue('orderProcessing', {
    createClient: (type) => {
        // Use the existing Redis client for normal operations
        if (type === 'client') {
            return redis;
        }
        // Create a new connection for subscribers
        return new Redis(process.env.REDIS_URL, {
            tls: {
            rejectUnauthorized: false
            },
            enableReadyCheck: false,
            maxRetriesPerRequest: null
        });
    },
    defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        }
    }
});

// Initialize workers
function startOrderWorkers(io) {
    // Each job gets its own processor
    orderQueue.process('autoCancel', 5, () => autoCancelOrders(io));
    orderQueue.process('autoPrepare', 5, () => autoPrepareOrders(io));
    orderQueue.process('autoCancelOverdue', 5, () => autoCancelOverdueOrders(io));
    orderQueue.process('autoCompleteReady', 5, () => autoCompleteReadyOrders(io));
    
    // Schedule the jobs (runs every minute)
    orderQueue.add('autoCancel', {}, { repeat: { cron: '* * * * *' },
        jobId: 'auto-cancel-orders' 
    });
    orderQueue.add('autoPrepare', {}, { repeat: { cron: '* * * * *' },
        jobId: 'auto-prepare-orders' 
    });
    orderQueue.add('autoCancelOverdue', {}, { repeat: { cron: '* * * * *' },
        jobId: 'auto-cancel-overdue' 
    });
    orderQueue.add('autoCompleteReady', {}, { repeat: { cron: '0 * * * *' },
        jobId: 'auto-complete-orders' 
    });

    console.log('Bull queue workers started');
}

module.exports = { orderQueue, startOrderWorkers };