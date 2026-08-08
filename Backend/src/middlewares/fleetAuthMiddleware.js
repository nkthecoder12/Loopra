const User = require("../models/User");

const fleetAuthMiddleware = async (req, res, next) => {
  try {
    // 1. Check if authMiddleware has run
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token required"
      });
    }

    // 2. Enforce FLEET_OPERATOR role
    if (req.user.role !== "FLEET_OPERATOR") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Fleet Operator role required"
      });
    }

    // 3. Derive fleet relationship securely from DB (do not trust frontend inputs)
    const userDoc = await User.findById(req.user.id).select("fleetId status isBlocked isDeleted");
    if (!userDoc || userDoc.isDeleted || userDoc.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Account is inactive or suspended"
      });
    }

    if (!userDoc.fleetId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User is not associated with any fleet"
      });
    }

    // 4. Attach derived fleetId to request object
    req.fleetId = userDoc.fleetId;
    next();
  } catch (error) {
    console.error("[fleetAuthMiddleware Error]:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during fleet authorization"
    });
  }
};

module.exports = fleetAuthMiddleware;
