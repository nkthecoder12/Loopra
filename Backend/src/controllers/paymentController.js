const Ride = require("../models/Ride");
const Payment = require("../models/payment");
const mongoose = require("mongoose");
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchPayment,
  verifyWebhookSignature,
} = require("../services/razorpay.service.js");

// ─── CREATE PAYMENT ORDER ─────────────────────────────────────────────────────
// Issue #11: req.user.userId → req.user.id
// Issue #12: Route is POST /payments/:rideId/order

const createPaymentOrder = async (req, res) => {
  const { rideId } = req.params;
  const userId = req.user.id; // ← FIXED: was req.user.userId

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ride = await Ride.findById(rideId).session(session);

    if (!ride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (ride.status !== "COMPLETED") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Ride must be completed before payment" });
    }

    // Idempotency: don't create a second order for same ride
    const existingPayment = await Payment.findOne({
      rideId: ride._id,
      status: { $in: ["CREATED", "PAID"] },
    }).session(session);

    if (existingPayment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json({
        success: true,
        message: "Payment order already exists",
        orderId: existingPayment.razorpayOrderId,
        amount: existingPayment.amount * 100,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      });
    }

    const fareAmount = ride.finalFare || ride.fare || 50;

    const order = await createRazorpayOrder({
      amount: fareAmount * 100, // paise
      currency: "INR",
      receipt: `ride_${ride._id}`,
      notes: { rideId: ride._id.toString() },
    });

    await Payment.create(
      [{ rideId: ride._id, userId, amount: fareAmount, razorpayOrderId: order.id, status: "CREATED" }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: "Failed to create payment order", error: error.message });
  }
};

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────

const verifyPayment = async (req, res) => {
  const { rideId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  // Cross-verify with Razorpay API
  try {
    const razorpayPayment = await fetchPayment(razorpay_payment_id);
    if (!["captured", "authorized"].includes(razorpayPayment.status)) {
      return res.status(400).json({ success: false, message: "Payment not captured by Razorpay" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to verify with Razorpay", error: err.message });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: "CREATED" },
      { status: "PAID", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, paidAt: new Date() },
      { new: true, session }
    );

    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Payment already processed or not found" });
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: payment.rideId, paymentStatus: { $in: [undefined, "PENDING"] } },
      { paymentStatus: "PAID", paidAt: new Date() },
      { new: true, session }
    );

    if (!ride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Ride payment already processed" });
    }

    await session.commitTransaction();
    session.endSession();

    // Notify via socket
    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("payment-confirmed", {
        rideId: ride._id,
        amount: payment.amount,
      });
    }

    return res.status(200).json({ success: true, message: "Payment verified", amount: payment.amount });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

// ─── ADVANCE PAYMENT ORDER ────────────────────────────────────────────────────

const createAdvancePaymentOrder = async (req, res) => {
  const { rideId } = req.params;
  const userId = req.user.id;

  try {
    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(404).json({ success: false, message: "Ride not found" });
    if (ride.userId.toString() !== userId) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (ride.type !== "SCHEDULED" || ride.paymentStatus !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invalid ride type or payment status" });
    }

    const advanceAmount = ride.advancePaymentAmount || 50;
    const order = await createRazorpayOrder({
      amount: advanceAmount * 100,
      currency: "INR",
      receipt: `adv_ride_${ride._id}`,
      notes: { rideId: ride._id.toString() },
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create advance payment order", error: error.message });
  }
};

// ─── VERIFY ADVANCE PAYMENT ───────────────────────────────────────────────────

const verifyAdvancePayment = async (req, res) => {
  const { rideId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const isValid = verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
  if (!isValid) return res.status(400).json({ success: false, message: "Invalid payment signature" });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, paymentStatus: "PENDING", type: "SCHEDULED" },
      { $set: { paymentStatus: "RESERVED", advancePaymentId: razorpay_payment_id } },
      { new: true, session }
    );

    if (!ride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Advance payment already processed or ride not found" });
    }

    const parentRide = await Ride.findById(ride.parentRideId).session(session);
    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");
    if (io && parentRide && parentRide.driverId) {
      io.to(`driver_${parentRide.driverId.toString()}`).emit("combined-ride-offer", {
        primaryRideId: parentRide._id,
        secondaryRideId: ride._id,
        pickupLocation: ride.pickupLocation,
        dropLocation: ride.dropLocation,
        scheduledAt: ride.scheduledAt,
        timeoutAt: new Date(Date.now() + 30000),
      });

      setTimeout(async () => {
        try {
          const checkRide = await Ride.findById(ride._id);
          if (checkRide && checkRide.assignmentStage === "INITIAL_DRIVER") {
            await Ride.updateOne({ _id: ride._id, assignmentStage: "INITIAL_DRIVER" }, { $set: { assignmentStage: "NEARBY_DRIVERS" } });
          }
        } catch (e) {
          console.error("Advance offer timeout error:", e);
        }
      }, 30000);
    } else {
      await Ride.updateOne({ _id: ride._id, assignmentStage: "INITIAL_DRIVER" }, { $set: { assignmentStage: "NEARBY_DRIVERS" } });
    }

    return res.status(200).json({ success: true, message: "Advance payment successful. Offer dispatched." });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ success: false, message: "Payment verification failed", error: error.message });
  }
};

// ─── RAZORPAY WEBHOOK ──────────────────────────────────────────────────────────
// Issue #27: JSON.parse(req.body) on raw Buffer was broken

const razorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // req.body is a Buffer when using express.raw()
  const isValid = verifyWebhookSignature(req.body, signature);
  if (!isValid) {
    return res.status(400).send("Invalid webhook signature");
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    const paymentId = paymentEntity.id;
    const rideId = paymentEntity.notes?.rideId;

    if (!rideId) return res.status(200).json({ ok: true });

    const ride = await Ride.findById(rideId);
    if (!ride) return res.status(200).json({ ok: true });

    if (["PAID", "RESERVED"].includes(ride.paymentStatus)) {
      return res.status(200).json({ ok: true });
    }

    if (ride.type === "SCHEDULED" && ride.paymentStatus === "PENDING") {
      ride.paymentStatus = "RESERVED";
      ride.advancePaymentId = paymentId;
      await ride.save();

      const io = req.app.get("io");
      const parentRide = await Ride.findById(ride.parentRideId);
      if (io && parentRide && parentRide.driverId) {
        io.to(`driver_${parentRide.driverId.toString()}`).emit("combined-ride-offer", {
          primaryRideId: parentRide._id,
          secondaryRideId: ride._id,
          pickupLocation: ride.pickupLocation,
          dropLocation: ride.dropLocation,
          scheduledAt: ride.scheduledAt,
          timeoutAt: new Date(Date.now() + 30000),
        });
      }
    } else if (ride.paymentStatus !== "PAID") {
      ride.paymentStatus = "PAID";
      ride.paidAt = new Date();
      await ride.save();
    }
  }

  return res.status(200).json({ ok: true });
};

module.exports = { createPaymentOrder, verifyPayment, createAdvancePaymentOrder, verifyAdvancePayment, razorpayWebhook };
