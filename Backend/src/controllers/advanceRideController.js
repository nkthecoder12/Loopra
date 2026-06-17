const advanceRideService = require("../services/advanceRideService");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");

const bookAdvanceRide = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const rideAId = req.body.rideAId || req.body.parentRideId;
    const pickupLocation = req.body.pickupLocation || req.body.pickup;
    const dropLocation = req.body.dropLocation || req.body.drop;
    const scheduledAt = req.body.scheduledAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    
    if (!rideAId || !pickupLocation || !dropLocation || !scheduledAt) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const rideB = await advanceRideService.createAdvanceRide(userId, rideAId, {
      pickupLocation,
      dropLocation,
      scheduledAt
    });

    res.status(201).json({
      success: true,
      message: "Advance ride created, awaiting payment.",
      rideId: rideB._id,
      advanceFee: advanceRideService.ADVANCE_FEE
    });
  } catch (error) {
    if (error.message.includes("not found or not eligible")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

const respondToOffer = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }
    const driverId = driver._id;
    const { rideId } = req.params;
    const { acceptRideA, acceptRideB } = req.body;

    if (acceptRideB && !acceptRideA) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot accept advance ride without accepting the primary ride" 
      });
    }

    const updatedRide = await advanceRideService.processDriverResponse(
      driverId, 
      rideId, 
      acceptRideA, 
      acceptRideB
    );

    res.status(200).json({
      success: true,
      message: acceptRideB ? "Advance ride assigned successfully" : "Advance ride rejected",
      assignmentStage: updatedRide.assignmentStage
    });
  } catch (error) {
    if (error.message.includes("Offer has expired") || error.message.includes("Race condition")) {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = {
  bookAdvanceRide,
  respondToOffer
};
