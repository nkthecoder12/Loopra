const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

const rideGuard = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { id: userId, role } = req.user;

    // 1️⃣ Ride must exist
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found"
      });
    }

   
    if (role === "USER") {
      if (ride.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You do not own this ride"
        });
      }
    }

    // 3️⃣ DRIVER access check (IMPORTANT PART)
    if (role === "DRIVER") {
      // Find driver profile using USER ID from JWT
      const driver = await Driver.findOne({ userId });

      if (!driver) {
        return res.status(403).json({
          success: false,
          message: "Driver profile not found"
        });
      }

      // Compare DRIVER ID with ride.driverId
      if (
        !ride.driverId ||
        ride.driverId.toString() !== driver._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this ride"
        });
      }
    }

    // 4️⃣ Attach ride for controller reuse (optional but good)
    req.ride = ride;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = rideGuard;
