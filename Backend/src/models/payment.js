const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amount: {
      type: Number, // in rupees
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    provider: {
      type: String,
      enum: ["RAZORPAY"],
      default: "RAZORPAY"
    },

    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED"],
      default: "CREATED",
      index: true
    },

    // Razorpay fields
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true
    },

    razorpayPaymentId: {
      type: String
    },

    razorpaySignature: {
      type: String
    },

    failureReason: {
      type: String
    },

    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;