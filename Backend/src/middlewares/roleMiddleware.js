const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
      // req.user is set by authMiddleware
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });
      }
  
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: role not allowed"
        });
      }
  
      next();
    };
  };
  
  module.exports = roleMiddleware;
  