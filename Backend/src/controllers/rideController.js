const rideService = require("../services/rideService");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const notificationEventBus = require("../services/notificationEventBus");
const { RIDE_STATUS } = require("../utils/constants");
const { enforceStatusTransition } = require("../utils/rideStateMachine");
const { calculateDistance } = require("../utils/helpers");
const { estimateFare } = require("../services/fareCalculator");

// ─── GET RIDE ────────────────────────────────────────────────────────────────

const getRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate("userId", "name email")
      .populate("driverId", "name phone vehicle location");

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const rideObj = ride.toObject();
    // Only the passenger (userId) or admin should see the OTP. Hide it from drivers.
    if (req.user.role !== "ADMIN" && req.user.id !== ride.userId.toString()) {
      delete rideObj.otp;
    }

    return res.status(200).json({ success: true, ride: rideObj });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE RIDE ─────────────────────────────────────────────────────────────
// Issue #10: Frontend calls POST /rides/book (route is /book)

const createRide = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const pickupLocation = req.body.pickupLocation || req.body.pickup;
    const dropLocation = req.body.dropLocation || req.body.drop;

    if (!pickupLocation?.lat || !pickupLocation?.lng || !dropLocation?.lat || !dropLocation?.lng) {
      return res.status(400).json({
        success: false,
        message: "pickupLocation and dropLocation with lat/lng are required",
      });
    }

    const rideData = {
      pickupLocation,
      dropLocation,
      vehicleType: req.body.vehicleType,
      type: req.body.type || "INSTANT",
      scheduledAt: req.body.scheduledAt || null
    };
    const io = req.app.get("io");

    const ride = await rideService.createRide(userId, rideData, io);

    res.status(201).json({
      success: true,
      rideId: ride._id,
      status: ride.status,
      fare: ride.fare,
      distanceKm: ride.distanceKm,
      etaMin: ride.etaMin,
      stateVersion: ride.stateVersion,
      otp: ride.otp,
    });
  } catch (error) {
    if (error.message === "User already has an active ride") {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ─── ESTIMATE RIDE ───────────────────────────────────────────────────────────
// Issue #9: Add POST /rides/estimate

const estimateRide = async (req, res, next) => {
  try {
    const { pickup, drop } = req.body;
    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {
      return res.status(400).json({ success: false, message: "pickup and drop coordinates are required" });
    }
    const estimate = estimateFare({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropLat: drop.lat,
      dropLng: drop.lng,
    });
    return res.status(200).json({
      success: true,
      fare: estimate.fare,
      distanceKm: estimate.distanceKm,
      etaMin: estimate.etaMin,
      // Return vehicles array for UI selection
      vehicles: [
        { id: "economy", name: "Economy", price: estimate.fare, eta: estimate.etaMin },
        { id: "premium", name: "Premium", price: Math.round(estimate.fare * 1.5), eta: estimate.etaMin + 2 },
        { id: "suv", name: "SUV", price: Math.round(estimate.fare * 2), eta: estimate.etaMin + 5 },
      ],
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET ACTIVE RIDE ─────────────────────────────────────────────────────────
// Issue #9: Add GET /rides/active

const getActiveRide = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ride = await Ride.findOne({
      userId,
      status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] },
    })
      .populate("driverId", "name phone vehicle location")
      .sort({ createdAt: -1 });

    if (!ride) {
      return res.status(404).json({ success: false, message: "No active ride" });
    }
    return res.status(200).json({ success: true, ride });
  } catch (err) {
    next(err);
  }
};

// ─── ACCEPT RIDE (DRIVER) ────────────────────────────────────────────────────

const acceptRide = async (req, res, next) => {
  try {
    const io = req.app.get("io");
    const driver = await Driver.findOne({ userId: req.user.id });

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }
    if (driver.onboardingStatus !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Driver not approved" });
    }

    const existingRide = await Ride.findById(req.params.id);
    if (!existingRide) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const otp = existingRide.otp || Math.floor(1000 + Math.random() * 9000).toString();

    // Atomic: take ride only if still REQUESTED and no driver assigned, OR if already assigned to this driver
    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { status: RIDE_STATUS.REQUESTED, driverId: null },
          { status: RIDE_STATUS.DRIVER_ASSIGNED, driverId: driver._id }
        ]
      },
      { $set: { status: RIDE_STATUS.DRIVER_ASSIGNED, driverId: driver._id, fleetId: driver.fleetId || null, vehicleId: driver.vehicleId || null, otp } },
      { new: true }
    );

    if (!ride) {
      return res.status(409).json({ success: false, message: "Ride no longer available" });
    }

    // Mark driver as busy and link current ride / reserved ride depending on type
    if (ride.type === "SCHEDULED") {
      await Driver.findByIdAndUpdate(driver._id, { reservedRideId: ride._id });
    } else {
      await Driver.findByIdAndUpdate(driver._id, { isAvailable: false, currentRideId: ride._id });
    }

    // Emit domain event for ride assignment
    notificationEventBus.emit("ride.assigned", {
      riderUserId: ride.userId,
      data: {
        rideId: ride._id,
        driverName: driver.name,
        vehicleType: driver.vehicle.type,
        vehicleNumber: driver.vehicle.number,
      },
    });

    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("ride-status-updated", {
        rideId: ride._id,
        status: ride.status,
        stateVersion: ride.stateVersion,
        driver: {
          name: driver.name,
          phone: driver.phone,
          vehicle: driver.vehicle,
        },
      });
      // Send OTP securely to the ride room
      io.to(`ride_${ride._id.toString()}`).emit("ride-otp", {
        rideId: ride._id,
        otp,
      });
    }

    const rideObj = ride.toObject();
    if (req.user.role !== "ADMIN" && req.user.id !== ride.userId.toString()) {
      delete rideObj.otp;
    }

    return res.status(200).json({ success: true, message: "Ride accepted", ride: rideObj });
  } catch (err) {
    next(err);
  }
};

// ─── REJECT RIDE (DRIVER) ────────────────────────────────────────────────────

const rejectRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const driver = await Driver.findOne({ userId: req.user.id });
    if (driver && ride.driverId?.toString() === driver._id.toString()) {
      // Release driver
      await Driver.findByIdAndUpdate(driver._id, { isAvailable: true, currentRideId: null });
      // Reset ride to REQUESTED for re-assignment
      ride.status = RIDE_STATUS.REQUESTED;
      ride.driverId = null;
      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`ride_${ride._id.toString()}`).emit("driver-timeout", {
          rideId: ride._id,
          message: "Driver rejected the ride. Finding another driver...",
        });
      }
    }

    return res.status(200).json({ success: true, message: "Ride rejected" });
  } catch (err) {
    next(err);
  }
};

// ─── START RIDE ───────────────────────────────────────────────────────────────

const startRide = async (req, res, next) => {
  try {
    const { id: rideId } = req.params;
    const { otp } = req.body;
    const io = req.app.get("io");

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Verify OTP first
    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required to start the ride" });
    }

    if (ride.otp !== otp) {
      ride.otpAttempts = (ride.otpAttempts || 0) + 1;
      await ride.save();

      if (ride.otpAttempts >= 5) {
        ride.status = RIDE_STATUS.FAILED;
        await ride.save();

        if (io) {
          io.to(`ride_${ride._id.toString()}`).emit("ride-status-updated", {
            rideId: ride._id,
            status: ride.status,
            stateVersion: ride.stateVersion,
          });
        }
        return res.status(400).json({ success: false, message: "Too many wrong OTP attempts. Ride cancelled." });
      }

      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    try {
      enforceStatusTransition(ride, RIDE_STATUS.ONGOING, req.user.role);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const driver = await Driver.findOne({ userId: req.user.id });
    if (driver && driver.location && driver.location.coordinates) {
      const [lng, lat] = driver.location.coordinates;
      const dist = calculateDistance(lat, lng, ride.pickupLocation.lat, ride.pickupLocation.lng);
      if (dist > 500) {
        return res.status(400).json({ success: false, message: "Driver is too far from pickup location" });
      }
    }

    ride.status = RIDE_STATUS.ONGOING;
    ride.startedAt = new Date();
    await ride.save();

    // Emit domain event for ride start
    notificationEventBus.emit("ride.started", {
      riderUserId: ride.userId,
      data: { rideId: ride._id },
    });

    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("ride-status-updated", {
        rideId: ride._id,
        status: ride.status,
        stateVersion: ride.stateVersion,
      });
    }

    return res.status(200).json({ success: true, message: "Ride started", data: ride });
  } catch (err) {
    next(err);
  }
};

// ─── COMPLETE RIDE ────────────────────────────────────────────────────────────

const completeRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    try {
      enforceStatusTransition(ride, RIDE_STATUS.COMPLETED, req.user.role);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const activeDriver = await Driver.findOne({ userId: req.user.id });
    if (activeDriver && activeDriver.location && activeDriver.location.coordinates) {
      const [lng, lat] = activeDriver.location.coordinates;
      const dist = calculateDistance(lat, lng, ride.dropLocation.lat, ride.dropLocation.lng);
      if (dist > 500) {
        return res.status(400).json({ success: false, message: "Driver is too far from drop location" });
      }
    }

    const endTime = new Date();
    const durationMin = ride.startedAt
      ? Math.ceil((endTime - ride.startedAt) / (1000 * 60))
      : ride.etaMin || 15;

    // Use pre-calculated fare as base; time overrun adds extra
    const finalFare = Math.max(ride.fare || 0, 50 + durationMin * 5);

    ride.status = RIDE_STATUS.COMPLETED;
    ride.completedAt = endTime;
    ride.finalFare = finalFare;
    await ride.save();

    // Emit domain event for ride completion
    notificationEventBus.emit("ride.completed", {
      riderUserId: ride.userId,
      data: { rideId: ride._id, fare: finalFare },
    });

    const driver = await Driver.findById(ride.driverId);
    if (driver) {
      driver.isAvailable = true;
      driver.currentRideId = null;
      await driver.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("ride-status-updated", {
        rideId: ride._id,
        status: ride.status,
        finalFare,
        stateVersion: ride.stateVersion,
      });
    }

    return res.status(200).json({ success: true, message: "Ride completed", ride });
  } catch (error) {
    next(error);
  }
};

// ─── CANCEL RIDE ──────────────────────────────────────────────────────────────

const cancelRide = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    try {
      enforceStatusTransition(ride, RIDE_STATUS.CANCELLED, req.user.role);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        driver.isAvailable = true;
        driver.currentRideId = null;
        await driver.save();
      }
    }

    // Trigger refund if scheduled ride has advance payment
    if (ride.paymentStatus === "RESERVED" && ride.advancePaymentId) {
      try {
        const { processRefund } = require("../services/advanceRideService");
        await processRefund(ride._id);
      } catch (refundErr) {
        console.error("Auto-refund failed on cancellation:", refundErr);
      }
    }

    ride.status = RIDE_STATUS.CANCELLED;
    ride.cancelledBy = req.user.role;
    ride.cancellationReason = req.body.reason || null;
    await ride.save();

    // Emit domain event for ride cancelled to rider
    notificationEventBus.emit("ride.cancelled", {
      userId: ride.userId,
      data: { rideId: ride._id, reason: ride.cancellationReason || "Cancelled" },
    });

    if (ride.driverId) {
      const driver = await Driver.findById(ride.driverId);
      if (driver) {
        // Emit domain event for ride cancelled to driver
        notificationEventBus.emit("ride.cancelled", {
          userId: driver.userId,
          data: { rideId: ride._id, reason: ride.cancellationReason || "Cancelled" },
        });
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("ride-cancelled", {
        rideId: ride._id,
        cancelledBy: req.user.role,
        status: ride.status,
        stateVersion: ride.stateVersion,
      });
      io.to(`ride_${ride._id.toString()}`).emit("ride-status-updated", {
        rideId: ride._id,
        status: ride.status,
        stateVersion: ride.stateVersion,
      });
    }

    return res.status(200).json({ success: true, message: "Ride cancelled", ride });
  } catch (err) {
    next(err);
  }
};

// ─── CANCEL AT MIDDLE ─────────────────────────────────────────────────────────

const cancelAtMiddle = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const newStatus = RIDE_STATUS.CANCELLEDMIDDLE;
    try {
      enforceStatusTransition(ride, newStatus, req.user.role);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const driver = await Driver.findById(ride.driverId);
    const endTime = new Date();
    let finalFare = 0;

    if (req.user.role === "USER") {
      const durationMin = Math.ceil((endTime - ride.startedAt) / (1000 * 60));
      finalFare = 50 + durationMin * 5;
    }

    ride.status = RIDE_STATUS.CANCELLEDMIDDLE;
    ride.completedAt = endTime;
    ride.finalFare = finalFare;
    await ride.save();

    if (driver) {
      driver.isAvailable = true;
      await driver.save();
    }

    const io = req.app.get("io");
    if (io) {
      io.to(`ride_${ride._id.toString()}`).emit("ride-cancelled", {
        rideId: ride._id,
        cancelledBy: req.user.role,
        status: ride.status,
        stateVersion: ride.stateVersion,
      });
    }

    return res.status(200).json({ success: true, message: "Ride cancelled midway", finalFare });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRide,
  createRide,
  estimateRide,
  getActiveRide,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  cancelRide,
  cancelAtMiddle,
};
