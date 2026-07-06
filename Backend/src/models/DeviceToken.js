const mongoose = require("mongoose");

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["web", "android", "ios"],
      required: true,
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    userAgent: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notificationPermission: {
      type: String,
      enum: ["default", "granted", "denied"],
      default: "default",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// MongoDB TTL index to auto-delete device tokens where isActive has been false for more than 30 days.
// The partial filter ensures only inactive tokens are deleted after 30 days of inactivity.
deviceTokenSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { isActive: false },
  }
);

module.exports = mongoose.model("DeviceToken", deviceTokenSchema);
