const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyIdToken } = require('../config/firebase');

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Try JWT verification first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userId: decoded.userId });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      req.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
        name: user.name
      };
      
      next();
    } catch (jwtError) {
      // If JWT fails, try Firebase token verification
      try {
        const decodedFirebaseToken = await verifyIdToken(token);
        const user = await User.findOne({ email: decodedFirebaseToken.email });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found'
          });
        }

        if (!user.isActive) {
          return res.status(401).json({
            success: false,
            message: 'User account is deactivated'
          });
        }

        req.user = {
          userId: user.userId,
          email: user.email,
          role: user.role,
          name: user.name
        };
        
        next();
      } catch (firebaseError) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ userId: decoded.userId });
      
      if (user && user.isActive) {
        req.user = {
          userId: user.userId,
          email: user.email,
          role: user.role,
          name: user.name
        };
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      try {
        const decodedFirebaseToken = await verifyIdToken(token);
        const user = await User.findOne({ email: decodedFirebaseToken.email });
        
        if (user && user.isActive) {
          req.user = {
            userId: user.userId,
            email: user.email,
            role: user.role,
            name: user.name
          };
        } else {
          req.user = null;
        }
      } catch (firebaseError) {
        req.user = null;
      }
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Verify user owns resource or is admin
const verifyOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      if (!resourceUserId) {
        return res.status(400).json({
          success: false,
          message: 'Resource user ID not provided'
        });
      }

      // Allow if user owns the resource or is admin
      if (req.user.userId === resourceUserId || req.user.role === 'admin') {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access this resource'
        });
      }
    } catch (error) {
      console.error('Ownership verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

// Rate limiting middleware (basic implementation)
const rateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const identifier = req.user ? req.user.userId : req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for this identifier
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }

    const userRequests = requests.get(identifier);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(identifier, validRequests);

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    validRequests.push(now);
    next();
  };
};

// Validate API key (for external integrations)
const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // In production, you would validate against a database of API keys
    const validApiKeys = process.env.VALID_API_KEYS ? process.env.VALID_API_KEYS.split(',') : [];
    
    if (!validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'API key validation failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  verifyOwnership,
  rateLimiter,
  validateApiKey
};
