const logger = require('../utils/logger');
const { AppError } = require('./errorHandler');

// Request timeout middleware
const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        // Use console.warn as fallback if logger.warn is not available
        if (typeof logger.warn === 'function') {
          logger.warn('Request timeout:', {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            timeout: timeoutMs
          });
        } else {
          console.warn('Request timeout:', {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            timeout: timeoutMs
          });
        }
        
        const error = new AppError('Request timeout', 408, 'REQUEST_TIMEOUT');
        next(error);
      }
    }, timeoutMs);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    // Clear timeout when response closes
    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

module.exports = requestTimeout;
