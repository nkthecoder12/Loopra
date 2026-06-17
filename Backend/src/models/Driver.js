const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    phone: { type: String, required: true, unique: true },

    // Authentication reference
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    vehicle: {
      type: { type: String, required: true },
      number: { type: String, required: true },
    },

    // Issue #19: Add onboardingStatus for admin approval gate
    onboardingStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    // Document storage
    documents: {
      license: { type: String, default: null },
      rc: { type: String, default: null },
    },

    // Driver availability (only active when APPROVED)
    isAvailable: { type: Boolean, default: false, index: true },

    // Current location (GeoJSON Point)
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // Account flags
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Ride references
    currentRideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },
    reservedRideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },

    // Earnings summary (updated on ride completion)
    earnings: {
      total: { type: Number, default: 0 },
      rides: { type: Number, default: 0 },
      rating: { type: Number, default: 5.0 },
      acceptanceRate: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

// Geo index for nearest driver search
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
