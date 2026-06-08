const mongoose = require("mongoose");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { RIDE_STATUS } = require("../utils/constants");
const { refundPayment } = require("./razorpay.service");

// Assume fixed advance fee of 50 INR for now
const ADVANCE_FEE = 50; 

const createAdvanceRide = async (userId, rideAId, data) => {
  const { pickupLocation, dropLocation, scheduledAt } = data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verify Ride A is active and belongs to user (Atomic)
    const rideA = await Ride.findOne({
      _id: rideAId,
      userId,
      status: { $in: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING, RIDE_STATUS.COMPLETED] }
    }).session(session);

    if (!rideA) {
      throw new Error("Active parent ride (Ride A) not found or not eligible.");
    }

    // 2. Create Ride B in PENDING state
    const rideBArray = await Ride.create([{
      userId,
      type: "SCHEDULED",
      parentRideId: rideA._id,
      scheduledAt: new Date(scheduledAt),
      pickupLocation,
      dropLocation,
      status: RIDE_STATUS.REQUESTED,
      paymentStatus: "PENDING",
      assignmentStage: "INITIAL_DRIVER",
      advancePaymentAmount: ADVANCE_FEE
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return rideBArray[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const processDriverResponse = async (driverId, rideBId, acceptRideA, acceptRideB) => {
  // Hard constraint: Cannot accept B without A
  if (acceptRideB && !acceptRideA) {
    throw new Error("Cannot accept advance ride without accepting the primary ride");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rideB = await Ride.findOne({ _id: rideBId }).session(session);

    if (!rideB) {
      throw new Error("Ride not found");
    }

    if (rideB.assignmentStage !== "INITIAL_DRIVER") {
      throw new Error("Offer has expired");
    }

    if (acceptRideB && acceptRideA) {
      // Driver accepted both

      // Check if driver already has a reserved ride
      const driver = await Driver.findById(driverId).session(session);
      if (driver.reservedRideId) {
        throw new Error("Driver already has a reserved advance ride");
      }

      // Update Ride B atomically
      const updatedRideB = await Ride.findOneAndUpdate(
        { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
        { 
          $set: { 
            driverId, 
            assignmentStage: "ASSIGNED",
            status: RIDE_STATUS.DRIVER_ASSIGNED
          } 
        },
        { new: true, session }
      );

      if (!updatedRideB) {
        throw new Error("Race condition: Ride already assigned or moved to next stage");
      }

      // Update Driver
      await Driver.findByIdAndUpdate(
        driverId,
        { $set: { reservedRideId: rideBId } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return updatedRideB;

    } else {
      // Driver rejected B
      const updatedRideB = await Ride.findOneAndUpdate(
        { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
        { $set: { assignmentStage: "NEARBY_DRIVERS" } },
        { new: true, session }
      );
      
      await session.commitTransaction();
      session.endSession();
      return updatedRideB;
    }

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const processRefund = async (rideId) => {
  // Idempotency lock
  const ride = await Ride.findOneAndUpdate(
    { 
      _id: rideId, 
      paymentStatus: { $nin: ["REFUNDED", "PROCESSING_REFUND"] },
      refundId: { $exists: false },
      advancePaymentId: { $exists: true }
    },
    { $set: { paymentStatus: "PROCESSING_REFUND" } },
    { new: true }
  );

  if (!ride) return { success: false, message: "Refund not required or already processed" };

  try {
    // 50 INR = 5000 paise
    const refundAmount = ADVANCE_FEE * 100;
    const response = await refundPayment(ride.advancePaymentId, refundAmount, `refund_${ride._id}`);

    ride.paymentStatus = "REFUNDED";
    ride.refundId = response.id;
    await ride.save();

    return { success: true, refundId: response.id };
  } catch (err) {
    // Revert so we can retry later
    ride.paymentStatus = "FAILED_REFUND";
    await ride.save();
    console.error(`Refund failed for ride ${ride._id}:`, err);
    return { success: false, message: "Razorpay refund failed" };
  }
};

module.exports = {
  createAdvanceRide,
  processDriverResponse,
  processRefund,
  ADVANCE_FEE
};
