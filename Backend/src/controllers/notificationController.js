const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const NotificationService = require("../services/notificationService");
const DeviceToken = require("../models/DeviceToken");

/**
 * Dispatch manual alert (Admin only - Legacy support)
 */
const sendSystemAlert = async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Email, subject, and message are required" });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized. Admin privileges required." });
    }

    await NotificationService.sendEmail(email, subject, message);

    return res.status(200).json({
      success: true,
      message: `System alert successfully queued and dispatched to ${email}`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated notifications list for user
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { userId };

    // Filter by read status if provided
    if (req.query.isRead !== undefined) {
      query.isRead = req.query.isRead === "true";
    }

    // Filter by notification category type if provided
    if (req.query.category && req.query.category !== "ALL") {
      query.type = req.query.category.toUpperCase();
    }

    // Search query on title/message
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { message: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // Return current notifications that have started scheduled time
    query.scheduledAt = { $lte: new Date() };

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    // Automatically update PENDING/SENT notifications to DELIVERED when retrieved by client
    const pendingIds = notifications
      .filter((n) => ["PENDING", "SENT"].includes(n.status))
      .map((n) => n._id);

    if (pendingIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: pendingIds } },
        {
          $set: {
            status: "DELIVERED",
            "analytics.sentAt": new Date(),
          },
        }
      );
      // Update local array status for response
      notifications.forEach((n) => {
        if (pendingIds.includes(n._id)) {
          n.status = "DELIVERED";
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get count of unread notifications
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({
      userId,
      isRead: false,
      scheduledAt: { $lte: new Date() },
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    notification.status = "READ";
    if (!notification.analytics.openedAt) {
      notification.analytics.openedAt = new Date();
    }

    await notification.save();

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all user notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const result = await Notification.updateMany(
      { userId, isRead: false, scheduledAt: { $lte: new Date() } },
      {
        $set: {
          isRead: true,
          readAt: now,
          status: "READ",
          "analytics.openedAt": now,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    await Notification.deleteOne({ _id: req.params.id });

    return res.status(200).json({
      success: true,
      message: "Notification successfully deleted",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record interaction analytics (click, dismiss, open)
 */
const recordInteraction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { action } = req.body; // 'open' | 'click' | 'dismiss'

    if (!["open", "click", "dismiss"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid analytic action" });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const now = new Date();

    if (action === "open" && !notification.analytics.openedAt) {
      notification.analytics.openedAt = now;
    } else if (action === "click" && !notification.analytics.clickedAt) {
      notification.analytics.clickedAt = now;
      // Click implies user opened/read it as well
      notification.isRead = true;
      notification.readAt = now;
      notification.status = "READ";
      if (!notification.analytics.openedAt) {
        notification.analytics.openedAt = now;
      }
    } else if (action === "dismiss" && !notification.analytics.dismissedAt) {
      notification.analytics.dismissedAt = now;
    }

    await notification.save();

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user preferences
 */
const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) {
      // Return default preferences structure
      preferences = new NotificationPreference({ userId });
    }

    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    let preferences = await NotificationPreference.findOne({ userId });
    if (!preferences) {
      preferences = new NotificationPreference({ userId });
    }

    // Merge settings configurations
    const categories = [
      "RIDE",
      "DRIVER",
      "PAYMENT",
      "SECURITY",
      "SYSTEM",
      "ADMIN",
      "PROMOTION",
      "SUPPORT",
      "REFERRAL",
      "WALLET",
      "EMERGENCY",
    ];

    categories.forEach((cat) => {
      if (updateData[cat]) {
        preferences[cat] = {
          ...preferences[cat].toObject(),
          ...updateData[cat],
        };
      }
    });

    await preferences.save();

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to parse basic OS and Browser from User-Agent header
 */
const parseUserAgent = (uaString) => {
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (!uaString) return { browser, os };

  if (uaString.includes("Windows")) os = "Windows";
  else if (uaString.includes("Macintosh") || uaString.includes("Mac OS")) os = "macOS";
  else if (uaString.includes("Android")) os = "Android";
  else if (uaString.includes("iPhone") || uaString.includes("iPad")) os = "iOS";
  else if (uaString.includes("Linux")) os = "Linux";

  if (uaString.includes("Chrome") && !uaString.includes("Chromium") && !uaString.includes("Edg")) browser = "Chrome";
  else if (uaString.includes("Safari") && !uaString.includes("Chrome")) browser = "Safari";
  else if (uaString.includes("Firefox")) browser = "Firefox";
  else if (uaString.includes("Edg")) browser = "Edge";
  else if (uaString.includes("Trident") || uaString.includes("MSIE")) browser = "Internet Explorer";

  return { browser, os };
};

/**
 * Register or update a device token
 */
const registerDeviceToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { deviceToken, platform, browser, os, notificationPermission } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({ success: false, message: "deviceToken and platform are required" });
    }

    const uaMetadata = parseUserAgent(req.headers["user-agent"]);

    const tokenData = {
      userId,
      platform,
      browser: browser || uaMetadata.browser,
      os: os || uaMetadata.os,
      userAgent: req.headers["user-agent"] || "",
      isActive: true,
      notificationPermission: notificationPermission || "default",
      lastUsedAt: new Date(),
    };

    // Upsert device token registration
    const registration = await DeviceToken.findOneAndUpdate(
      { deviceToken },
      { $set: tokenData },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Device token registered successfully",
      registration,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deregister a device token (marks inactive instead of hard delete for history audits)
 */
const deregisterDeviceToken = async (req, res, next) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({ success: false, message: "deviceToken is required" });
    }

    // Mark token as inactive
    const result = await DeviceToken.findOneAndUpdate(
      { deviceToken },
      {
        $set: {
          isActive: false,
          notificationPermission: "denied",
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: "Device token registration not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Device token deregistered successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active registered device tokens for user
 */
const getDeviceTokens = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const tokens = await DeviceToken.find({ userId, isActive: true });

    return res.status(200).json({
      success: true,
      tokens,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendSystemAlert,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  recordInteraction,
  getPreferences,
  updatePreferences,
  registerDeviceToken,
  deregisterDeviceToken,
  getDeviceTokens,
};
