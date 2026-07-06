const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const socketProvider = require("./providers/socketProvider");
const firebaseProvider = require("./providers/firebaseProvider");
const notificationTemplates = require("./notificationTemplates");
const notificationEventBus = require("./notificationEventBus");
const sendMailHelper = require("../utils/sendmail");

// Retry wrapper for high reliability (legacy functions support)
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

/**
 * Enterprise Notification Service
 */
class NotificationService {
  /**
   * Main DB Creation and Socket Delivery Pipeline
   * @param {string} userId - Target User ID
   * @param {string} templateKey - Template key (e.g., 'ride.completed')
   * @param {object} templateData - Payload variables for templates
   * @returns {Promise<object>} - Saved Notification document
   */
  static async createNotification(userId, templateKey, templateData = {}) {
    try {
      // 1. Compile Rich Payload from template Key
      const richPayload = notificationTemplates.compile(templateKey, templateData);

      // 2. Fetch User preferences
      let userPref = await NotificationPreference.findOne({ userId });
      if (!userPref) {
        // Fall back to default schema preferences if document doesn't exist
        userPref = new NotificationPreference({ userId });
      }

      // Check category configuration (RIDE, PAYMENT, DRIVER, system, security, promotion etc)
      const category = richPayload.type;
      const channelPrefs = userPref[category] || {
        inApp: true,
        push: true,
        email: true,
        sms: true,
      };

      // 3. Persist in MongoDB
      const notification = new Notification({
        userId,
        title: richPayload.title,
        message: richPayload.message,
        type: richPayload.type,
        priority: richPayload.priority || "MEDIUM",
        sound: richPayload.sound || "default",
        image: richPayload.image || null,
        icon: richPayload.icon || null,
        deepLink: richPayload.deepLink || null,
        buttons: richPayload.buttons || [],
        expiresAt: richPayload.expiresAt || null,
        status: "PENDING",
        metadata: templateData,
      });

      await notification.save();

      // 4. Delivery Pipeline Execution
      const deliveryTasks = [];

      // A. IN-APP CHANNEL (Via Socket.IO Provider)
      if (channelPrefs.inApp) {
        deliveryTasks.push(
          (async () => {
            const delivery = await socketProvider.send(userId, notification);
            if (delivery.success) {
              notification.status = "DELIVERED";
              notification.analytics.socketDelivered = true;
              notification.analytics.sentAt = new Date();
            } else {
              notification.analytics.socketDelivered = false;
              if (delivery.reason === "Offline") {
                notification.status = "SENT"; // Saved in DB, pending client retrieval
              } else {
                notification.status = "FAILED";
                notification.analytics.failedAt = new Date();
                notification.analytics.failureReason = delivery.reason;
              }
            }
          })()
        );
      } else {
        // If In-App is disabled by preference
        notification.status = "SENT";
      }

      // B. FCM PUSH CHANNEL (Via Firebase Provider)
      if (channelPrefs.push) {
        deliveryTasks.push(
          (async () => {
            const pushResult = await firebaseProvider.send(userId, notification);
            if (pushResult.success) {
              notification.analytics.pushDelivered = true;
              notification.analytics.sentAt = new Date();
            } else {
              notification.analytics.pushFailed = true;
              if (pushResult.reason !== "No active device tokens registered") {
                notification.analytics.failedAt = new Date();
                notification.analytics.failureReason = pushResult.reason;
              }
            }
          })()
        );
      }

      // C. EMAIL CHANNEL (Phase 2 integration point)
      if (channelPrefs.email) {
        // TODO Phase 2: Consolidated email system integration
      }

      // D. SMS CHANNEL (Phase 2 integration point)
      if (channelPrefs.sms) {
        // TODO Phase 2: Consolidate Twilio gateway system integration
      }

      // Wait for socket and push attempts to conclude
      await Promise.all(deliveryTasks);
      await notification.save();

      return notification;
    } catch (error) {
      console.error("[NotificationService] error creating notification:", error.message);
      throw error;
    }
  }

  /**
   * General Email Dispatcher (Legacy wrapper support)
   */
  static async sendEmail(to, subject, text, html = "") {
    await withRetry(async () => {
      await sendMailHelper(to, subject, html || text);
    });
  }

  /**
   * General SMS Dispatcher (Legacy wrapper support)
   */
  static async sendSMS(to, body) {
    await withRetry(async () => {
      console.log(`[NotificationService] [SMS MOCK DISPATCH] To: ${to} | Body: "${body}"`);
    });
  }

  /**
   * Legacy Onboarding and Ride triggers wrapper methods (mapped to new Event Bus)
   */
  static async notifyRideBooked(userEmail, ride) {
    const subject = "Loopra — Ride Booked Successfully!";
    const text = `Your ride is requested! Ride ID: ${ride._id}. Est Fare: ₹${ride.fare}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24;">
        <h2>Loopra Ride Requested</h2>
        <p>Estimated Fare: ₹${ride.fare}</p>
        <p>Pickup: ${ride.pickupLocation.address || "Selected Coordinates"}</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  static async notifyRideAccepted(userEmail, ride, driver) {
    const subject = "Loopra — Driver Match Confirmed!";
    const text = `Driver ${driver.name} has accepted your ride offer! Vehicle: ${driver.vehicle.type}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24;">
        <h2>Driver En Route!</h2>
        <p>Driver Name: ${driver.name}</p>
        <p>Vehicle: ${driver.vehicle.type} (${driver.vehicle.number})</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  static async notifyRideCancelled(userEmail, rideId, reason = "User Request") {
    const subject = "Loopra — Ride Cancellation Alert";
    const text = `Your ride request (${rideId}) has been cancelled. Reason: ${reason}.`;
    await this.sendEmail(userEmail, subject, text);
  }

  static async notifyRideCompleted(userEmail, ride) {
    const subject = "Loopra — Ride Completed! Thank you.";
    const text = `Your trip is completed. Total fare paid: ₹${ride.fare}.`;
    await this.sendEmail(userEmail, subject, text);
  }

  static async notifyDriverOnboarding(driverEmail, status, reason = "") {
    const isApprove = status === "APPROVED";
    const subject = isApprove ? "Loopra — Onboarding Confirmed!" : "Loopra — Document Update Required";
    const text = isApprove
      ? "Welcome to Loopra! Your driver account has been approved. You are now authorized to accept rides."
      : `Your driver application has been rejected. Reason: ${reason || "Invalid documentation"}. Please re-submit your files.`;
    await this.sendEmail(driverEmail, subject, text);
  }
}

// --- Domain Event Bus Listener Bindings ---
notificationEventBus.on("ride.requested", async ({ driverUserId, data }) => {
  try {
    await NotificationService.createNotification(driverUserId, "ride.requested", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.requested failed:", err.message);
  }
});

notificationEventBus.on("ride.assigned", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "ride.assigned", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.assigned failed:", err.message);
  }
});

notificationEventBus.on("ride.arrived", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "ride.arrived", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.arrived failed:", err.message);
  }
});

notificationEventBus.on("ride.started", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "ride.started", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.started failed:", err.message);
  }
});

notificationEventBus.on("ride.completed", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "ride.completed", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.completed failed:", err.message);
  }
});

notificationEventBus.on("ride.cancelled", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "ride.cancelled", data);
  } catch (err) {
    console.error("[NotificationService] Event ride.cancelled failed:", err.message);
  }
});

notificationEventBus.on("payment.success", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "payment.success", data);
  } catch (err) {
    console.error("[NotificationService] Event payment.success failed:", err.message);
  }
});

notificationEventBus.on("payment.failed", async ({ riderUserId, data }) => {
  try {
    await NotificationService.createNotification(riderUserId, "payment.failed", data);
  } catch (err) {
    console.error("[NotificationService] Event payment.failed failed:", err.message);
  }
});

notificationEventBus.on("driver.submitted", async ({ adminUserId, data }) => {
  try {
    await NotificationService.createNotification(adminUserId, "driver.submitted", data);
  } catch (err) {
    console.error("[NotificationService] Event driver.submitted failed:", err.message);
  }
});

notificationEventBus.on("driver.approved", async ({ driverUserId, data }) => {
  try {
    await NotificationService.createNotification(driverUserId, "driver.approved", data);
  } catch (err) {
    console.error("[NotificationService] Event driver.approved failed:", err.message);
  }
});

notificationEventBus.on("driver.rejected", async ({ driverUserId, data }) => {
  try {
    await NotificationService.createNotification(driverUserId, "driver.rejected", data);
  } catch (err) {
    console.error("[NotificationService] Event driver.rejected failed:", err.message);
  }
});

notificationEventBus.on("wallet.credited", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "wallet.credited", data);
  } catch (err) {
    console.error("[NotificationService] Event wallet.credited failed:", err.message);
  }
});

notificationEventBus.on("emergency.alert", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "emergency.alert", data);
  } catch (err) {
    console.error("[NotificationService] Event emergency.alert failed:", err.message);
  }
});

notificationEventBus.on("promotion.new", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "promotion.new", data);
  } catch (err) {
    console.error("[NotificationService] Event promotion.new failed:", err.message);
  }
});

notificationEventBus.on("referral.success", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "referral.success", data);
  } catch (err) {
    console.error("[NotificationService] Event referral.success failed:", err.message);
  }
});

notificationEventBus.on("security.alert", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "security.alert", data);
  } catch (err) {
    console.error("[NotificationService] Event security.alert failed:", err.message);
  }
});

notificationEventBus.on("system.alert", async ({ userId, data }) => {
  try {
    await NotificationService.createNotification(userId, "system.alert", data);
  } catch (err) {
    console.error("[NotificationService] Event system.alert failed:", err.message);
  }
});

module.exports = NotificationService;
