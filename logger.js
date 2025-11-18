const fs = require('fs');
const path = require('path');
const { createLogger, transports, format } = require('winston');


const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}


const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [

    new transports.File({ filename: path.join(logDir, 'apiLogger.log') }),


    new transports.File({ filename: path.join(logDir, 'errorLogger.log'), level: 'error' })
  ]
});




module.exports = logger;
