const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { processRefund } = require("../services/advanceRideService");
const { RIDE_STATUS } = require("../utils/constants");

const startAdvanceRidePoller = (io) => {
  console.log("Started Advance Ride Poller...");

  setInterval(async () => {
    try {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);
      const fiveMinsFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // --- EDGE CASE 5: RESTART RISK (Missed INITIAL_DRIVER timeout) ---
      const missedInitial = await Ride.find({
        type: "SCHEDULED",
        assignmentStage: "INITIAL_DRIVER",
        scheduledAt: { $lte: twoHoursFromNow }
      });
      for (const ride of missedInitial) {
        await Ride.findOneAndUpdate(
          { _id: ride._id, assignmentStage: "INITIAL_DRIVER" },
          { $set: { assignmentStage: "NEARBY_DRIVERS" } }
        );
      }

      // --- EDGE CASE 3: RIDE B CONFLICT WITH RIDE A DELAY ---
      const assignedRides = await Ride.find({
        type: "SCHEDULED",
        assignmentStage: "ASSIGNED",
        scheduledAt: { $lte: thirtyMinsFromNow }
      }).populate('parentRideId');

      for (const rideB of assignedRides) {
        if (rideB.parentRideId && rideB.parentRideId.status === RIDE_STATUS.ONGOING) {
          // Parent ride is still ongoing but Ride B starts in < 30 mins!
          // Unassign and move to ALL_DRIVERS
          const lockedRide = await Ride.findOneAndUpdate(
            { _id: rideB._id, assignmentStage: "ASSIGNED" },
            { $set: { assignmentStage: "ALL_DRIVERS", driverId: null } },
            { new: true }
          );
          if (lockedRide) {
            await Driver.updateOne(
              { _id: rideB.driverId }, 
              { $unset: { reservedRideId: 1 } }
            );
            console.log(`Reassigned Ride ${rideB._id} due to Ride A delay.`);
          }
        }
      }

      // --- EDGE CASE 1: POLLER SCALABILITY (Atomic Lock) ---
      // --- STAGE 2: NEARBY DRIVERS (T - 2 Hours) ---
      // We don't advance the stage immediately, we stay in NEARBY_DRIVERS and emit
      // However, to prevent spamming emits every minute, we could use a lastEmitted flag.
      // But based on your request, we use atomic updates to claim the transition.
      // Wait, Stage 2 is an ongoing broadcast stage until T-30. We shouldn't lock it if we want to keep broadcasting.
      // If we only broadcast once, we need a sub-stage or a flag.
      // Let's use `assignmentStage` transition from something like `NEARBY_DRIVERS_PENDING`?
      // Simpler: Just rely on atomic update for transitions, and let Stage 2 broadcast be stateless or track `lastBroadcastedAt`.
      // For now, let's fix the atomic lock for transitions.

      // Transition to Stage 3 (ALL_DRIVERS) atomically
      const readyForStage3 = await Ride.find({
        type: "SCHEDULED",
        assignmentStage: "NEARBY_DRIVERS",
        scheduledAt: { $lte: thirtyMinsFromNow }
      });

      for (const ride of readyForStage3) {
        const lockedRide = await Ride.findOneAndUpdate(
          { _id: ride._id, assignmentStage: "NEARBY_DRIVERS" },
          { $set: { assignmentStage: "ALL_DRIVERS" } },
          { new: true }
        );

        if (lockedRide && io) {
          const allDrivers = await Driver.find({ isAvailable: true, isActive: true, reservedRideId: null });
          allDrivers.forEach(driver => {
            io.to(`driver_${driver.userId.toString()}`).emit("advance-ride-stage-update", {
              rideId: lockedRide._id,
              pickupLocation: lockedRide.pickupLocation,
              dropLocation: lockedRide.dropLocation,
              scheduledAt: lockedRide.scheduledAt,
              isGlobal: true
            });
          });
          console.log(`Stage 3: Broadcasted ride ${lockedRide._id} to ALL available drivers.`);
        }
      }

      // Broadcast Stage 2 (Only if not already transitioned)
      const stage2Rides = await Ride.find({
        type: "SCHEDULED",
        assignmentStage: "NEARBY_DRIVERS"
      });

      for (const ride of stage2Rides) {
        const nearbyDrivers = await Driver.find({
          isAvailable: true,
          isActive: true,
          reservedRideId: null, // Edge Case 6 Fix included here implicitly
          location: {
            $near: {
              $geometry: { type: "Point", coordinates: [ride.pickupLocation.lng, ride.pickupLocation.lat] },
              $maxDistance: 5000
            }
          }
        });

        if (nearbyDrivers.length > 0 && io) {
          nearbyDrivers.forEach(driver => {
            io.to(`driver_${driver.userId.toString()}`).emit("advance-ride-stage-update", {
              rideId: ride._id,
              pickupLocation: ride.pickupLocation,
              dropLocation: ride.dropLocation,
              scheduledAt: ride.scheduledAt
            });
          });
        }
      }

      // --- STAGE 4: FAILED (T - 5 Mins) ---
      const failedRides = await Ride.find({
        type: "SCHEDULED",
        assignmentStage: { $in: ["NEARBY_DRIVERS", "ALL_DRIVERS"] },
        scheduledAt: { $lte: fiveMinsFromNow }
      });

      for (const ride of failedRides) {
        // Atomic update to mark as FAILED ensures only ONE poller triggers the refund
        const updatedRide = await Ride.findOneAndUpdate(
          { _id: ride._id, assignmentStage: { $in: ["NEARBY_DRIVERS", "ALL_DRIVERS"] } },
          { $set: { assignmentStage: "FAILED", status: "FAILED" } },
          { new: true }
        );

        if (updatedRide) {
          console.log(`Stage 4: Ride ${updatedRide._id} FAILED. Triggering refund.`);
          await processRefund(updatedRide._id);
          if (io) {
             io.to(`user_${updatedRide.userId.toString()}`).emit("advance-ride-failed", {
                rideId: updatedRide._id,
                message: "No drivers available. A full refund has been initiated."
             });
          }
        }
      }

      // --- EDGE CASE 4: REFUND RETRY MECHANISM ---
      const failedRefunds = await Ride.find({ paymentStatus: "FAILED_REFUND" });
      for (const ride of failedRefunds) {
        console.log(`Retrying refund for ride ${ride._id}`);
        await processRefund(ride._id);
      }

    } catch (err) {
      console.error("Advance Ride Poller Error:", err);
    }
  }, 60 * 1000); // 1 minute
};

module.exports = startAdvanceRidePoller;
