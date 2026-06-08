const Driver = require("../models/Driver");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");

// ─── GET USERS (paginated) ────────────────────────────────────────────────────
// Issue #15, #16: Add GET /admin/users

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ isDeleted: false })
        .select("name email role profileImage isVerified isBlocked createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments({ isDeleted: false }),
    ]);

    return res.status(200).json({
      success: true,
      data: { users, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// ─── GET DRIVERS (paginated) ──────────────────────────────────────────────────
// Issue #15, #16: Replace listDrivers with full getDrivers

const getDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // optional filter: PENDING|APPROVED|REJECTED

    const filter = { isDeleted: false };
    if (status) filter.onboardingStatus = status;

    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .populate("userId", "name email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Driver.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: { drivers, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch drivers" });
  }
};

// ─── APPROVE DRIVER ───────────────────────────────────────────────────────────
// Issue #15, #16: Add POST /admin/drivers/:id/approve

const approveDriver = async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { onboardingStatus: "APPROVED", isActive: true },
      { new: true }
    ).populate("userId", "name email");

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Update corresponding user's role to "DRIVER"
    if (driver.userId) {
      await User.findByIdAndUpdate(driver.userId._id || driver.userId, { role: "DRIVER" });
    }

    // Trigger Onboarding Approval Alert
    if (driver.userId && driver.userId.email) {
      NotificationService.notifyDriverOnboarding(driver.userId.email, "APPROVED").catch((err) => {
        console.error("[AdminController] Approval email failed:", err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Driver ${driver.name} approved`,
      driver,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to approve driver" });
  }
};

// ─── REJECT DRIVER ────────────────────────────────────────────────────────────
// Issue #15, #16: Add POST /admin/drivers/:id/reject

const rejectDriver = async (req, res) => {
  try {
    const { reason } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { onboardingStatus: "REJECTED", isActive: false },
      { new: true }
    ).populate("userId", "name email");

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Revert/set corresponding user's role to "USER"
    if (driver.userId) {
      await User.findByIdAndUpdate(driver.userId._id || driver.userId, { role: "USER" });
    }

    // Trigger Onboarding Rejection Alert
    if (driver.userId && driver.userId.email) {
      NotificationService.notifyDriverOnboarding(driver.userId.email, "REJECTED", reason).catch((err) => {
        console.error("[AdminController] Rejection email failed:", err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: `Driver ${driver.name} rejected`,
      reason: reason || "No reason provided",
      driver,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to reject driver" });
  }
};

// ─── DEACTIVATE DRIVER ────────────────────────────────────────────────────────

const deactivateDriver = async (req, res) => {
  const { driverId } = req.params;
  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: driverId, isActive: true },
      { isActive: false, isAvailable: false },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found or already inactive" });
    }

    return res.status(200).json({
      success: true,
      message: "Driver deactivated successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to deactivate driver" });
  }
};

module.exports = { getUsers, getDrivers, approveDriver, rejectDriver, deactivateDriver };
