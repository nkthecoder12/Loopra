const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true
    },

    ratedBy: {
      type: String,
      enum: ["USER", "DRIVER"],
      required: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Compound index to ensure USER and DRIVER can each rate the ride only once
ratingSchema.index({ rideId: 1, ratedBy: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);
