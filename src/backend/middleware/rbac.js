const { verifyToken } = require('../utils/jwt');

const authorize = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    const userRoles = req.user.roles || [];
    
    if (requiredRoles.length === 0) {
      return next();
    }
    
    const hasAccess = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  const userRoles = req.user.roles || [];
  
  if (!userRoles.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  next();
};

const requireSystem = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  const userRoles = req.user.roles || [];
  
  if (!userRoles.includes('system')) {
    return res.status(403).json({
      success: false,
      error: 'System access required'
    });
  }
  
  next();
};

module.exports = {
  authorize,
  requireAdmin,
  requireSystem
};
