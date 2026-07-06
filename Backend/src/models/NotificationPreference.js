const mongoose = require("mongoose");

const channelPreferenceSchema = new mongoose.Schema(
  {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Category mappings
    RIDE: { type: channelPreferenceSchema, default: () => ({}) },
    DRIVER: { type: channelPreferenceSchema, default: () => ({}) },
    PAYMENT: { type: channelPreferenceSchema, default: () => ({}) },
    SECURITY: { type: channelPreferenceSchema, default: () => ({}) },
    SYSTEM: { type: channelPreferenceSchema, default: () => ({}) },
    ADMIN: { type: channelPreferenceSchema, default: () => ({}) },
    PROMOTION: {
      type: channelPreferenceSchema,
      default: () => ({ inApp: true, push: false, email: false, sms: false }),
    },
    SUPPORT: { type: channelPreferenceSchema, default: () => ({}) },
    REFERRAL: {
      type: channelPreferenceSchema,
      default: () => ({ inApp: true, push: false, email: false, sms: false }),
    },
    WALLET: { type: channelPreferenceSchema, default: () => ({}) },
    EMERGENCY: {
      type: channelPreferenceSchema,
      default: () => ({ inApp: true, push: true, email: true, sms: true }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);
