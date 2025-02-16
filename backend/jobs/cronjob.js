const cron = require('node-cron');
const autoCancelOrders = require('./ordercancel');
const autoPrepareOrders = require('./preparepreorder');
const autoCancelOverdueOrders = require('./overdueorders');

module.exports = (io) => {
    cron.schedule('* * * * *', async () => {
        try {
            await autoCancelOrders(io);
            await autoPrepareOrders(io);
            await autoCancelOverdueOrders(io);
        } catch (error) {
            console.error('Cron job error:', error);
        }
    });
};
