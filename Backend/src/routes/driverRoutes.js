const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const upload = require("../middlewares/uploadMiddleware");
const { onboard, getStatus, toggleStatus, getEarnings } = require("../controllers/driverController");

const verifyGuard = require("../middlewares/verifyGuard");

// POST /api/driver/onboard — multipart with license + rc files
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
