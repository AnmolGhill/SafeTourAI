const jwt = require('jsonwebtoken');
const { auth } = require('../config/firebase');
const logger = require('../utils/logger');

// Verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware hit:', {
      path: req.path,
      method: req.method,
      hasAuth: !!req.headers.authorization
    });
    
    // Skip auth for testing weather and maps APIs
    if (req.path.includes('/weather/') || req.path.includes('/maps/')) {
      console.log('🧪 Skipping auth for API testing');
      req.user = { uid: 'test-user', email: 'test@example.com' };
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (firebaseError) {
      // Fallback to JWT verification for development
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (jwtError) {
        logger.error('Token verification failed:', { firebaseError, jwtError });
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || req.user.custom_claims?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin']);

// Sub-admin or admin middleware
const requireSubAdmin = requireRole(['admin', 'subadmin']);

module.exports = {
  verifyFirebaseToken,
  requireRole,
  requireAdmin,
  requireSubAdmin
};
