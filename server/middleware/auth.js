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
    
    // Skip auth for testing weather, maps, and blockchain APIs
    if (req.path.includes('/weather/') || req.path.includes('/maps/') || req.path.includes('/blockchain/')) {
      console.log('🧪 Skipping auth for API testing - blockchain endpoints');
      req.user = { uid: 'demo-user-123', email: 'demo@safetourai.com' };
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided, using mock user for demo');
      req.user = { uid: 'demo-user-123', email: 'demo@safetourai.com' };
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    // Check if Firebase auth is available
    if (!auth) {
      console.log('⚠️ Firebase auth not available, using mock authentication');
      req.user = { uid: 'demo-user-123', email: 'demo@safetourai.com' };
      return next();
    }
    
    try {
      // Verify Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (firebaseError) {
      // Fallback to JWT verification for development
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
      } catch (jwtError) {
        console.log('⚠️ Token verification failed, using mock user for demo');
        // In demo mode, allow access with mock user
        req.user = { uid: 'demo-user-123', email: 'demo@safetourai.com' };
        next();
      }
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    console.log('⚠️ Auth error, using mock user for demo');
    req.user = { uid: 'demo-user-123', email: 'demo@safetourai.com' };
    next();
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
