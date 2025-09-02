const winston = require('winston');
const path = require('path');

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] [${service}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` | ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'safetourai-backend' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: customFormat
    }),
    // Security logs for auth events
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: customFormat
    })
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        let log = `${timestamp} [${level}] ${message}`;
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    )
  }));
}

// Enhanced logging methods with context
const enhancedLogger = {
  ...logger,
  
  // Security-related logging
  security: (message, meta = {}) => {
    logger.warn(message, { ...meta, category: 'security' });
  },
  
  // API request logging
  apiRequest: (req, meta = {}) => {
    logger.info('API Request', {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user?.uid || 'anonymous',
      ...meta
    });
  },
  
  // API response logging
  apiResponse: (req, res, meta = {}) => {
    logger.info('API Response', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      user: req.user?.uid || 'anonymous',
      responseTime: res.get('X-Response-Time'),
      ...meta
    });
  },
  
  // Database operation logging
  dbOperation: (operation, collection, meta = {}) => {
    logger.info('Database Operation', {
      operation,
      collection,
      ...meta
    });
  },
  
  // Error logging with enhanced context
  errorWithContext: (error, req = null, meta = {}) => {
    const errorContext = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      ...meta
    };

    if (req) {
      errorContext.request = {
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user?.uid || 'anonymous'
      };
    }

    logger.error('Application Error', errorContext);
  }
};

module.exports = enhancedLogger;
