const Driver = require("../models/Driver");
const DriverApplication = require("../models/DriverApplication");
const AdminAuditLog = require("../models/AdminAuditLog");
const User = require("../models/User");
const notificationEventBus = require("../services/notificationEventBus");

// ─── GET USERS (paginated) ────────────────────────────────────────────────────
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
const getDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

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

// ─── GET DRIVER APPLICATIONS ──────────────────────────────────────────────────
const getDriverApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { "personalDetails.fullName": { $regex: search, $options: "i" } },
        { "personalDetails.phone": { $regex: search, $options: "i" } },
        { "personalDetails.email": { $regex: search, $options: "i" } },
        { "vehicleDetails.number": { $regex: search, $options: "i" } },
      ];
    }

    const [applications, total] = await Promise.all([
      DriverApplication.find(filter)
        .populate("userId", "name email profileImage")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      DriverApplication.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: { applications, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch driver applications" });
  }
};

// ─── GET DRIVER APPLICATION BY ID ─────────────────────────────────────────────
const getDriverApplicationById = async (req, res) => {
  try {
    const application = await DriverApplication.findById(req.params.id).populate("userId", "name email profileImage");
    if (!application) {
      return res.status(404).json({ success: false, message: "Driver application not found" });
    }
    return res.status(200).json({ success: true, application });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch application details" });
  }
};

// ─── VERIFY DOCUMENT ──────────────────────────────────────────────────────────
const verifyDocument = async (req, res) => {
  try {
    const { docKey, verificationStatus, reviewNotes } = req.body;
    const adminId = req.user.id;

    if (!docKey || !["APPROVED", "RE_UPLOAD_REQUIRED"].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: "Invalid docKey or verificationStatus" });
    }

    const application = await DriverApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Check if key is in licenseDetails or documents
    let targetDoc = null;
    if (application.licenseDetails?.[docKey]) {
      targetDoc = application.licenseDetails[docKey];
    } else if (application.documents?.[docKey]) {
      targetDoc = application.documents[docKey];
    } else if (application.vehicleDetails?.[docKey]) {
      targetDoc = application.vehicleDetails[docKey];
    }

    if (targetDoc) {
      targetDoc.verificationStatus = verificationStatus;
      targetDoc.reviewNotes = reviewNotes || "";
    }

    application.timeline.push({
      status: "DOCUMENT_VERIFIED",
      timestamp: new Date(),
      note: `Document ${docKey} marked as ${verificationStatus}${reviewNotes ? `: ${reviewNotes}` : ""}`,
      performedBy: adminId,
    });

    await application.save();

    await AdminAuditLog.create({
      adminId,
      targetType: "DRIVER_APPLICATION",
      targetId: application._id,
      action: "VERIFY_DOCUMENT",
      reason: reviewNotes || null,
      metadata: { docKey, verificationStatus },
    });

    return res.status(200).json({ success: true, message: `Document ${docKey} updated`, application });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to verify document" });
  }
};

// ─── APPROVE APPLICATION ──────────────────────────────────────────────────────
const approveDriverApplication = async (req, res) => {
  try {
    const adminId = req.user.id;
    const application = await DriverApplication.findById(req.params.id).populate("userId", "name email");
    if (!application) {
      return res.status(404).json({ success: false, message: "Driver application not found" });
    }

    application.status = "APPROVED";
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    application.timeline.push({
      status: "APPROVED",
      timestamp: new Date(),
      note: "Application approved by Admin",
      performedBy: adminId,
    });
    await application.save();

    // Create or update active Driver record
    let driver = await Driver.findOne({ userId: application.userId._id || application.userId });
    if (!driver) {
      driver = await Driver.create({
        userId: application.userId._id || application.userId,
        name: application.personalDetails.fullName,
        phone: application.personalDetails.phone,
        vehicle: {
          type: application.vehicleDetails.vehicleType,
          number: application.vehicleDetails.number,
        },
        onboardingStatus: "APPROVED",
        isActive: true,
        documents: {
          license: application.licenseDetails.licenseFront?.url || null,
          rc: application.documents.rcBook?.url || null,
        },
      });
    } else {
      driver.onboardingStatus = "APPROVED";
      driver.isActive = true;
      driver.isDeleted = false;
      driver.deletedAt = null;
      driver.name = application.personalDetails.fullName;
      driver.phone = application.personalDetails.phone;
      driver.vehicle = {
        type: application.vehicleDetails.vehicleType,
        number: application.vehicleDetails.number,
      };
      await driver.save();
    }

    // Update User role
    await User.findByIdAndUpdate(application.userId._id || application.userId, { role: "DRIVER" });

    // Admin Audit Log
    await AdminAuditLog.create({
      adminId,
      targetType: "DRIVER_APPLICATION",
      targetId: application._id,
      action: "APPROVE_APPLICATION",
    });

    // Emit domain event for driver approval
    const driverUserId = application.userId._id || application.userId;
    notificationEventBus.emit("driver.approved", {
      driverUserId,
      data: { name: application.personalDetails.fullName },
    });

    return res.status(200).json({ success: true, message: "Driver application approved successfully", application, driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to approve driver application" });
  }
};

// ─── REJECT APPLICATION ───────────────────────────────────────────────────────
const rejectDriverApplication = async (req, res) => {
  try {
    const { reason } = req.body;
    const adminId = req.user.id;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is mandatory" });
    }

    const application = await DriverApplication.findById(req.params.id).populate("userId", "name email");
    if (!application) {
      return res.status(404).json({ success: false, message: "Driver application not found" });
    }

    application.status = "REJECTED";
    application.rejectionReason = reason;
    application.reviewedAt = new Date();
    application.reviewedBy = adminId;
    application.timeline.push({
      status: "REJECTED",
      timestamp: new Date(),
      note: `Application rejected: ${reason}`,
      performedBy: adminId,
    });
    await application.save();

    // Update driver record if exists
    await Driver.findOneAndUpdate({ userId: application.userId._id || application.userId }, { onboardingStatus: "REJECTED", isActive: false });

    await AdminAuditLog.create({
      adminId,
      targetType: "DRIVER_APPLICATION",
      targetId: application._id,
      action: "REJECT_APPLICATION",
      reason,
    });

    // Emit domain event for driver rejection
    const driverUserId = application.userId._id || application.userId;
    notificationEventBus.emit("driver.rejected", {
      driverUserId,
      data: { reason },
    });

    return res.status(200).json({ success: true, message: "Driver application rejected", application });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to reject driver application" });
  }
};

// ─── REQUEST CHANGES / DOCUMENT RE-UPLOAD ─────────────────────────────────────
const requestChangesDriverApplication = async (req, res) => {
  try {
    const { comments } = req.body;
    const adminId = req.user.id;
    if (!comments || !comments.trim()) {
      return res.status(400).json({ success: false, message: "Feedback comments are mandatory when requesting changes" });
    }

    const application = await DriverApplication.findById(req.params.id).populate("userId", "name email");
    if (!application) {
      return res.status(404).json({ success: false, message: "Driver application not found" });
    }

    application.status = "REQUEST_CHANGES";
    application.reviewComments = comments;
    application.timeline.push({
      status: "REQUEST_CHANGES",
      timestamp: new Date(),
      note: `Action required by applicant: ${comments}`,
      performedBy: adminId,
    });
    await application.save();

    await AdminAuditLog.create({
      adminId,
      targetType: "DRIVER_APPLICATION",
      targetId: application._id,
      action: "REQUEST_DOCUMENT_CHANGES",
      reason: comments,
    });

    return res.status(200).json({ success: true, message: "Requested changes sent to applicant", application });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to request changes" });
  }
};

// ─── DRIVER LIFECYCLE MANAGEMENT (Suspend, Reactivate, Soft-Delete) ─────────
const updateDriverLifecycle = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const adminId = req.user.id;
    const driverId = req.params.id;

    if (!["SUSPEND", "REACTIVATE", "DEACTIVATE", "SOFT_DELETE"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid lifecycle action" });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    let auditAction = "";
    if (action === "SUSPEND") {
      driver.onboardingStatus = "SUSPENDED";
      driver.isActive = false;
      driver.isAvailable = false;
      driver.suspendedAt = new Date();
      driver.suspensionReason = reason || "Suspended by Admin";
      auditAction = "SUSPEND_DRIVER";
    } else if (action === "REACTIVATE") {
      driver.onboardingStatus = "APPROVED";
      driver.isActive = true;
      driver.suspendedAt = null;
      driver.suspensionReason = null;
      auditAction = "REACTIVATE_DRIVER";
    } else if (action === "DEACTIVATE") {
      driver.isActive = false;
      driver.isAvailable = false;
      auditAction = "DEACTIVATE_DRIVER";
    } else if (action === "SOFT_DELETE") {
      driver.isDeleted = true;
      driver.deletedAt = new Date();
      driver.isActive = false;
      driver.isAvailable = false;
      auditAction = "SOFT_DELETE_DRIVER";
    }

    await driver.save();

    // Sync DriverApplication status if exists
    await DriverApplication.findOneAndUpdate(
      { userId: driver.userId },
      { status: action === "SUSPEND" ? "SUSPENDED" : action === "SOFT_DELETE" ? "DELETED" : "APPROVED" }
    );

    await AdminAuditLog.create({
      adminId,
      targetType: "DRIVER",
      targetId: driver._id,
      action: auditAction,
      reason: reason || null,
    });

    return res.status(200).json({ success: true, message: `Driver lifecycle updated to ${action}`, driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update driver lifecycle" });
  }
};

// ─── LEGACY APPROVE & REJECT (Backward Compatibility) ─────────────────────────
const approveDriver = async (req, res) => {
  return approveDriverApplication(req, res);
};

const rejectDriver = async (req, res) => {
  return rejectDriverApplication(req, res);
};

const deactivateDriver = async (req, res) => {
  req.body = { action: "DEACTIVATE" };
  req.params.id = req.params.driverId || req.params.id;
  return updateDriverLifecycle(req, res);
};

module.exports = {
  getUsers,
  getDrivers,
  getDriverApplications,
  getDriverApplicationById,
  verifyDocument,
  approveDriverApplication,
  rejectDriverApplication,
  requestChangesDriverApplication,
  updateDriverLifecycle,
  approveDriver,
  rejectDriver,
  deactivateDriver,
};
