const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const fleetAuthMiddleware = require("../middlewares/fleetAuthMiddleware");
const {
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
} = require("../controllers/fleetController");

// Secure all fleet routes with authentication + FLEET_OPERATOR validation
router.use(authMiddleware, fleetAuthMiddleware);

// Dashboard
router.get("/dashboard", getDashboard);

// Drivers
router.get("/drivers", getDrivers);
router.post("/drivers", createDriver);
router.get("/drivers/:id", getDriverById);
router.patch("/drivers/:id/status", updateDriverStatus);

// Vehicles
router.get("/vehicles", getVehicles);
router.post("/vehicles", createVehicle);
router.get("/vehicles/:id", getVehicleById);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", softDeleteVehicle);
router.patch("/vehicles/:id/driver", assignDriverToVehicle);

// Rides
router.get("/rides", getRides);
router.get("/rides/:id", getRideById);

// Schedule
router.get("/schedule", getSchedule);
router.post("/rides/:id/assign", assignDriverToScheduledRide);

// Analytics
router.get("/earnings", getEarnings);
router.get("/analytics", getAnalytics);

// Compliance & Warnings
router.get("/compliance", getCompliance);
router.get("/notifications", getNotifications);

// Audit logs
router.get("/activity", getActivityLogs);

module.exports = router;
