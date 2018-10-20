const winston = require('winston');

/**
 * Creates a logger that allows logging messages in multiple places at once, such as logging to a
 * file, console, or somewhere else.
 * 
 * Below we've added a transport that will log all messages to the console.
 */
const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
    }),
  ]
});

module.exports = logger;