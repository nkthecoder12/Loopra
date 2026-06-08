const mongoose = require("mongoose");

const TrackingSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Optimize for time-series range lookups
TrackingSchema.index({ rideId: 1, recordedAt: 1 });

module.exports = mongoose.model("Tracking", TrackingSchema);
