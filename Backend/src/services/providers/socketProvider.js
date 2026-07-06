const socketService = require("../socketService");

module.exports = {
  name: "socket",

  /**
   * Send notification via Socket.IO
   * @param {string} userId - Target User ID
   * @param {object} notification - Mongoose Notification document reference
   * @returns {Promise<{success: boolean, reason?: string}>}
   */
  send: async (userId, notification) => {
    try {
      const socketPayload = {
        notificationId: notification.notificationId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        sound: notification.sound,
        image: notification.image,
        icon: notification.icon,
        deepLink: notification.deepLink,
        buttons: notification.buttons,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      };

      const result = await socketService.emitToUserWithRetry(
        userId,
        "new-notification",
        socketPayload
      );

      return result;
    } catch (error) {
      console.error("[SocketProvider] Delivery failed:", error.message);
      return { success: false, reason: error.message };
    }
  },
};
