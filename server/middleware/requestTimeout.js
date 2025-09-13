const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

// Request timeout middleware
const requestTimeout = (timeout = 60000) => { // Increased to 60 seconds for API calls
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.log('⏰ Request timeout for:', req.method, req.path);
        res.status(408).json({
          success: false,
          error: 'Request timeout',
          code: 'REQUEST_TIMEOUT'
        });
      }
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timer);
    });

    // Clear timeout when response closes
    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
};

module.exports = requestTimeout;
