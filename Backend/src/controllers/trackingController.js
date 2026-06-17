const Tracking = require("../models/Tracking");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

/**
 * Retrieve active location of assigned driver
 */
const getActiveLocation = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { id: userId, role } = req.user;

    const ride = await Ride.findById(rideId).populate("driverId");
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Access control: User must own the ride OR Driver must be the assigned driver OR Admin
    const isOwner = ride.userId.toString() === userId;
    let isAssignedDriver = false;

    if (role === "DRIVER") {
      const driver = await Driver.findOne({ userId });
      isAssignedDriver = driver && ride.driverId && ride.driverId._id.toString() === driver._id.toString();
    }

    if (!isOwner && !isAssignedDriver && role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access denied. Unauthorized to track this ride." });
    }

    if (!ride.driverId) {
      return res.status(400).json({ success: false, message: "No driver assigned to this ride yet." });
    }

    return res.status(200).json({
      success: true,
      location: ride.driverId.location,
      updatedAt: ride.driverId.updatedAt
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve full route path history for a completed/ongoing ride
 */
const getPathHistory = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { id: userId, role } = req.user;

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Access control: User must own the ride OR Driver must be the assigned driver OR Admin
    const isOwner = ride.userId.toString() === userId;
    let isAssignedDriver = false;

    if (role === "DRIVER") {
      const driver = await Driver.findOne({ userId });
      isAssignedDriver = driver && ride.driverId && ride.driverId.toString() === driver._id.toString();
    }

    if (!isOwner && !isAssignedDriver && role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Access denied. Unauthorized to view this route history." });
    }

    const pathPoints = await Tracking.find({ rideId })
      .sort({ recordedAt: 1 })
      .select("location recordedAt");

    return res.status(200).json({
      success: true,
      totalPoints: pathPoints.length,
      path: pathPoints.map(p => ({
        longitude: p.location.coordinates[0],
        latitude: p.location.coordinates[1],
        recordedAt: p.recordedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveLocation,
  getPathHistory
};
