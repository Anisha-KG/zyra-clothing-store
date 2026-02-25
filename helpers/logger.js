const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'error', // only log errors
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Error logs will go into this file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error'
    })
  ]
});

module.exports = logger;