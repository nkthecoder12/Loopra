const Ride = require("../models/Ride");
const NotificationService = require("../services/notificationService");
const { RIDE_STATUS } = require("../utils/constants");

/**
 * Poller to automatically expire instant rides in REQUESTED status after a timeout (3 minutes)
 */
const startRideTimeoutPoller = (io) => {
  console.log("Started Ride Timeout Poller...");

  setInterval(async () => {
    try {
      // 3 minutes ago
      const timeoutThreshold = new Date(Date.now() - 3 * 60 * 1000);

      // Find all INSTANT rides that are still REQUESTED and were created more than 3 minutes ago
      const expiredRides = await Ride.find({
        status: RIDE_STATUS.REQUESTED,
        type: "INSTANT",
        createdAt: { $lte: timeoutThreshold }
      }).populate("userId");

      for (const ride of expiredRides) {
        // Atomically lock and update status to CANCELLED to prevent race conditions
        const updatedRide = await Ride.findOneAndUpdate(
          { _id: ride._id, status: RIDE_STATUS.REQUESTED },
          { 
            $set: { 
              status: RIDE_STATUS.CANCELLED,
              cancellationReason: "Timeout: No driver accepted the ride request.",
              cancelledBy: null // Schema accepts USER, DRIVER, or null
            } 
          },
          { new: true }
        );

        if (updatedRide) {
          console.log(`[TimeoutPoller] Auto-cancelled ride ${updatedRide._id} due to acceptance timeout.`);

          const roomName = `ride_${updatedRide._id.toString()}`;
          if (io) {
            // Emit socket updates to the passenger room
            io.to(roomName).emit("ride-cancelled", {
              rideId: updatedRide._id,
              cancelledBy: "SYSTEM",
              status: updatedRide.status,
              stateVersion: updatedRide.stateVersion,
              reason: updatedRide.cancellationReason
            });
            io.to(roomName).emit("ride-status-updated", {
              rideId: updatedRide._id,
              status: updatedRide.status,
              stateVersion: updatedRide.stateVersion
            });
          }

          // Send email notification to the passenger
          if (ride.userId && ride.userId.email) {
            try {
              await NotificationService.notifyRideCancelled(
                ride.userId.email,
                updatedRide._id.toString(),
                "No driver accepted the ride within 3 minutes"
              );
            } catch (mailErr) {
              console.error(`[TimeoutPoller] Failed to send email for ride ${updatedRide._id}:`, mailErr.message);
            }
          }
        }
      }
    } catch (err) {
      console.error("[TimeoutPoller] Error:", err);
    }
  }, 30 * 1000); // Poll every 30 seconds
};

module.exports = startRideTimeoutPoller;
