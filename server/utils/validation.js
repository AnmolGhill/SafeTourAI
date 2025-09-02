const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    const error = new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      { errors: formattedErrors }
    );
    
    return next(error);
  }
  
  next();
};

// Sanitize input data
const sanitizeInput = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Basic XSS protection
      sanitized[key] = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Input sanitization middleware
const sanitizeInputMiddleware = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
};

module.exports = {
  handleValidationErrors,
  sanitizeInput,
  sanitizeInputMiddleware
};
