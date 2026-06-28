const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const uploadDriverDocs = require("../middlewares/driverUploadMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const {
  submitApplication,
  getApplication,
  onboard,
  getStatus,
  toggleStatus,
  getEarnings,
} = require("../controllers/driverController");
const verifyGuard = require("../middlewares/verifyGuard");

const driverDocFields = uploadDriverDocs.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "licenseFront", maxCount: 1 },
  { name: "licenseBack", maxCount: 1 },
  { name: "vehiclePhoto", maxCount: 1 },
  { name: "rcBook", maxCount: 1 },
  { name: "rc", maxCount: 1 },
  { name: "license", maxCount: 1 },
  { name: "insurance", maxCount: 1 },
  { name: "pollutionCertificate", maxCount: 1 },
  { name: "govtId", maxCount: 1 },
  { name: "selfie", maxCount: 1 },
]);

// GET /api/driver/application — fetch driver application details
router.get("/application", authMiddleware, getApplication);

// POST /api/driver/application — submit / save driver application
router.post("/application", authMiddleware, verifyGuard, driverDocFields, submitApplication);

// POST /api/driver/onboard — legacy route
router.post(
  "/onboard",
  authMiddleware,
  verifyGuard,
  upload.fields([{ name: "license", maxCount: 1 }, { name: "rc", maxCount: 1 }]),
  onboard
);

// GET /api/driver/status — check onboarding status + availability
router.get("/status", authMiddleware, getStatus);

// PATCH /api/driver/status — toggle online/offline
router.patch("/status", authMiddleware, roleMiddleware("DRIVER"), toggleStatus);

// GET /api/driver/earnings
router.get("/earnings", authMiddleware, roleMiddleware("DRIVER"), getEarnings);

module.exports = router;
