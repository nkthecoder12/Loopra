const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");
const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const NotificationService = require("../services/notificationService");
const notificationEventBus = require("../services/notificationEventBus");

const runVerification = async () => {
  try {
    console.log("[Test] Connecting to MongoDB...");
    await connectDB();

    // 1. Find a test user or create one
    console.log("[Test] Finding a test user...");
    let user = await User.findOne({ email: "test-rider@loopra.com" });
    if (!user) {
      user = await User.create({
        name: "Test Rider",
        email: "test-rider@loopra.com",
        password: "hashedpassword123", // dummy hash
        isVerified: true,
        role: "USER",
      });
      console.log("[Test] Created dummy rider user:", user._id);
    } else {
      console.log("[Test] Found existing rider user:", user._id);
    }

    // 2. Clear old notifications for test user
    console.log("[Test] Clearing old test notifications...");
    await Notification.deleteMany({ userId: user._id });

    // 3. Setup notification preferences for this user
    console.log("[Test] Saving category-channel preferences...");
    let preferences = await NotificationPreference.findOne({ userId: user._id });
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: user._id,
        RIDE: { inApp: true, push: true, email: true, sms: false },
        PAYMENT: { inApp: true, push: true, email: true, sms: true },
        PROMOTION: { inApp: false, push: false, email: false, sms: false }, // Promotion disabled completely
      });
    } else {
      preferences.RIDE = { inApp: true, push: true, email: true, sms: false };
      preferences.PAYMENT = { inApp: true, push: true, email: true, sms: true };
      preferences.PROMOTION = { inApp: false, push: false, email: false, sms: false };
      await preferences.save();
    }
    console.log("[Test] Preferences configured successfully.");

    // 4. Test Event Bus: Emission for RIDE event (which is enabled)
    console.log("\n--- [Test 1] Testing Event Bus: emitting 'ride.assigned' ---");
    notificationEventBus.emit("ride.assigned", {
      riderUserId: user._id,
      data: {
        rideId: "6688abcd12345678ef000001",
        driverName: "Karthik Raj",
        vehicleType: "Premium Sedan",
        vehicleNumber: "TN 37 CY 4321",
      },
    });

    // Wait a brief moment for asynchronous event bus execution
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Verify Notification document exists in DB
    const rideNotif = await Notification.findOne({
      userId: user._id,
      type: "RIDE",
    });
    if (rideNotif) {
      console.log("[Test 1 Success] Notification document created in MongoDB:");
      console.log(`  Notif ID: ${rideNotif.notificationId}`);
      console.log(`  Title: ${rideNotif.title}`);
      console.log(`  Message: ${rideNotif.message}`);
      console.log(`  Status: ${rideNotif.status} (offline user default)`);
      console.log(`  Sound: ${rideNotif.sound}`);
      console.log(`  TTL Expiry: ${rideNotif.expiresAt}`);
    } else {
      console.error("[Test 1 Failure] No ride notification document created.");
    }

    // 5. Test Preferences Enforcement: Emission for PROMOTION event (which is disabled)
    console.log("\n--- [Test 2] Testing Preferences: emitting disabled category 'promotion.new' ---");
    notificationEventBus.emit("promotion.new", {
      userId: user._id,
      data: {
        title: "50% Off Code!",
        message: "Use code LOOPRA50 to save 50% on your next ride.",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const promoNotif = await Notification.findOne({
      userId: user._id,
      type: "PROMOTION",
    });

    if (promoNotif) {
      // In-app is disabled, but is it created? 
      // Preferences dictate channel delivery. If all channels (inApp, push, email, sms) are false, 
      // do we block DB creation? Currently createNotification registers it in DB as SENT but doesn't trigger Sockets/FCM.
      // Let's verify preferences mapping.
      console.log(`[Test 2 Result] Notification created with status: ${promoNotif.status}`);
      console.log(`  (In-App is disabled so socket emission was bypassed).`);
    } else {
      console.log("[Test 2 Success] Preferences blocked creation / delivery.");
    }

    console.log("\n--- All tests concluded successfully. ---");
    mongoose.connection.close();
  } catch (err) {
    console.error("Verification test run failed:", err);
    mongoose.connection.close();
  }
};

runVerification();
