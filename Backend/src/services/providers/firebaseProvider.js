const firebaseAdmin = require("../../config/firebaseAdmin");
const DeviceToken = require("../../models/DeviceToken");

/**
 * Backoff wrapper for transient Firebase errors
 * @param {object} message - FCM message payload
 * @returns {Promise<string>} - FCM message ID
 */
const sendWithRetry = async (message) => {
  const retryErrors = [
    "messaging/internal-error",
    "messaging/server-unavailable",
    "messaging/quota-exceeded",
  ];
  const backoffs = [1000, 2000, 5000]; // 1s, 2s, 5s

  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      return await firebaseAdmin.messaging.send(message);
    } catch (error) {
      const isTransient =
        retryErrors.includes(error.code) ||
        error.message?.includes("Unavailable") ||
        error.message?.includes("Internal");

      if (isTransient && attempt < backoffs.length) {
        console.warn(
          `[FirebaseProvider] Transient FCM error (${
            error.code || error.message
          }). Retrying in ${backoffs[attempt]}ms (Attempt ${attempt + 1}/3)...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffs[attempt]));
      } else {
        throw error;
      }
    }
  }
};

module.exports = {
  name: "firebase",

  /**
   * Send push notification via Firebase Admin SDK
   * @param {string} userId - Target User ID
   * @param {object} notification - Mongoose Notification document reference
   * @returns {Promise<{success: boolean, sentCount: number, failedCount: number}>}
   */
  send: async (userId, notification) => {
    try {
      if (!firebaseAdmin.isAvailable()) {
        return { success: false, reason: "Firebase Admin SDK not initialized/available" };
      }

      // Fetch active tokens for this user
      const devices = await DeviceToken.find({ userId, isActive: true });
      if (devices.length === 0) {
        return { success: true, reason: "No active device tokens registered", sentCount: 0, failedCount: 0 };
      }

      // Convert all custom data properties to strings (FCM requirement)
      const dataPayload = {
        notificationId: String(notification.notificationId),
        category: String(notification.type).toLowerCase(),
        deepLink: String(notification.deepLink || ""),
        priority: String(notification.priority).toLowerCase(),
        image: String(notification.image || ""),
        createdAt: String(notification.createdAt ? notification.createdAt.toISOString() : new Date().toISOString()),
        actor: "Loopra Platform",
        sound: String(notification.sound || "default"),
      };

      let sentCount = 0;
      let failedCount = 0;

      const sendPromises = devices.map(async (device) => {
        const message = {
          token: device.deviceToken,
          notification: {
            title: notification.title,
            body: notification.message,
          },
          data: dataPayload,
          webpush: {
            notification: {
              icon: "/icons/logo-96.png",
              badge: "/icons/badge-72.png",
              image: notification.image || undefined,
              sound: notification.sound === "silent" ? undefined : `/sounds/${notification.sound}.mp3`,
            },
          },
        };

        try {
          await sendWithRetry(message);
          sentCount++;
        } catch (err) {
          failedCount++;
          console.error(
            `[FirebaseProvider] Push failed for device token [${device.deviceToken.substring(0, 15)}...]:`,
            err.message
          );

          // Check if token became invalid/unregistered, update isActive to false
          const isTokenInvalid =
            err.code === "messaging/registration-token-not-registered" ||
            err.code === "messaging/invalid-argument" ||
            err.message?.includes("not registered") ||
            err.message?.includes("registration token");

          if (isTokenInvalid) {
            console.log(
              `[FirebaseProvider] Token invalid/unregistered. Deactivating token [${device.deviceToken.substring(
                0,
                15
              )}...].`
            );
            await DeviceToken.updateOne(
              { _id: device._id },
              {
                $set: {
                  isActive: false,
                  notificationPermission: "denied",
                },
              }
            );
          }
        }
      });

      await Promise.all(sendPromises);

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
      };
    } catch (error) {
      console.error("[FirebaseProvider] Global delivery error:", error.message);
      return { success: false, reason: error.message };
    }
  },
};
