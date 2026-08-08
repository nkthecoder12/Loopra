const mongoose = require("mongoose");
const Fleet = require("../models/Fleet");
const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const Ride = require("../models/Ride");
const User = require("../models/User");
const FleetAuditLog = require("../models/FleetAuditLog");
const Rating = require("../models/Rating");
const Tracking = require("../models/Tracking");
const { RIDE_STATUS } = require("../utils/constants");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Helper to log operator actions
const logAction = async (operatorId, fleetId, action, targetType, targetId, reason = null, metadata = {}) => {
  try {
    await FleetAuditLog.create({
      operatorId,
      fleetId,
      action,
      targetType,
      targetId,
      reason,
      metadata
    });
  } catch (err) {
    console.error("[logAction Error]:", err.message);
  }
};

// ─── DASHBOARD METRICS ────────────────────────────────────────────────────────
const getDashboard = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Run aggregations and queries in parallel
    const [
      driversMetrics,
      vehiclesMetrics,
      activeRidesCount,
      scheduledRidesCount,
      completedRidesToday,
      cancelledRidesToday,
      revenueStats
    ] = await Promise.all([
      // Drivers metrics
      Driver.aggregate([
        { $match: { fleetId: new mongoose.Types.ObjectId(fleetId), isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            online: { $sum: { $cond: [{ $eq: ["$isAvailable", true] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ["$onboardingStatus", "PENDING"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$onboardingStatus", "SUSPENDED"] }, 1, 0] } }
          }
        }
      ]),
      // Vehicles metrics
      Vehicle.aggregate([
        { $match: { fleetId: new mongoose.Types.ObjectId(fleetId), isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            available: { $sum: { $cond: [{ $eq: ["$status", "AVAILABLE"] }, 1, 0] } },
            inRide: { $sum: { $cond: [{ $eq: ["$status", "IN_RIDE"] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ["$status", "MAINTENANCE"] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ["$status", "SUSPENDED"] }, 1, 0] } },
            nonCompliant: { $sum: { $cond: [{ $eq: ["$compliance.isCompliant", false] }, 1, 0] } }
          }
        }
      ]),
      // Active rides (Instant & Scheduled currently in progress)
      Ride.countDocuments({
        fleetId,
        status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] }
      }),
      // Scheduled upcoming rides
      Ride.countDocuments({
        fleetId,
        type: "SCHEDULED",
        status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED] },
        scheduledAt: { $gte: new Date() }
      }),
      // Rides completed today
      Ride.countDocuments({
        fleetId,
        status: RIDE_STATUS.COMPLETED,
        completedAt: { $gte: today }
      }),
      // Rides cancelled today
      Ride.countDocuments({
        fleetId,
        status: RIDE_STATUS.CANCELLED,
        updatedAt: { $gte: today }
      }),
      // Revenue aggregation
      Ride.aggregate([
        {
          $match: {
            fleetId: new mongoose.Types.ObjectId(fleetId),
            status: RIDE_STATUS.COMPLETED,
            completedAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            todayRevenue: {
              $sum: { $cond: [{ $gte: ["$completedAt", today] }, "$finalFare", 0] }
            },
            weekRevenue: {
              $sum: { $cond: [{ $gte: ["$completedAt", startOfWeek] }, "$finalFare", 0] }
            },
            monthRevenue: {
              $sum: "$finalFare"
            }
          }
        }
      ])
    ]);

    const dm = driversMetrics[0] || { total: 0, online: 0, pending: 0, suspended: 0 };
    const vm = vehiclesMetrics[0] || { total: 0, available: 0, inRide: 0, maintenance: 0, suspended: 0, nonCompliant: 0 };
    const rev = revenueStats[0] || { todayRevenue: 0, weekRevenue: 0, monthRevenue: 0 };

    return res.status(200).json({
      success: true,
      data: {
        drivers: {
          total: dm.total,
          online: dm.online,
          offline: dm.total - dm.online,
          pending: dm.pending,
          suspended: dm.suspended
        },
        vehicles: {
          total: vm.total,
          available: vm.available,
          inRide: vm.inRide,
          maintenance: vm.maintenance,
          suspended: vm.suspended,
          nonCompliant: vm.nonCompliant
        },
        rides: {
          active: activeRidesCount,
          scheduled: scheduledRidesCount,
          completedToday,
          cancelledToday
        },
        revenue: {
          today: rev.todayRevenue,
          weekly: rev.weekRevenue,
          monthly: rev.monthRevenue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── DRIVER MANAGEMENT ────────────────────────────────────────────────────────
const getDrivers = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { fleetId, isDeleted: false };

  if (status) {
    if (status === "online") {
      query.isAvailable = true;
    } else if (status === "offline") {
      query.isAvailable = false;
    } else {
      query.onboardingStatus = status.toUpperCase();
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { "vehicle.number": { $regex: search, $options: "i" } }
    ];
  }

  try {
    const [drivers, total] = await Promise.all([
      Driver.find(query)
        .populate("userId", "email profileImage isVerified")
        .populate("vehicleId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Driver.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        drivers,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDriverById = async (req, res, next) => {
  const fleetId = req.fleetId;
  try {
    const driver = await Driver.findOne({ _id: req.params.id, fleetId, isDeleted: false })
      .populate("userId", "email profileImage isVerified")
      .populate("vehicleId");

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    // Fetch rides count, earnings, ratings history
    const [rides, ratingStats] = await Promise.all([
      Ride.find({ driverId: driver._id, status: RIDE_STATUS.COMPLETED })
        .sort({ completedAt: -1 })
        .limit(10)
        .populate("userId", "name"),
      Rating.aggregate([
        { $match: { driverId: driver._id, ratedBy: "USER" } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 }
          }
        }
      ])
    ]);

    return res.status(200).json({
      success: true,
      driver,
      ridesHistory: rides,
      ratings: ratingStats[0] || { avgRating: 5.0, totalRatings: 0 }
    });
  } catch (error) {
    next(error);
  }
};

const createDriver = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { name, email, phone, password, vehicleType, vehicleNumber } = req.body;

  if (!name || !email || !phone || !password || !vehicleType || !vehicleNumber) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const session = await mongoose.startSession();
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    const existingUser = useTransaction
      ? await User.findOne({ email: normalizedEmail }).session(session)
      : await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserArray = useTransaction
      ? await User.create([
          {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "DRIVER",
            isVerified: true,
            fleetId
          }
        ], { session })
      : await User.create([
          {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "DRIVER",
            isVerified: true,
            fleetId
          }
        ]);

    const newUser = newUserArray[0];

    const newDriverArray = useTransaction
      ? await Driver.create([
          {
            name: name.trim(),
            phone: phone.trim(),
            userId: newUser._id,
            fleetId,
            onboardingStatus: "APPROVED", // Auto-approved under fleet setup
            vehicle: {
              type: vehicleType.toLowerCase(),
              number: vehicleNumber.toUpperCase().trim()
            }
          }
        ], { session })
      : await Driver.create([
          {
            name: name.trim(),
            phone: phone.trim(),
            userId: newUser._id,
            fleetId,
            onboardingStatus: "APPROVED",
            vehicle: {
              type: vehicleType.toLowerCase(),
              number: vehicleNumber.toUpperCase().trim()
            }
          }
        ]);

    const newDriver = newDriverArray[0];

    if (useTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    await logAction(req.user.id, fleetId, "CREATE_DRIVER", "Driver", newDriver._id, "Driver onboarded successfully");

    return res.status(201).json({
      success: true,
      message: "Driver onboarded successfully",
      driver: newDriver
    });
  } catch (error) {
    if (useTransaction) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    session.endSession();
    next(error);
  }
};

const updateDriverStatus = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { onboardingStatus, reason } = req.body;

  if (!onboardingStatus || !["APPROVED", "SUSPENDED", "INACTIVE"].includes(onboardingStatus)) {
    return res.status(400).json({ success: false, message: "Invalid status parameter" });
  }

  try {
    const driver = await Driver.findOneAndUpdate(
      { _id: req.params.id, fleetId, isDeleted: false },
      { $set: { onboardingStatus, isAvailable: onboardingStatus === "APPROVED" ? undefined : false } }, // Auto-offline if suspended/inactive
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    await logAction(req.user.id, fleetId, `${onboardingStatus}_DRIVER`, "Driver", driver._id, reason);

    return res.status(200).json({
      success: true,
      message: `Driver status configured to ${onboardingStatus}`,
      driver
    });
  } catch (error) {
    next(error);
  }
};

// ─── VEHICLE MANAGEMENT ───────────────────────────────────────────────────────
const getVehicles = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { fleetId, isDeleted: false };

  if (status) {
    query.status = status.toUpperCase();
  }

  if (search) {
    query.$or = [
      { registrationNumber: { $regex: search, $options: "i" } },
      { model: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } }
    ];
  }

  try {
    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate("assignedDriverId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Vehicle.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        vehicles,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleById = async (req, res, next) => {
  const fleetId = req.fleetId;
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, fleetId, isDeleted: false })
      .populate("assignedDriverId");

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // Historical rides completed using this vehicle
    const ridesHistory = await Ride.find({ vehicleId: vehicle._id, status: RIDE_STATUS.COMPLETED })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate("driverId", "name phone")
      .populate("userId", "name");

    return res.status(200).json({
      success: true,
      vehicle,
      ridesHistory
    });
  } catch (error) {
    next(error);
  }
};

const createVehicle = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { registrationNumber, type, model, documentUrls, complianceExpirations } = req.body;

  if (!registrationNumber || !type || !model) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }

  try {
    // Unique check
    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Vehicle registration already exists" });
    }

    // Process dates
    const expirations = complianceExpirations || {};
    const insExp = expirations.insurance ? new Date(expirations.insurance) : null;
    const permExp = expirations.permit ? new Date(expirations.permit) : null;
    const fitExp = expirations.fitness ? new Date(expirations.fitness) : null;

    const now = new Date();
    const isCompliant = (!insExp || insExp > now) && (!permExp || permExp > now) && (!fitExp || fitExp > now);

    const newVehicle = await Vehicle.create({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      type: type.toLowerCase(),
      model,
      fleetId,
      status: "AVAILABLE",
      documents: documentUrls || {},
      compliance: {
        isCompliant,
        expirationDates: {
          insurance: insExp,
          permit: permExp,
          fitness: fitExp
        }
      }
    });

    await logAction(req.user.id, fleetId, "CREATE_VEHICLE", "Vehicle", newVehicle._id, "Added vehicle to fleet");

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle: newVehicle
    });
  } catch (error) {
    next(error);
  }
};

const updateVehicle = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { model, documentUrls, complianceExpirations, status } = req.body;

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, fleetId, isDeleted: false });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    if (model) vehicle.model = model;
    if (status) vehicle.status = status;
    if (documentUrls) vehicle.documents = { ...vehicle.documents, ...documentUrls };

    if (complianceExpirations) {
      const insExp = complianceExpirations.insurance ? new Date(complianceExpirations.insurance) : vehicle.compliance.expirationDates.insurance;
      const permExp = complianceExpirations.permit ? new Date(complianceExpirations.permit) : vehicle.compliance.expirationDates.permit;
      const fitExp = complianceExpirations.fitness ? new Date(complianceExpirations.fitness) : vehicle.compliance.expirationDates.fitness;

      const now = new Date();
      const isCompliant = (!insExp || insExp > now) && (!permExp || permExp > now) && (!fitExp || fitExp > now);

      vehicle.compliance = {
        isCompliant,
        expirationDates: {
          insurance: insExp,
          permit: permExp,
          fitness: fitExp
        }
      };
    }

    await vehicle.save();
    await logAction(req.user.id, fleetId, "UPDATE_VEHICLE", "Vehicle", vehicle._id, "Updated vehicle parameters");

    return res.status(200).json({ success: true, message: "Vehicle updated successfully", vehicle });
  } catch (error) {
    next(error);
  }
};

const softDeleteVehicle = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, fleetId, isDeleted: false });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    // Unassign driver first if currently linked
    if (vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { $set: { vehicleId: null } });
    }

    vehicle.isDeleted = true;
    vehicle.deletedAt = new Date();
    vehicle.status = "INACTIVE";
    vehicle.assignedDriverId = null;
    await vehicle.save();

    await logAction(req.user.id, fleetId, "DELETE_VEHICLE", "Vehicle", vehicle._id, "Vehicle soft deleted");

    return res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const assignDriverToVehicle = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { driverId } = req.body; // pass driverId = null to unassign

  const session = await mongoose.startSession();
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    const vehicle = useTransaction
      ? await Vehicle.findOne({ _id: req.params.id, fleetId, isDeleted: false }).session(session)
      : await Vehicle.findOne({ _id: req.params.id, fleetId, isDeleted: false });

    if (!vehicle) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const previousDriverId = vehicle.assignedDriverId;

    if (driverId) {
      // 1. Verify driver belongs to same fleet
      const driver = useTransaction
        ? await Driver.findOne({ _id: driverId, fleetId, isDeleted: false }).session(session)
        : await Driver.findOne({ _id: driverId, fleetId, isDeleted: false });

      if (!driver) {
        if (useTransaction) await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Driver not found in this fleet" });
      }

      // 2. Unlink driver's previous vehicle if exists
      if (driver.vehicleId) {
        if (useTransaction) {
          await Vehicle.findByIdAndUpdate(driver.vehicleId, { $set: { assignedDriverId: null } }).session(session);
        } else {
          await Vehicle.findByIdAndUpdate(driver.vehicleId, { $set: { assignedDriverId: null } });
        }
      }

      // 3. Unlink vehicle's previous driver if exists
      if (previousDriverId) {
        if (useTransaction) {
          await Driver.findByIdAndUpdate(previousDriverId, { $set: { vehicleId: null } }).session(session);
        } else {
          await Driver.findByIdAndUpdate(previousDriverId, { $set: { vehicleId: null } });
        }
      }

      // 4. Set links
      vehicle.assignedDriverId = driver._id;
      await vehicle.save({ session });

      driver.vehicleId = vehicle._id;
      // Sync vehicle details back to driver object for backward compatibility with mobile apps
      driver.vehicle = {
        type: vehicle.type,
        number: vehicle.registrationNumber
      };
      await driver.save({ session });

    } else {
      // Unassigning
      if (previousDriverId) {
        if (useTransaction) {
          await Driver.findByIdAndUpdate(previousDriverId, { $set: { vehicleId: null } }).session(session);
        } else {
          await Driver.findByIdAndUpdate(previousDriverId, { $set: { vehicleId: null } });
        }
      }

      vehicle.assignedDriverId = null;
      await vehicle.save({ session });
    }

    if (useTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    await logAction(req.user.id, fleetId, "ASSIGN_DRIVER_VEHICLE", "Vehicle", vehicle._id, `Assigned driver ${driverId || "None"}`);

    return res.status(200).json({ success: true, message: "Vehicle driver assignment updated successfully" });
  } catch (error) {
    if (useTransaction) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    session.endSession();
    next(error);
  }
};

// ─── RIDE MANAGEMENT ──────────────────────────────────────────────────────────
const getRides = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { page = 1, limit = 20, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = { fleetId };

  if (status) {
    query.status = status.toUpperCase();
  }

  if (search) {
    // Resolve user IDs matching name to support lookup
    const users = await User.find({ name: { $regex: search, $options: "i" } }).select("_id");
    const userIds = users.map(u => u._id);
    query.$or = [
      { userId: { $in: userIds } },
      { _id: mongoose.Types.ObjectId.isValid(search) ? search : undefined }
    ].filter(Boolean);
  }

  try {
    const [rides, total] = await Promise.all([
      Ride.find(query)
        .populate("userId", "name email")
        .populate("driverId", "name phone vehicle")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ride.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        rides,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRideById = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    const ride = await Ride.findOne({ _id: req.params.id, fleetId })
      .populate("userId", "name email")
      .populate("driverId")
      .populate("vehicleId");

    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    // Route tracking points
    const pathPoints = await Tracking.find({ rideId: ride._id })
      .sort({ recordedAt: 1 })
      .select("location recordedAt");

    const path = pathPoints.map(p => ({
      longitude: p.location.coordinates[0],
      latitude: p.location.coordinates[1],
      recordedAt: p.recordedAt
    }));

    return res.status(200).json({ success: true, ride, path });
  } catch (error) {
    next(error);
  }
};

// ─── SCHEDULE & ASSIGNMENT ────────────────────────────────────────────────────
const getSchedule = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    // Get scheduled rides for next 7 days
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 7);

    const query = {
      fleetId,
      type: "SCHEDULED",
      status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED] },
      scheduledAt: { $gte: now, $lte: futureDate }
    };

    const rides = await Ride.find(query)
      .populate("userId", "name email")
      .populate("driverId")
      .sort({ scheduledAt: 1 });

    // Conflict detection and recommendations block
    const conflictChecks = await Promise.all(
      rides.map(async (ride) => {
        if (!ride.driverId) return { rideId: ride._id, hasConflict: false, reason: "No driver assigned" };

        const threshold = 1.5 * 60 * 60 * 1000; // 1.5 hours gap
        const lowerBound = new Date(ride.scheduledAt.getTime() - threshold);
        const upperBound = new Date(ride.scheduledAt.getTime() + threshold);

        const overlappingRide = await Ride.findOne({
          driverId: ride.driverId._id,
          _id: { $ne: ride._id },
          status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] },
          scheduledAt: { $gte: lowerBound, $lte: upperBound }
        });

        return {
          rideId: ride._id,
          hasConflict: !!overlappingRide,
          reason: overlappingRide ? `Overlaps with ride ${overlappingRide._id} scheduled at ${overlappingRide.scheduledAt.toLocaleTimeString()}` : ""
        };
      })
    );

    const conflictsMap = conflictChecks.reduce((map, item) => {
      map[item.rideId.toString()] = { hasConflict: item.hasConflict, reason: item.reason };
      return map;
    }, {});

    return res.status(200).json({ success: true, rides, conflicts: conflictsMap });
  } catch (error) {
    next(error);
  }
};

const assignDriverToScheduledRide = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { rideId } = req.params;
  const { driverId } = req.body;

  if (!driverId) {
    return res.status(400).json({ success: false, message: "Driver ID is required" });
  }

  const session = await mongoose.startSession();
  const useTransaction = ["ReplicaSetWithPrimary", "ReplicaSetNoPrimary", "Sharded"].includes(
    mongoose.connection?.client?.topology?.description?.type
  );
  if (useTransaction) {
    session.startTransaction();
  }

  try {
    const ride = useTransaction
      ? await Ride.findOne({ _id: rideId, fleetId }).session(session)
      : await Ride.findOne({ _id: rideId, fleetId });

    if (!ride) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.type !== "SCHEDULED" || ride.status === RIDE_STATUS.COMPLETED) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Ride is not in a schedulable state" });
    }

    // 1. Verify driver belongs to this fleet and is approved
    const driver = useTransaction
      ? await Driver.findOne({ _id: driverId, fleetId, onboardingStatus: "APPROVED", isDeleted: false }).session(session)
      : await Driver.findOne({ _id: driverId, fleetId, onboardingStatus: "APPROVED", isDeleted: false });

    if (!driver) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Eligible fleet driver not found" });
    }

    // 2. Strict Conflict Check (No Force Override)
    const threshold = 1.5 * 60 * 60 * 1000; // 1.5 Hours
    const lowerBound = new Date(ride.scheduledAt.getTime() - threshold);
    const upperBound = new Date(ride.scheduledAt.getTime() + threshold);

    const overlappingRide = useTransaction
      ? await Ride.findOne({
          driverId: driver._id,
          status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] },
          scheduledAt: { $gte: lowerBound, $lte: upperBound }
        }).session(session)
      : await Ride.findOne({
          driverId: driver._id,
          status: { $in: [RIDE_STATUS.REQUESTED, RIDE_STATUS.DRIVER_ASSIGNED, RIDE_STATUS.ONGOING] },
          scheduledAt: { $gte: lowerBound, $lte: upperBound }
        });

    if (overlappingRide) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: `Conflict detected: Driver has another assignment scheduled within 1.5 hours gap. (Ride ID: ${overlappingRide._id})`
      });
    }

    // 3. Assign Driver
    ride.driverId = driver._id;
    ride.status = RIDE_STATUS.DRIVER_ASSIGNED;
    ride.assignmentStage = "ASSIGNED";
    
    // Associate active vehicle
    if (driver.vehicleId) {
      ride.vehicleId = driver.vehicleId;
    }
    await ride.save({ session });

    // Update Driver reserved ID
    driver.reservedRideId = ride._id;
    await driver.save({ session });

    if (useTransaction) {
      await session.commitTransaction();
    }
    session.endSession();

    // Trigger Socket notification
    const io = req.app.get("io");
    if (io) {
      io.to(`driver_${driver.userId.toString()}`).emit("advance-ride-assigned", {
        rideId: ride._id,
        scheduledAt: ride.scheduledAt,
        pickupLocation: ride.pickupLocation,
        dropLocation: ride.dropLocation
      });
    }

    await logAction(req.user.id, fleetId, "ASSIGN_SCHEDULED_RIDE", "Ride", ride._id, `Assigned to driver ${driver.name}`);

    return res.status(200).json({ success: true, message: "Driver assigned successfully", ride });
  } catch (error) {
    if (useTransaction) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    session.endSession();
    next(error);
  }
};

// ─── EARNINGS & ANALYTICS ─────────────────────────────────────────────────────
const getEarnings = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { dateRange = "monthly" } = req.query;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startRange = new Date();
    if (dateRange === "today") {
      startRange = today;
    } else if (dateRange === "weekly") {
      startRange.setDate(today.getDate() - 7);
    } else {
      startRange.setDate(today.getDate() - 30); // Monthly defaults
    }

    const completedRides = await Ride.find({
      fleetId,
      status: RIDE_STATUS.COMPLETED,
      completedAt: { $gte: startRange }
    }).select("finalFare completedAt type");

    const refundedRides = await Ride.find({
      fleetId,
      paymentStatus: "REFUNDED",
      updatedAt: { $gte: startRange }
    }).select("advancePaymentAmount updatedAt");

    const grossRevenue = completedRides.reduce((sum, r) => sum + (r.finalFare || 0), 0);
    const refundsPaid = refundedRides.reduce((sum, r) => sum + (r.advancePaymentAmount || 0), 0);

    // Dynamic daily mapping for charts
    const dailyRevenues = {};
    completedRides.forEach(r => {
      const dateKey = r.completedAt.toISOString().split("T")[0];
      dailyRevenues[dateKey] = (dailyRevenues[dateKey] || 0) + r.finalFare;
    });

    const revenueChart = Object.keys(dailyRevenues).map(date => ({
      date,
      revenue: dailyRevenues[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({
      success: true,
      metrics: {
        grossRevenue,
        refundsPaid,
        netRevenue: grossRevenue - refundsPaid,
        completedTrips: completedRides.length,
        refundedTrips: refundedRides.length
      },
      chartData: revenueChart
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    // 1. Vehicle Utilization rate: (IN_RIDE / Total AVAILABLE/IN_RIDE)
    const totalActiveVehicles = await Vehicle.countDocuments({ fleetId, status: { $in: ["AVAILABLE", "IN_RIDE"] }, isDeleted: false });
    const vehiclesInRide = await Vehicle.countDocuments({ fleetId, status: "IN_RIDE", isDeleted: false });
    const utilizationRate = totalActiveVehicles > 0 ? Math.round((vehiclesInRide / totalActiveVehicles) * 100) : 0;

    // 2. Cancellation vs Completion aggregates
    const totalRides = await Ride.countDocuments({ fleetId });
    const completedRides = await Ride.countDocuments({ fleetId, status: RIDE_STATUS.COMPLETED });
    const cancelledRides = await Ride.countDocuments({ fleetId, status: RIDE_STATUS.CANCELLED });
    const failedRides = await Ride.countDocuments({ fleetId, status: RIDE_STATUS.FAILED });

    return res.status(200).json({
      success: true,
      data: {
        utilizationRate,
        rideDistribution: {
          total: totalRides,
          completed: completedRides,
          cancelled: cancelledRides,
          failed: failedRides
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── COMPLIANCE CENTER ────────────────────────────────────────────────────────
const getCompliance = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    const now = new Date();
    const expiringThreshold = new Date();
    expiringThreshold.setDate(now.getDate() + 30); // 30 days buffer

    const vehicles = await Vehicle.find({ fleetId, isDeleted: false });

    const report = {
      compliant: [],
      expiringSoon: [],
      expired: []
    };

    vehicles.forEach(v => {
      const dates = v.compliance.expirationDates || {};
      const expiredDocs = [];
      const expiringDocs = [];

      Object.keys(dates).forEach(docKey => {
        const expDate = dates[docKey];
        if (expDate) {
          if (expDate < now) {
            expiredDocs.push(docKey);
          } else if (expDate < expiringThreshold) {
            expiringDocs.push(docKey);
          }
        }
      });

      const entry = {
        vehicleId: v._id,
        registration: v.registrationNumber,
        model: v.model,
        expiredDocs,
        expiringDocs
      };

      if (expiredDocs.length > 0) {
        report.expired.push(entry);
      } else if (expiringDocs.length > 0) {
        report.expiringSoon.push(entry);
      } else {
        report.compliant.push({
          vehicleId: v._id,
          registration: v.registrationNumber,
          model: v.model
        });
      }
    });

    return res.status(200).json({ success: true, compliance: report });
  } catch (error) {
    next(error);
  }
};

// ─── NOTIFICATIONS & ALERTS ───────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  const fleetId = req.fleetId;

  try {
    // Generate warnings dynamically from database states for dashboards
    const alerts = [];

    // Expired compliance items
    const now = new Date();
    const expiredVehicles = await Vehicle.find({
      fleetId,
      isDeleted: false,
      $or: [
        { "compliance.expirationDates.insurance": { $lt: now } },
        { "compliance.expirationDates.permit": { $lt: now } },
        { "compliance.expirationDates.fitness": { $lt: now } }
      ]
    });

    expiredVehicles.forEach(v => {
      alerts.push({
        severity: "HIGH",
        entity: "VEHICLE",
        entityId: v._id,
        reason: `Compliance documents expired for vehicle ${v.registrationNumber}.`,
        timestamp: new Date()
      });
    });

    // Unassigned scheduled rides coming within 12 hours
    const threshold12h = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const pendingSchedules = await Ride.find({
      fleetId,
      type: "SCHEDULED",
      status: RIDE_STATUS.REQUESTED,
      scheduledAt: { $gte: now, $lte: threshold12h }
    });

    pendingSchedules.forEach(s => {
      alerts.push({
        severity: "CRITICAL",
        entity: "RIDE",
        entityId: s._id,
        reason: `Scheduled ride starting in less than 12 hours has no driver assigned!`,
        timestamp: s.createdAt
      });
    });

    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    next(error);
  }
};

// ─── OPERATOR AUDIT LOGS ───────────────────────────────────────────────────────
const getActivityLogs = async (req, res, next) => {
  const fleetId = req.fleetId;
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [logs, total] = await Promise.all([
      FleetAuditLog.find({ fleetId })
        .populate("operatorId", "name email")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      FleetAuditLog.countDocuments({ fleetId })
    ]);

    return res.status(200).json({
      success: true,
      logs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getDrivers,
  getDriverById,
  createDriver,
  updateDriverStatus,
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  softDeleteVehicle,
  assignDriverToVehicle,
  getRides,
  getRideById,
  getSchedule,
  assignDriverToScheduledRide,
  getEarnings,
  getAnalytics,
  getCompliance,
  getNotifications,
  getActivityLogs
};
