const User = require("../models/User");

const verifyGuard = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized. No token details." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Bypass verification check for admin
    if (user.role === "ADMIN") {
      return next();
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Account not verified. Please verify your email first.",
        isVerified: false
      });
    }

    next();
  } catch (error) {
    console.error("[verifyGuard] Error checking verification status:", error.message);
    return res.status(500).json({ success: false, message: "Server error in verification check." });
  }
};

module.exports = verifyGuard;
