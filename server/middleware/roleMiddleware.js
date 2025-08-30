// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;

      // Check if user's role is in the allowed roles array
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role verification failed',
        error: error.message
      });
    }
  };
};

// Admin only access
const requireAdmin = (req, res, next) => {
  return requireRole(['admin'])(req, res, next);
};

// Responder or Admin access
const requireResponder = (req, res, next) => {
  return requireRole(['responder', 'admin'])(req, res, next);
};

// User, Responder, or Admin access (authenticated users)
const requireUser = (req, res, next) => {
  return requireRole(['user', 'responder', 'admin'])(req, res, next);
};

// Check if user has specific permission for emergency operations
const requireEmergencyAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const emergencyUserId = req.params.userId || req.body.userId;

    // Admin and responders have full access
    if (userRole === 'admin' || userRole === 'responder') {
      return next();
    }

    // Users can only access their own emergencies
    if (userRole === 'user' && req.user.userId === emergencyUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for emergency operations'
    });
  } catch (error) {
    console.error('Emergency access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Permission verification failed',
      error: error.message
    });
  }
};

// Check if user can modify blockchain transactions
const requireBlockchainAccess = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const transactionUserId = req.params.userId || req.body.userId;

    // Admin has full access
    if (userRole === 'admin') {
      return next();
    }

    // Responders can verify transactions
    if (userRole === 'responder' && req.method === 'POST' && req.path.includes('verify')) {
      return next();
    }

    // Users can only access their own transactions
    if (userRole === 'user' && req.user.userId === transactionUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for blockchain operations'
    });
  } catch (error) {
    console.error('Blockchain access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Blockchain permission verification failed',
      error: error.message
    });
  }
};

// Dynamic role checker with custom logic
const checkPermission = (permissionLogic) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const hasPermission = permissionLogic(req.user, req);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

// Role hierarchy checker (admin > responder > user)
const requireMinimumRole = (minimumRole) => {
  const roleHierarchy = {
    'user': 1,
    'responder': 2,
    'admin': 3
  };

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRoleLevel = roleHierarchy[req.user.role] || 0;
      const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Minimum required role: ${minimumRole}`
        });
      }

      next();
    } catch (error) {
      console.error('Minimum role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role verification failed',
        error: error.message
      });
    }
  };
};

module.exports = {
  requireRole,
  requireAdmin,
  requireResponder,
  requireUser,
  requireEmergencyAccess,
  requireBlockchainAccess,
  checkPermission,
  requireMinimumRole
};
