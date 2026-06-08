const Driver = require("../models/Driver");
const Ride = require("../models/Ride");

// ─── ONBOARD ─────────────────────────────────────────────────────────────────
// Issue #18: POST /driver/onboard — accepts FormData, creates driver record

const onboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, vehicleType, vehicleNumber } = req.body;

    if (!name || !phone || !vehicleType || !vehicleNumber) {
      return res.status(400).json({ success: false, message: "All fields are required: name, phone, vehicleType, vehicleNumber" });
    }

    // Check if already onboarded
    const existing = await Driver.findOne({ userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Driver profile already exists",
        onboardingStatus: existing.onboardingStatus,
      });
    }

    // Check phone uniqueness
    const phoneTaken = await Driver.findOne({ phone });
    if (phoneTaken) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const driverData = {
      userId,
      name,
      phone,
      vehicle: { type: vehicleType, number: vehicleNumber },
      onboardingStatus: "PENDING",
      documents: {
        license: req.files?.license?.[0]?.path || req.files?.license?.[0]?.filename || null,
        rc: req.files?.rc?.[0]?.path || req.files?.rc?.[0]?.filename || null,
      },
    };

    const driver = await Driver.create(driverData);

    return res.status(201).json({
      success: true,
      message: "Onboarding submitted. Pending admin approval.",
      driverId: driver._id,
      onboardingStatus: driver.onboardingStatus,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET STATUS ───────────────────────────────────────────────────────────────

const getStatus = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found", onboardingStatus: null });
    }
    return res.status(200).json({
      success: true,
      onboardingStatus: driver.onboardingStatus,
      isAvailable: driver.isAvailable,
      isActive: driver.isActive,
      currentRideId: driver.currentRideId,
    });
  } catch (err) {
    next(err);
  }
};

// ─── TOGGLE STATUS ───────────────────────────────────────────────────────────
// Issue #17: PATCH /driver/status

const toggleStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({ success: false, message: "isOnline must be a boolean" });
    }

    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }
    if (driver.onboardingStatus !== "APPROVED") {
      return res.status(403).json({ success: false, message: "Driver not approved yet. Please wait for admin approval." });
    }

    driver.isAvailable = isOnline;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: `You are now ${isOnline ? "online" : "offline"}`,
      isAvailable: driver.isAvailable,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET EARNINGS ─────────────────────────────────────────────────────────────
// Issue #17: GET /driver/earnings

const getEarnings = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }

    // Get today's completed rides for live total
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRides = await Ride.find({
      driverId: driver._id,
      status: "COMPLETED",
      completedAt: { $gte: todayStart },
    });

    const todayEarnings = todayRides.reduce((sum, r) => sum + (r.finalFare || 0), 0);

    return res.status(200).json({
      success: true,
      total: todayEarnings,
      rides: todayRides.length,
      rating: driver.earnings.rating || 5.0,
      acceptanceRate: driver.earnings.acceptanceRate || 100,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { onboard, getStatus, toggleStatus, getEarnings };
