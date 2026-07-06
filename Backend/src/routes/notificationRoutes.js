const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

// Retrieve paginated notifications list for user
router.get("/", authMiddleware, notificationController.getNotifications);

// Retrieve unread notifications count
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

// Mark a single notification as read
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

// Mark all user notifications as read
router.patch("/read-all", authMiddleware, notificationController.markAllAsRead);

// Delete a notification
router.delete("/:id", authMiddleware, notificationController.deleteNotification);

// Log analytic interaction (click/dismiss)
router.patch("/:id/interact", authMiddleware, notificationController.recordInteraction);

// Fetch user category-channel preferences
router.get("/preferences", authMiddleware, notificationController.getPreferences);

// Update user category-channel preferences
router.patch("/preferences", authMiddleware, notificationController.updatePreferences);

// Register or update device tokens
router.post("/device-token", authMiddleware, notificationController.registerDeviceToken);

// Deregister device tokens (marks inactive)
router.delete("/device-token", authMiddleware, notificationController.deregisterDeviceToken);

// List active registered device tokens for user
router.get("/device-tokens", authMiddleware, notificationController.getDeviceTokens);

// Legacy post system alert manually (secured behind auth middleware, admin restricted internally)
router.post("/system-alert", authMiddleware, notificationController.sendSystemAlert);

module.exports = router;
