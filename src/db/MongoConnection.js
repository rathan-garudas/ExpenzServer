const env = require('../env');
const mongoose = require('mongoose');
const { logger } = require('../utils');
const path = require('path');

const filepath = `${path.dirname(__filename)}\ ${path.basename(__filename)}`;
mongoose.connect(env.MONGO_URL);

mongoose.connection.on('open', () => {
    logger.info(`${filepath} Connected to Mongo`);
});

module.exports = mongoose;