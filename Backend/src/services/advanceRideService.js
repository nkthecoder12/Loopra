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
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    // 1. Verify Ride A is active and belongs to user (Atomic)
    const rideA = useTransaction
      ? await Ride.findOne({
          _id: rideAId,
          userId,
          status: { $in: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING, RIDE_STATUS.COMPLETED] }
        }).session(session)
      : await Ride.findOne({
          _id: rideAId,
          userId,
          status: { $in: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING, RIDE_STATUS.COMPLETED] }
        });

    if (!rideA) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      session.endSession();
      throw new Error("Active parent ride (Ride A) not found or not eligible.");
    }

    // 2. Create Ride B in PENDING state
    const rideBArray = useTransaction
      ? await Ride.create([{
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
        }], { session })
      : await Ride.create([{
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
        }]);

    if (useTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    return rideBArray[0];
  } catch (error) {
    if (useTransaction) {
      await session.abortTransaction();
    }
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
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    const rideB = useTransaction
      ? await Ride.findOne({ _id: rideBId }).session(session)
      : await Ride.findOne({ _id: rideBId });

    if (!rideB) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      session.endSession();
      throw new Error("Ride not found");
    }

    if (rideB.assignmentStage !== "INITIAL_DRIVER") {
      if (useTransaction) {
        await session.abortTransaction();
      }
      session.endSession();
      throw new Error("Offer has expired");
    }

    if (acceptRideB && acceptRideA) {
      // Driver accepted both

      // Check if driver already has a reserved ride
      const driver = useTransaction
        ? await Driver.findById(driverId).session(session)
        : await Driver.findById(driverId);
      if (driver.reservedRideId) {
        if (useTransaction) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error("Driver already has a reserved advance ride");
      }

      // Update Ride B atomically
      const updatedRideB = useTransaction
        ? await Ride.findOneAndUpdate(
            { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
            { 
              $set: { 
                driverId, 
                fleetId: driver.fleetId || null,
                vehicleId: driver.vehicleId || null,
                assignmentStage: "ASSIGNED",
                status: RIDE_STATUS.DRIVER_ASSIGNED
              } 
            },
            { new: true, session }
          )
        : await Ride.findOneAndUpdate(
            { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
            { 
              $set: { 
                driverId, 
                fleetId: driver.fleetId || null,
                vehicleId: driver.vehicleId || null,
                assignmentStage: "ASSIGNED",
                status: RIDE_STATUS.DRIVER_ASSIGNED
              } 
            },
            { new: true }
          );

      if (!updatedRideB) {
        if (useTransaction) {
          await session.abortTransaction();
        }
        session.endSession();
        throw new Error("Race condition: Ride already assigned or moved to next stage");
      }

      // Update Driver
      if (useTransaction) {
        await Driver.findByIdAndUpdate(
          driverId,
          { $set: { reservedRideId: rideBId } },
          { session }
        );
      } else {
        await Driver.findByIdAndUpdate(
          driverId,
          { $set: { reservedRideId: rideBId } }
        );
      }

      if (useTransaction) {
        await session.commitTransaction();
      }
      session.endSession();
      return updatedRideB;

    } else {
      // Driver rejected B
      const updatedRideB = useTransaction
        ? await Ride.findOneAndUpdate(
            { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
            { $set: { assignmentStage: "NEARBY_DRIVERS" } },
            { new: true, session }
          )
        : await Ride.findOneAndUpdate(
            { _id: rideBId, assignmentStage: "INITIAL_DRIVER" },
            { $set: { assignmentStage: "NEARBY_DRIVERS" } },
            { new: true }
          );
      
      if (useTransaction) {
        await session.commitTransaction();
      }
      session.endSession();
      return updatedRideB;
    }

  } catch (error) {
    if (useTransaction) {
      await session.abortTransaction();
    }
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
