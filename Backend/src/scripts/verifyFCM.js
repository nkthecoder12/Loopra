const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");
const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const NotificationPreference = require("../models/NotificationPreference");
const NotificationService = require("../services/notificationService");
const firebaseAdmin = require("../config/firebaseAdmin");
const notificationEventBus = require("../services/notificationEventBus");

// Force firebase availability to execute mocks
firebaseAdmin.isAvailable = () => true;

const runVerification = async () => {
  try {
    console.log("[FCM Test] Connecting to MongoDB...");
    await connectDB();

    // 1. Fetch or create test user
    console.log("[FCM Test] Locating test user...");
    let user = await User.findOne({ email: "test-rider@loopra.com" });
    if (!user) {
      user = await User.create({
        name: "Test Rider",
        email: "test-rider@loopra.com",
        password: "hashedpassword123",
        isVerified: true,
        role: "USER",
      });
    }

    // 2. Clear old collections
    await DeviceToken.deleteMany({ userId: user._id });
    await Notification.deleteMany({ userId: user._id });

    // Enable push preferences
    let preferences = await NotificationPreference.findOne({ userId: user._id });
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId: user._id });
    }
    preferences.RIDE = { inApp: false, push: true, email: false, sms: false }; // push only
    await preferences.save();

    // 3. Register device tokens for testing
    const invalidToken = "unregistered_fail_token";
    const retryToken = "transient_fail_token";

    await DeviceToken.create([
      {
        userId: user._id,
        deviceToken: invalidToken,
        platform: "web",
        browser: "Chrome",
        os: "Windows",
        isActive: true,
      },
      {
        userId: user._id,
        deviceToken: retryToken,
        platform: "web",
        browser: "Safari",
        os: "macOS",
        isActive: true,
      },
    ]);

    // 4. Setup mock FCM Admin Messaging responses
    let messagingCallCount = 0;
    firebaseAdmin.messaging = {
      send: async (message) => {
        if (message.token === invalidToken) {
          // Simulate Firebase token invalidation
          throw {
            code: "messaging/registration-token-not-registered",
            message: "FCM registration token is not registered.",
          };
        }

        if (message.token === retryToken) {
          messagingCallCount++;
          // Simulate 2 transient failures, success on 3rd attempt
          if (messagingCallCount < 3) {
            throw {
              code: "messaging/internal-error",
              message: "Temporary internal server error.",
            };
          }
          return "mock_fcm_success_id";
        }

        return "mock_fcm_default_id";
      },
    };

    console.log("\n--- [FCM Test 1 & 2] Emitting 'ride.assigned' to trigger FCM provider ---");
    notificationEventBus.emit("ride.assigned", {
      riderUserId: user._id,
      data: {
        rideId: "6688fcm012345678ef000002",
        driverName: "Sarah Connor",
        vehicleType: "SUV",
        vehicleNumber: "TN 37 AB 0007",
      },
    });

    // Wait for the async events and backoff retries to conclude (transient backoff has delays 1s, 2s)
    console.log("Waiting 4.5 seconds for retries and deactivation to execute...");
    await new Promise((resolve) => setTimeout(resolve, 4500));

    // 5. Inspect database to verify deactivation
    console.log("\n--- [Verify 1] Checking invalid token deactivation status ---");
    const disabledTokenDoc = await DeviceToken.findOne({
      userId: user._id,
      deviceToken: invalidToken,
    });
    if (disabledTokenDoc && disabledTokenDoc.isActive === false) {
      console.log("[SUCCESS] Invalid token was marked isActive = false.");
      console.log(`  Permission: ${disabledTokenDoc.notificationPermission}`);
    } else {
      console.error("[FAILURE] Invalid token was not deactivated.");
    }

    // 6. Inspect database to verify retry calls success
    console.log("\n--- [Verify 2] Checking transient token retry counts ---");
    console.log(`  Messaging send call count for retryToken: ${messagingCallCount}`);
    if (messagingCallCount === 3) {
      console.log("[SUCCESS] Backoff retry executed exactly 3 times before succeeding.");
    } else {
      console.error(`[FAILURE] Expected 3 calls, got ${messagingCallCount}`);
    }

    // 7. Verify analytics metrics logged
    console.log("\n--- [Verify 3] Inspecting Notification analytics fields ---");
    const notif = await Notification.findOne({ userId: user._id, type: "RIDE" });
    if (notif) {
      console.log("[SUCCESS] Notification analytics populated:");
      console.log(`  pushDelivered: ${notif.analytics.pushDelivered}`);
      console.log(`  pushFailed: ${notif.analytics.pushFailed}`);
      console.log(`  failureReason: ${notif.analytics.failureReason}`);
    } else {
      console.error("[FAILURE] Notification document not found.");
    }

    console.log("\n--- Concluding FCM verification checks ---");
    mongoose.connection.close();
  } catch (err) {
    console.error("Test run failed:", err);
    mongoose.connection.close();
  }
};

runVerification();
