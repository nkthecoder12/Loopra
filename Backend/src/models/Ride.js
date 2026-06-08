const mongoose = require("mongoose");
const  { RIDE_STATUS }=require("../utils/constants");

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    // Who booked the ride
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Assigned driver
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
      index: true
    },

    pickupLocation: {
      type: locationSchema,
      required: true
    },

    dropLocation: {
      type: locationSchema,
      required: true
    },

    scheduledAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    type: {
      type: String,
      enum: ["INSTANT", "SCHEDULED"],
      default: "INSTANT"
    },

    parentRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      index: true
    },

    assignmentStage: {
      type: String,
      enum: ["INITIAL_DRIVER", "NEARBY_DRIVERS", "ALL_DRIVERS", "ASSIGNED", "FAILED"],
      default: "INITIAL_DRIVER"
    },

    status: {
      type: String,
      enum: Object.values(RIDE_STATUS),
      default: RIDE_STATUS.REQUESTED,
      index: true
    },

    fare: {
      type: Number,
      default: 0
    },

    finalFare: {
      type: Number,
      default: 0
    },

    distanceKm: {
      type: Number,
      default: 0
    },

    etaMin: {
      type: Number,
      default: 0
    },

    cancellationReason: {
      type: String,
      default: null
    },

    cancelledBy: {
      type: String,
      enum: ["USER", "DRIVER", null],
      default: null
    },

    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "RESERVED", "PROCESSING_REFUND", "FAILED_REFUND"],
      default: "PENDING"
    },

    advancePaymentId: {
      type: String
    },

    refundId: {
      type: String
    },

    paidAt: {
      type: Date
    },

    // Timing fields
    startedAt: {
      type: Date
    },

    completedAt: {
      type: Date
    },

    otp: {
      type: String,
      default: null
    },

    otpAttempts: {
      type: Number,
      default: 0
    },

    stateVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

rideSchema.pre('save', function() {
  if (this.isModified('status')) {
    this.stateVersion += 1;
  }
});

// Atomic double-booking prevention index
rideSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["REQUESTED","DRIVER_ASSIGNED","ONGOING"] } } }
);

module.exports = mongoose.model("Ride", rideSchema);
