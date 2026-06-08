const sendMailHelper = require("../utils/sendmail");

// Retry wrapper for high reliability
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[NotificationService] Retrying send after error: ${err.message}. Attempt ${i + 1}/${retries}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

/**
 * Enterprise Notification Service
 */
class NotificationService {
  /**
   * General Email Dispatcher
   */
  static async sendEmail(to, subject, text, html = "") {
    await withRetry(async () => {
      // Use existing sendMailHelper which wraps Nodemailer
      await sendMailHelper(to, subject, html || text);
      console.log(`[NotificationService] Email dispatched successfully to: ${to} (Subject: "${subject}")`);
    });
  }

  /**
   * General SMS Dispatcher
   * Keep integration-ready for Twilio or SMS Gateway. Currently logs to standard output.
   */
  static async sendSMS(to, body) {
    await withRetry(async () => {
      // Abstraction layer for Twilio:
      // const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
      // await twilioClient.messages.create({ body, to, from: process.env.TWILIO_PHONE_NUMBER });
      
      console.log(`[NotificationService] [SMS MOCK DISPATCH] To: ${to} | Body: "${body}"`);
    });
  }

  /**
   * Ride Booked Notification
   */
  static async notifyRideBooked(userEmail, ride) {
    const subject = "Drivo — Ride Booked Successfully!";
    const text = `Your ride is requested! Ride ID: ${ride._id}. Pickup Location: ${ride.pickupLocation.address || "Selected Location"}. Est Fare: ₹${ride.fare}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #000; font-weight: 800; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; font-style: italic;">Drivo Ride Requested</h2>
        <p>Your booking request has been registered and we are currently matching you with nearby premium partners.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Ride Reference:</strong> ${ride._id}</p>
        <p><strong>Estimated Fare:</strong> ₹${ride.fare}</p>
        <p><strong>Pickup Details:</strong> ${ride.pickupLocation.address || "Selected Coordinates"}</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  /**
   * Ride Accepted Notification
   */
  static async notifyRideAccepted(userEmail, ride, driver) {
    const subject = "Drivo — Driver Match Confirmed!";
    const text = `Driver ${driver.name} has accepted your ride offer! Vehicle details: ${driver.vehicle.type} (${driver.vehicle.number}). Phone: ${driver.phone}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #000; font-weight: 800; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; font-style: italic;">Driver En Route!</h2>
        <p>Your matching process is complete. Your premium partner is on their way to your pickup location.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Driver Name:</strong> ${driver.name}</p>
        <p><strong>Contact Number:</strong> ${driver.phone}</p>
        <p><strong>Vehicle Specs:</strong> ${driver.vehicle.type} - [ ${driver.vehicle.number} ]</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  /**
   * Ride Cancelled Notification
   */
  static async notifyRideCancelled(userEmail, rideId, reason = "User Request") {
    const subject = "Drivo — Ride Cancellation Alert";
    const text = `Your ride request (${rideId}) has been cancelled. Reason: ${reason}.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #ff3b30; font-weight: 800; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; font-style: italic;">Ride Cancelled</h2>
        <p>This message confirms that your ride booking <strong>${rideId}</strong> has been cancelled.</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  /**
   * Ride Completed Notification
   */
  static async notifyRideCompleted(userEmail, ride) {
    const subject = "Drivo — Ride Completed! Thank you.";
    const text = `Your trip is completed. Total fare paid: ₹${ride.fare}. We hope you enjoyed your ride.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #000; font-weight: 800; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; font-style: italic;">Thank you for riding with Drivo!</h2>
        <p>Your premium ride has safely reached its destination.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Total Fare Deducted:</strong> ₹${ride.fare}</p>
        <p><strong>Dropoff Time:</strong> ${new Date().toLocaleTimeString()}</p>
      </div>
    `;
    await this.sendEmail(userEmail, subject, text, html);
  }

  /**
   * Driver Onboarding Updates
   */
  static async notifyDriverOnboarding(driverEmail, status, reason = "") {
    const isApprove = status === "APPROVED";
    const subject = isApprove ? "Drivo — Onboarding Confirmed!" : "Drivo — Document Update Required";
    const text = isApprove
      ? "Welcome to Drivo! Your driver account has been approved. You are now authorized to accept rides."
      : `Your driver application has been rejected. Reason: ${reason || "Invalid documentation"}. Please re-submit your files.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e1e24; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: ${isApprove ? "#00c781" : "#ff3b30"}; font-weight: 800; font-size: 24px; margin-bottom: 20px; text-transform: uppercase; font-style: italic;">
          ${isApprove ? "Application Approved!" : "Application Update Required"}
        </h2>
        <p>${text}</p>
      </div>
    `;
    await this.sendEmail(driverEmail, subject, text, html);
  }
}

module.exports = NotificationService;
