const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
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
} = require("../controllers/admin");

// All admin routes strictly require AUTH + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

// Core Data Routes
router.get("/users", getUsers);
router.get("/drivers", getDrivers);

// Driver Applications Module Routes
router.get("/driver-applications", getDriverApplications);
router.get("/driver-applications/:id", getDriverApplicationById);
router.post("/driver-applications/:id/verify-document", verifyDocument);
router.post("/driver-applications/:id/approve", approveDriverApplication);
router.post("/driver-applications/:id/reject", rejectDriverApplication);
router.post("/driver-applications/:id/request-changes", requestChangesDriverApplication);

// Driver Lifecycle Route
router.patch("/drivers/:id/lifecycle", updateDriverLifecycle);

// Legacy routes for backward compatibility
router.post("/drivers/:id/approve", approveDriver);
router.post("/drivers/:id/reject", rejectDriver);
router.post("/deactivate-driver/:driverId", deactivateDriver);

module.exports = router;
