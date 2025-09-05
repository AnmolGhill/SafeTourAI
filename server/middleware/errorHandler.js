const logger = require('../utils/logger');

// Custom error class for application-specific errors
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper to catch unhandled promise rejections
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Handle different types of errors
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleFirebaseError = (err) => {
  let message = 'Firebase operation failed';
  let statusCode = 500;
  let code = 'FIREBASE_ERROR';

  switch (err.code) {
    case 'auth/user-not-found':
      message = 'User not found';
      statusCode = 404;
      code = 'USER_NOT_FOUND';
      break;
    case 'auth/wrong-password':
      message = 'Invalid credentials';
      statusCode = 401;
      code = 'INVALID_CREDENTIALS';
      break;
    case 'auth/email-already-in-use':
      message = 'Email already in use';
      statusCode = 400;
      code = 'EMAIL_IN_USE';
      break;
    case 'auth/weak-password':
      message = 'Password is too weak';
      statusCode = 400;
      code = 'WEAK_PASSWORD';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email format';
      statusCode = 400;
      code = 'INVALID_EMAIL';
      break;
    case 'permission-denied':
      message = 'Permission denied';
      statusCode = 403;
      code = 'PERMISSION_DENIED';
      break;
    case 'unavailable':
      message = 'Service temporarily unavailable';
      statusCode = 503;
      code = 'SERVICE_UNAVAILABLE';
      break;
  }

  return new AppError(message, statusCode, code);
};

// Send error response in development
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    code: err.code,
    details: err.details,
    stack: err.stack,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
};

// Send error response in production
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Global error handler triggered:', {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: error.stack
  });

  // Default error values
  let message = error.message || 'Internal Server Error';
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
    code = 'RESOURCE_NOT_FOUND';
  }

  // Duplicate key error
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
    code = 'DUPLICATE_ERROR';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token';
    statusCode = 401;
    code = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expired';
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
  }

  // Ensure response is sent as JSON with proper headers
  try {
    res.status(statusCode).json({
      success: false,
      error: message,
      code: code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } catch (responseError) {
    console.error('❌ Failed to send error response:', responseError);
    // Fallback response
    res.status(500).end('Internal Server Error');
  }
};

// Note: Process error handlers moved to server.js to avoid circular dependencies

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler
};
