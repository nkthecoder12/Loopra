const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const trackingController = require("../controllers/trackingController");

// Retrieve driver's live coordinate coordinates (secured behind auth middleware)
router.get(
  "/:rideId/live",
  authMiddleware,
  trackingController.getActiveLocation
);

// Retrieve full route track history (secured behind auth middleware)
router.get(
  "/:rideId/path",
  authMiddleware,
  trackingController.getPathHistory
);
router.get(
  "/:rideId/history",
  authMiddleware,
  trackingController.getPathHistory
);

module.exports = router;
