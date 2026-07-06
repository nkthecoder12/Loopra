const mongoose = require("mongoose");
const crypto = require("crypto");

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      default: () => `notif_${crypto.randomBytes(8).toString("hex")}`,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"],
      default: "PENDING",
      index: true,
    },
    sound: {
      type: String,
      default: "default",
    },
    image: {
      type: String,
      default: null,
    },
    icon: {
      type: String,
      default: null,
    },
    deepLink: {
      type: String,
      default: null,
    },
    buttons: [
      {
        label: { type: String, required: true },
        actionUrl: { type: String, required: true },
        primary: { type: Boolean, default: false },
      },
    ],
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    analytics: {
      sentAt: { type: Date, default: null },
      openedAt: { type: Date, default: null },
      clickedAt: { type: Date, default: null },
      dismissedAt: { type: Date, default: null },
      failedAt: { type: Date, default: null },
      failureReason: { type: String, default: null },
      // Phase 2 FCM Metrics
      socketDelivered: { type: Boolean, default: false },
      pushDelivered: { type: Boolean, default: false },
      pushFailed: { type: Boolean, default: false },
      pushClicked: { type: Boolean, default: false },
      pushOpened: { type: Boolean, default: false },
      permissionDenied: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// MongoDB TTL index to auto-delete notifications when expiresAt timestamp is reached
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
