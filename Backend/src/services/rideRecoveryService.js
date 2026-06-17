const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const { RIDE_STATUS } = require("../utils/constants");

/**
 * Recovery service for handling interrupted rides after server restart
 */
class RideRecoveryService {
  
  /**
   * Recover all interrupted rides on server startup
   */
  static async recoverInterruptedRides() {
    console.log("Starting ride recovery process...");
    
    try {
      // 1. Find rides stuck in DRIVER_ASSIGNED state for too long
      const stuckAssignedRides = await Ride.find({
        status: RIDE_STATUS.DRIVER_ASSIGNED,
        createdAt: { 
          $lt: new Date(Date.now() - 30 * 60 * 1000) // Older than 30 minutes
        }
      }).populate('driverId');

      for (const ride of stuckAssignedRides) {
        await this.recoverStuckAssignedRide(ride);
      }

      // 2. Find rides stuck in ONGOING state for too long
      const stuckOngoingRides = await Ride.find({
        status: RIDE_STATUS.ONGOING,
        startedAt: { 
          $lt: new Date(Date.now() - 4 * 60 * 60 * 1000) // Older than 4 hours
        }
      }).populate('driverId');

      for (const ride of stuckOngoingRides) {
        await this.recoverStuckOngoingRide(ride);
      }

      // 3. Find drivers who are unavailable but have no active rides
      const stuckDrivers = await Driver.find({
        isAvailable: false
      });

      for (const driver of stuckDrivers) {
        await this.recoverStuckDriver(driver);
      }

      console.log("Ride recovery process completed");
      return {
        recoveredAssignedRides: stuckAssignedRides.length,
        recoveredOngoingRides: stuckOngoingRides.length,
        recoveredDrivers: stuckDrivers.length
      };

    } catch (error) {
      console.error("Ride recovery failed:", error);
      throw error;
    }
  }

  /**
   * Recover a ride stuck in DRIVER_ASSIGNED state
   */
  static async recoverStuckAssignedRide(ride) {
    try {
      console.log(`Recovering stuck assigned ride: ${ride._id}`);
      
      // Release the driver
      if (ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId._id, {
          isAvailable: true
        });
      }

      // Mark ride as failed
      await Ride.findByIdAndUpdate(ride._id, {
        status: RIDE_STATUS.FAILED,
        cancellationReason: "Auto-recovered: Ride stuck in assigned state",
        completedAt: new Date()
      });

      console.log(`Recovered stuck assigned ride: ${ride._id}`);
    } catch (error) {
      console.error(`Failed to recover ride ${ride._id}:`, error);
    }
  }

  /**
   * Recover a ride stuck in ONGOING state
   */
  static async recoverStuckOngoingRide(ride) {
    try {
      console.log(`Recovering stuck ongoing ride: ${ride._id}`);
      
      // Calculate fare based on time elapsed
      const endTime = new Date();
      const durationInMinutes = ride.startedAt ? 
        Math.ceil((endTime - ride.startedAt) / (1000 * 60)) : 0;

      const BASE_FARE = 50;
      const PER_MIN_RATE = 5;
      const finalFare = BASE_FARE + durationInMinutes * PER_MIN_RATE;

      // Release the driver
      if (ride.driverId) {
        await Driver.findByIdAndUpdate(ride.driverId._id, {
          isAvailable: true
        });
      }

      // Complete the ride with calculated fare
      await Ride.findByIdAndUpdate(ride._id, {
        status: RIDE_STATUS.COMPLETED,
        completedAt: endTime,
        finalFare,
        cancellationReason: "Auto-recovered: Ride completed after timeout"
      });

      console.log(`Recovered stuck ongoing ride: ${ride._id}, Fare: ${finalFare}`);
    } catch (error) {
      console.error(`Failed to recover ride ${ride._id}:`, error);
    }
  }

  /**
   * Recover a driver stuck in unavailable state
   */
  static async recoverStuckDriver(driver) {
    try {
      // Check if driver has any active rides
      const activeRide = await Ride.findOne({
        driverId: driver._id,
        status: { $in: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] }
      });

      if (!activeRide) {
        // No active rides, make driver available
        await Driver.findByIdAndUpdate(driver._id, {
          isAvailable: true
        });
        console.log(`Recovered stuck driver: ${driver._id}`);
      }
    } catch (error) {
      console.error(`Failed to recover driver ${driver._id}:`, error);
    }
  }

  /**
   * Validate ride data consistency
   */
  static async validateRideConsistency() {
    console.log("Starting ride consistency validation...");
    
    try {
      // Find rides with driverId but driver doesn't exist
      const orphanedRides = await Ride.find({
        driverId: { $exists: true, $ne: null }
      }).populate('driverId');

      let fixedCount = 0;
      for (const ride of orphanedRides) {
        if (!ride.driverId) {
          // Driver reference is broken, clear it
          await Ride.findByIdAndUpdate(ride._id, {
            $unset: { driverId: 1 },
            status: RIDE_STATUS.FAILED,
            cancellationReason: "Auto-recovered: Driver reference broken"
          });
          fixedCount++;
        }
      }

      console.log(`Fixed ${fixedCount} rides with broken driver references`);
      return { fixedRides: fixedCount };

    } catch (error) {
      console.error("Ride consistency validation failed:", error);
      throw error;
    }
  }

  /**
   * Health check for ride system
   */
  static async getSystemHealth() {
    try {
      const stats = {
        activeRides: await Ride.countDocuments({
          status: { $in: [RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] }
        }),
        availableDrivers: await Driver.countDocuments({ isAvailable: true }),
        totalDrivers: await Driver.countDocuments(),
        stuckRides: await Ride.countDocuments({
          $or: [
            {
              status: RIDE_STATUS.DRIVER_ASSIGNED,
              createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }
            },
            {
              status: RIDE_STATUS.ONGOING,
              startedAt: { $lt: new Date(Date.now() - 4 * 60 * 60 * 1000) }
            }
          ]
        })
      };

      return stats;
    } catch (error) {
      console.error("System health check failed:", error);
      throw error;
    }
  }
}

module.exports = RideRecoveryService;
