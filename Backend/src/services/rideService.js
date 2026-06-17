const mongoose = require("mongoose");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { estimateFare } = require("./fareCalculator");

/**
 * Create an instant ride.
 * Issue #25: Create as REQUESTED first, then atomically assign a driver
 * Issue #8: Use real Haversine fare calculation
 */
const createRide = async (userId, data, io) => {
  const { pickupLocation, dropLocation, type, scheduledAt } = data;

  // 1. Calculate fare from real coordinates
  const { fare, distanceKm, etaMin } = estimateFare({
    pickupLat: pickupLocation.lat,
    pickupLng: pickupLocation.lng,
    dropLat: dropLocation.lat,
    dropLng: dropLocation.lng,
  });

  const session = await mongoose.startSession();
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    // 2. Prevent double booking — atomic check inside transaction
    const activeRide = useTransaction
      ? await Ride.findOne({
          userId,
          status: { $in: ["REQUESTED", "DRIVER_ASSIGNED", "ONGOING"] },
        }).session(session)
      : await Ride.findOne({
          userId,
          status: { $in: ["REQUESTED", "DRIVER_ASSIGNED", "ONGOING"] },
        });

    if (activeRide) {
      if (useTransaction) {
        await session.abortTransaction();
      }
      session.endSession();
      throw new Error("User already has an active ride");
    }

    // 3. Try to find and lock a nearby driver atomically (Only for non-scheduled rides)
    let driver = null;
    if (type !== "SCHEDULED") {
      driver = useTransaction
        ? await Driver.findOneAndUpdate(
            {
              isAvailable: true,
              isActive: true,
              onboardingStatus: "APPROVED",
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [pickupLocation.lng, pickupLocation.lat],
                  },
                  $maxDistance: 10000, // 10 km
                },
              },
            },
            { $set: { isAvailable: false } },
            { new: true, session }
          )
        : await Driver.findOneAndUpdate(
            {
              isAvailable: true,
              isActive: true,
              onboardingStatus: "APPROVED",
              location: {
                $near: {
                  $geometry: {
                    type: "Point",
                    coordinates: [pickupLocation.lng, pickupLocation.lat],
                  },
                  $maxDistance: 10000, // 10 km
                },
              },
            },
            { $set: { isAvailable: false } },
            { new: true }
          );
    }

    const otp = driver ? Math.floor(1000 + Math.random() * 9000).toString() : null;
    const initialStatus = driver ? "DRIVER_ASSIGNED" : "REQUESTED";

    // 4. Create ride
    const rideArr = useTransaction
      ? await Ride.create(
          [
            {
              userId,
              driverId: driver ? driver._id : null,
              pickupLocation,
              dropLocation,
              fare,
              distanceKm,
              etaMin,
              status: initialStatus,
              otp,
              type: type || "INSTANT",
              scheduledAt: type === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : new Date(),
            },
          ],
          { session }
        )
      : await Ride.create(
          [
            {
              userId,
              driverId: driver ? driver._id : null,
              pickupLocation,
              dropLocation,
              fare,
              distanceKm,
              etaMin,
              status: initialStatus,
              otp,
              type: type || "INSTANT",
              scheduledAt: type === "SCHEDULED" && scheduledAt ? new Date(scheduledAt) : new Date(),
            },
          ]
        );

    if (useTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    const newRide = rideArr[0];

    // 5. Emit offer to driver or notify user of REQUESTED state
    if (driver && io) {
      io.to(`driver_${driver.userId.toString()}`).emit("new-ride-offer", {
        rideId: newRide._id,
        pickupLocation: newRide.pickupLocation,
        dropLocation: newRide.dropLocation,
        fare,
        distanceKm,
        etaMin,
      });

      // Driver timeout: if no start in 30s, revert to REQUESTED
      setTimeout(async () => {
        try {
          const checkRide = await Ride.findById(newRide._id);
          if (checkRide && checkRide.status === "DRIVER_ASSIGNED") {
            const oldDriverId = checkRide.driverId;
            checkRide.status = "REQUESTED";
            checkRide.driverId = null;
            await checkRide.save();

            if (oldDriverId) {
              await Driver.findByIdAndUpdate(oldDriverId, { isAvailable: true });
            }

            if (io) {
              io.to(`ride_${checkRide._id.toString()}`).emit("driver-timeout", {
                rideId: checkRide._id,
                message: "Driver did not respond. Looking for another driver...",
              });
            }
            console.log(`Driver ${oldDriverId} timed out for ride ${checkRide._id}.`);
          }
        } catch (err) {
          console.error("Timeout error:", err);
        }
      }, 30000);
    }

    return newRide;
  } catch (error) {
    try {
      if (useTransaction) {
        await session.abortTransaction();
      }
      session.endSession();
    } catch (_) {}
    throw error;
  }
};

module.exports = { createRide };
