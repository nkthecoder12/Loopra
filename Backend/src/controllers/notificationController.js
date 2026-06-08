const NotificationService = require("../services/notificationService");

/**
 * Dispatch manual alert (Admin only)
 */
const sendSystemAlert = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    
    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Email, subject, and message are required" });
    }

    // Role verification (Admin only)
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized. Admin privileges required." });
    }

    await NotificationService.sendEmail(email, subject, message);

    return res.status(200).json({
      success: true,
      message: `System alert successfully queued and dispatched to ${email}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendSystemAlert
};
