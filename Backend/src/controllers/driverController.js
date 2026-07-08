const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const DriverApplication = require("../models/DriverApplication");
const Ride = require("../models/Ride");
const User = require("../models/User");

// Helper function to extract Cloudinary metadata from multer file object
const extractFileMeta = (file) => {
  if (!file) return null;
  return {
    url: file.path || file.secure_url || file.url || "",
    publicId: file.filename || file.public_id || "",
    fileName: file.originalname || "document",
    fileSize: file.size || 0,
    uploadedAt: new Date(),
    verificationStatus: "PENDING",
    reviewNotes: "",
  };
};

// ─── SUBMIT / SAVE APPLICATION ───────────────────────────────────────────────
const submitApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const files = req.files || {};
    const body = req.body || {};

    // Check if an application already exists
    let application = await DriverApplication.findOne({ userId });

    // Prevent submitting multiple applications if already APPROVED or PENDING
    if (application && ["APPROVED", "PENDING", "SUBMITTED"].includes(application.status) && !req.body.isResubmission) {
      return res.status(409).json({
        success: false,
        message: `An application is already ${application.status.toLowerCase()}. Duplicate applications are not allowed.`,
        application,
      });
    }

    // Parse JSON field structures if passed as stringified JSON in FormData
    const personalDetails = typeof body.personalDetails === "string" ? JSON.parse(body.personalDetails) : (body.personalDetails || {});
    const licenseDetails = typeof body.licenseDetails === "string" ? JSON.parse(body.licenseDetails) : (body.licenseDetails || {});
    const vehicleDetails = typeof body.vehicleDetails === "string" ? JSON.parse(body.vehicleDetails) : (body.vehicleDetails || {});
    const bankDetails = typeof body.bankDetails === "string" ? JSON.parse(body.bankDetails) : (body.bankDetails || {});

    // Normalize vehicle type for schema enum
    let normalizedVehicleType = (vehicleDetails.vehicleType || body.vehicleType || "car").toLowerCase();
    if (normalizedVehicleType === "sedan") normalizedVehicleType = "car";
    if (!["bike", "auto", "car", "suv", "economy", "premium"].includes(normalizedVehicleType)) {
      normalizedVehicleType = "car";
    }

    // Construct metadata for files
    const profilePhotoMeta = extractFileMeta(files.profilePhoto?.[0]);
    const licenseFrontMeta = extractFileMeta(files.licenseFront?.[0]);
    const licenseBackMeta = extractFileMeta(files.licenseBack?.[0]);
    const vehiclePhotoMeta = extractFileMeta(files.vehiclePhoto?.[0]);
    const rcBookMeta = extractFileMeta(files.rcBook?.[0] || files.rc?.[0]);
    const insuranceMeta = extractFileMeta(files.insurance?.[0]);
    const pollutionMeta = extractFileMeta(files.pollutionCertificate?.[0]);
    const govtIdMeta = extractFileMeta(files.govtId?.[0]);
    const selfieMeta = extractFileMeta(files.selfie?.[0]);

    // Retrieve User document to get authentic fallbacks for name and email
    const user = await User.findById(userId);

    if (!application) {
      application = new DriverApplication({
        userId,
        status: body.isDraft ? "DRAFT" : "SUBMITTED",
        personalDetails: {
          fullName: personalDetails.fullName || body.name || user?.name || "Driver",
          phone: personalDetails.phone || body.phone || user?.phone || "",
          email: personalDetails.email || body.email || user?.email || "",
          dob: personalDetails.dob ? new Date(personalDetails.dob) : null,
          gender: personalDetails.gender || "other",
          address: personalDetails.address || body.address || "Coimbatore",
          city: personalDetails.city || "Coimbatore",
          state: personalDetails.state || "Tamil Nadu",
          pincode: personalDetails.pincode || "",
          emergencyContact: personalDetails.emergencyContact || "",
          profilePhoto: profilePhotoMeta || {},
        },
        licenseDetails: {
          licenseNumber: licenseDetails.licenseNumber || body.licenseNumber || "LIC-TEMP",
          issueDate: licenseDetails.issueDate ? new Date(licenseDetails.issueDate) : null,
          expiryDate: licenseDetails.expiryDate ? new Date(licenseDetails.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          licenseFront: licenseFrontMeta || extractFileMeta(files.license?.[0]) || {},
          licenseBack: licenseBackMeta || {},
        },
        vehicleDetails: {
          vehicleType: normalizedVehicleType,
          brand: vehicleDetails.brand || "",
          model: vehicleDetails.model || "",
          year: vehicleDetails.year || "",
          number: vehicleDetails.number || body.vehicleNumber || "",
          colour: vehicleDetails.colour || "",
          vehiclePhoto: vehiclePhotoMeta || {},
        },
        documents: {
          rcBook: rcBookMeta || {},
          insurance: insuranceMeta || {},
          pollutionCertificate: pollutionMeta || {},
          govtId: govtIdMeta || {},
          selfie: selfieMeta || {},
        },
        bankDetails: {
          accountHolder: bankDetails.accountHolder || "",
          accountNumber: bankDetails.accountNumber || "",
          ifsc: bankDetails.ifsc || "",
          bankName: bankDetails.bankName || "",
          branch: bankDetails.branch || "",
          upiId: bankDetails.upiId || "",
        },
        timeline: [
          {
            status: body.isDraft ? "DRAFT_SAVED" : "SUBMITTED",
            timestamp: new Date(),
            note: body.isDraft ? "Draft application saved" : "Application submitted for admin review",
            performedBy: userId,
          },
        ],
      });
    } else {
      // Update existing application
      if (!body.isDraft) {
        application.status = "SUBMITTED";
        application.submittedAt = new Date();
      }

      application.personalDetails.fullName = personalDetails.fullName || body.name || application.personalDetails.fullName || user?.name || "Driver";
      application.personalDetails.phone = personalDetails.phone || body.phone || application.personalDetails.phone || user?.phone || "";
      application.personalDetails.email = personalDetails.email || body.email || application.personalDetails.email || user?.email || "";
      application.personalDetails.address = personalDetails.address || body.address || application.personalDetails.address || "Coimbatore";
      if (personalDetails.city) application.personalDetails.city = personalDetails.city;
      if (personalDetails.emergencyContact) application.personalDetails.emergencyContact = personalDetails.emergencyContact;
      if (profilePhotoMeta) application.personalDetails.profilePhoto = profilePhotoMeta;

      application.licenseDetails.licenseNumber = licenseDetails.licenseNumber || body.licenseNumber || application.licenseDetails.licenseNumber || "LIC-TEMP";
      if (licenseDetails.expiryDate) application.licenseDetails.expiryDate = new Date(licenseDetails.expiryDate);
      if (licenseFrontMeta) application.licenseDetails.licenseFront = licenseFrontMeta;
      if (licenseBackMeta) application.licenseDetails.licenseBack = licenseBackMeta;

      application.vehicleDetails.vehicleType = normalizedVehicleType;
      if (vehicleDetails.number || body.vehicleNumber) application.vehicleDetails.number = vehicleDetails.number || body.vehicleNumber;
      if (vehiclePhotoMeta) application.vehicleDetails.vehiclePhoto = vehiclePhotoMeta;

      if (rcBookMeta) application.documents.rcBook = rcBookMeta;
      if (insuranceMeta) application.documents.insurance = insuranceMeta;
      if (pollutionMeta) application.documents.pollutionCertificate = pollutionMeta;
      if (govtIdMeta) application.documents.govtId = govtIdMeta;
      if (selfieMeta) application.documents.selfie = selfieMeta;

      if (bankDetails.accountHolder) application.bankDetails.accountHolder = bankDetails.accountHolder;
      if (bankDetails.accountNumber) application.bankDetails.accountNumber = bankDetails.accountNumber;
      if (bankDetails.ifsc) application.bankDetails.ifsc = bankDetails.ifsc;
      if (bankDetails.upiId) application.bankDetails.upiId = bankDetails.upiId;

      application.timeline.push({
        status: body.isDraft ? "DRAFT_UPDATED" : "RESUBMITTED",
        timestamp: new Date(),
        note: body.isDraft ? "Draft updated" : "Application resubmitted with updated details/documents",
        performedBy: userId,
      });
    }

    await application.save();

    // Also sync/create initial PENDING record in Driver collection for backward compatibility
    let driver = await Driver.findOne({ userId });
    if (!driver) {
      driver = await Driver.create({
        userId,
        name: application.personalDetails.fullName,
        phone: application.personalDetails.phone,
        vehicle: {
          type: application.vehicleDetails.vehicleType,
          number: application.vehicleDetails.number,
        },
        onboardingStatus: "PENDING",
        documents: {
          license: application.licenseDetails.licenseFront?.url || null,
          rc: application.documents.rcBook?.url || null,
        },
      });
    } else {
      driver.onboardingStatus = "PENDING";
      driver.isDeleted = false;
      driver.deletedAt = null;
      await driver.save();
    }

    return res.status(201).json({
      success: true,
      message: body.isDraft ? "Draft saved successfully" : "Driver application submitted successfully for verification.",
      application,
      driverId: driver._id,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET APPLICATION DETAILS ────────────────────────────────────────────────
const getApplication = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const application = await DriverApplication.findOne({ userId });
    const driver = await Driver.findOne({ userId });

    return res.status(200).json({
      success: true,
      application,
      onboardingStatus: driver?.onboardingStatus || application?.status || null,
      isAvailable: driver?.isAvailable || false,
    });
  } catch (err) {
    next(err);
  }
};

// ─── LEGACY ONBOARD (Backward Compatibility) ──────────────────────────────────
const onboard = async (req, res, next) => {
  return submitApplication(req, res, next);
};

// Helper function to audit and ensure driver profile document exists
const ensureDriverProfile = async (userId) => {
  console.log(`[Driver Audit] Auditing Driver profile existence for userId=${userId}`);
  let driver = await Driver.findOne({ userId, isDeleted: false });
  
  if (driver) {
    console.log(`[Driver Audit] Driver profile found: ID=${driver._id}, status=${driver.onboardingStatus}`);
    return driver;
  }

  // Look for any driver profile even if soft-deleted
  const deletedDriver = await Driver.findOne({ userId, isDeleted: true });
  if (deletedDriver) {
    console.log(`[Driver Audit] Soft-deleted Driver profile found: ID=${deletedDriver._id}. Restoring it...`);
    deletedDriver.isDeleted = false;
    deletedDriver.deletedAt = null;
    deletedDriver.onboardingStatus = "APPROVED";
    await deletedDriver.save();
    return deletedDriver;
  }

  // Look for an approved application
  console.log(`[Driver Audit] Driver profile missing. Checking approved DriverApplication for userId=${userId}`);
  const application = await DriverApplication.findOne({ userId, status: "APPROVED" });
  if (application) {
    console.log(`[Driver Audit] Approved DriverApplication found (ID=${application._id}). Auto-recreating Driver profile...`);
    driver = await Driver.create({
      userId,
      name: application.personalDetails?.fullName || "Driver",
      phone: application.personalDetails?.phone || "0000000000",
      vehicle: {
        type: application.vehicleDetails?.vehicleType || "car",
        number: application.vehicleDetails?.number || "UNKNOWN",
      },
      onboardingStatus: "APPROVED",
      isActive: true,
      documents: {
        license: application.licenseDetails?.licenseFront?.url || null,
        rc: application.documents?.rcBook?.url || null,
      },
    });
    console.log(`[Driver Audit] Driver profile successfully recreated: ID=${driver._id}`);
    return driver;
  }

  console.warn(`[Driver Audit] Driver profile missing and no approved DriverApplication exists for userId=${userId}`);
  return null;
};

// ─── GET STATUS ───────────────────────────────────────────────────────────────
const getStatus = async (req, res, next) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const dbName = mongoose.connection.name;

  console.log(`[Driver GetStatus] Route matched: GET /api/driver/status | User=${userId} | Role=${role} | DB=${dbName}`);

  try {
    // 1. Audit and ensure driver profile document exists if user role is DRIVER
    let driver = null;
    if (role === "DRIVER") {
      driver = await ensureDriverProfile(userId);
    } else {
      driver = await Driver.findOne({ userId, isDeleted: false });
    }

    // 2. Fetch DriverApplication status
    console.log(`[Driver GetStatus] Querying DriverApplication collection for userId=${userId}`);
    const application = await DriverApplication.findOne({ userId });
    console.log(`[Driver GetStatus] Application query result:`, application ? { id: application._id, status: application.status } : "NULL");

    // 3. Structured Business Errors based on User Role, Driver Profile, and Application status
    if (!driver) {
      if (application) {
        if (application.status === "REJECTED") {
          console.warn(`[Driver GetStatus] 403 Forbidden: Driver application has been rejected for userId=${userId}`);
          return res.status(403).json({
            success: false,
            code: "ONBOARDING_REJECTED",
            message: "Your driver application was rejected."
          });
        }
        if (["PENDING", "SUBMITTED", "REQUEST_CHANGES"].includes(application.status)) {
          console.log(`[Driver GetStatus] 200 OK: Driver application is pending approval (status=${application.status}) for userId=${userId}`);
          return res.status(200).json({
            success: true,
            onboardingStatus: application.status,
            isAvailable: false,
            isActive: false,
            currentRideId: null,
            application
          });
        }
      }

      console.warn(`[Driver GetStatus] 404: Missing profile and no active onboarding application for userId=${userId}`);
      return res.status(404).json({
        success: false,
        code: "DRIVER_PROFILE_MISSING",
        message: "Driver profile not found.",
        onboardingStatus: null
      });
    }

    const responseData = {
      success: true,
      onboardingStatus: driver.onboardingStatus,
      isAvailable: driver.isAvailable,
      isActive: driver.isActive,
      currentRideId: driver.currentRideId || null,
      application,
    };

    console.log(`[Driver GetStatus] Responding 200: onboardingStatus=${responseData.onboardingStatus}, isAvailable=${responseData.isAvailable}`);
    return res.status(200).json(responseData);
  } catch (err) {
    console.error(`[Driver GetStatus] FAILED for userId=${userId}:`, err);
    next(err);
  }
};

// ─── TOGGLE STATUS ───────────────────────────────────────────────────────────
const toggleStatus = async (req, res, next) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { isOnline } = req.body;
  const dbName = mongoose.connection.name;

  console.log(`[Driver ToggleStatus] Route matched: PATCH /api/driver/status | User=${userId} | Role=${role} | Body=`, req.body);

  try {
    if (typeof isOnline !== "boolean") {
      console.warn(`[Driver ToggleStatus] 400 Bad Request: isOnline is not a boolean (${typeof isOnline})`);
      return res.status(400).json({ success: false, message: "isOnline must be a boolean" });
    }

    // 1. Audit and ensure driver profile document exists
    let driver = await ensureDriverProfile(userId);
    
    if (!driver) {
      const application = await DriverApplication.findOne({ userId });
      
      if (application) {
        if (application.status === "REJECTED") {
          console.warn(`[Driver ToggleStatus] 403 Forbidden: Cannot toggle status. Application is rejected for userId=${userId}`);
          return res.status(403).json({
            success: false,
            code: "ONBOARDING_REJECTED",
            message: "Your driver application was rejected."
          });
        }
        if (["PENDING", "SUBMITTED", "REQUEST_CHANGES"].includes(application.status)) {
          console.warn(`[Driver ToggleStatus] 403 Forbidden: Cannot toggle status. Application is pending approval for userId=${userId}`);
          return res.status(403).json({
            success: false,
            code: "ONBOARDING_PENDING",
            message: "Driver not approved yet. Please wait for admin approval."
          });
        }
      }

      console.warn(`[Driver ToggleStatus] 404: Driver profile missing and cannot be recreated for userId=${userId}`);
      return res.status(404).json({
        success: false,
        code: "DRIVER_PROFILE_MISSING",
        message: "Driver profile not found."
      });
    }

    console.log(`[Driver ToggleStatus] Found Driver profile ID=${driver._id}, onboardingStatus=${driver.onboardingStatus}`);

    if (driver.onboardingStatus !== "APPROVED") {
      console.warn(`[Driver ToggleStatus] 403 Forbidden: Driver is not approved (status=${driver.onboardingStatus})`);
      return res.status(403).json({ success: false, message: "Driver not approved yet. Please wait for admin approval." });
    }

    const previousStatus = driver.isAvailable;
    driver.isAvailable = isOnline;
    
    console.log(`[Driver ToggleStatus] Saving updated driver availability state from ${previousStatus} to ${isOnline}`);
    await driver.save();
    console.log(`[Driver ToggleStatus] Driver ID=${driver._id} successfully saved. New availability: ${driver.isAvailable}`);

    return res.status(200).json({
      success: true,
      message: `You are now ${isOnline ? "online" : "offline"}`,
      isAvailable: driver.isAvailable,
    });
  } catch (err) {
    console.error(`[Driver ToggleStatus] FAILED for userId=${userId}:`, err);
    next(err);
  }
};

// ─── GET EARNINGS ─────────────────────────────────────────────────────────────
const getEarnings = async (req, res, next) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.id, isDeleted: false });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver profile not found" });
    }

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
      rating: driver.earnings?.rating || 5.0,
      acceptanceRate: driver.earnings?.acceptanceRate || 100,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitApplication,
  getApplication,
  onboard,
  getStatus,
  toggleStatus,
  getEarnings,
};
