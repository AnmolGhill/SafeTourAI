const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

// Enhanced rate limiting with better error handling
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.MAX_REQUESTS_PER_WINDOW) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => {
      return req.ip + ':' + (req.user?.uid || 'anonymous');
    },
    handler: (req, res, next) => {
      // Use lazy logger to avoid circular dependency
      const logger = require('../utils/logger');
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
        user: req.user?.uid || 'anonymous'
      });

      const error = new AppError(
        'Too many requests from this IP, please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED',
        {
          retryAfter: Math.round(options.windowMs / 1000) || 900,
          limit: options.max || 100
        }
      );
      next(error);
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Strict rate limiter for auth endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (increased from 10)
  message: 'Too many authentication attempts, please try again later.'
});

// API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300 // limit each IP to 300 requests per windowMs
});

// Lenient limiter for status checking endpoints
const statusLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200 // limit each IP to 200 requests per 5 minutes
});

// Strict limiter for sensitive operations
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: 'Too many attempts for this sensitive operation, please try again later.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  statusLimiter,
  strictLimiter
};
