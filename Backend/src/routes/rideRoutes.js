const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  getRide,
  createRide,
  estimateRide,
  getActiveRide,
  acceptRide,
  rejectRide,
  startRide,
  completeRide,
  cancelRide,
  cancelAtMiddle,
} = require("../controllers/rideController");

// Issue #9: /estimate and /active MUST come before /:id to avoid route conflict
router.post("/estimate", authMiddleware, estimateRide);
router.get("/active", authMiddleware, roleMiddleware("USER"), getActiveRide);

// Issue #10: book is the create route
router.post("/book", authMiddleware, roleMiddleware("USER"), createRide);

// Parameterized routes
router.get("/:id", authMiddleware, roleMiddleware("USER", "DRIVER"), getRide);
router.post("/:id/start", authMiddleware, roleMiddleware("DRIVER"), startRide);
router.post("/:id/complete", authMiddleware, roleMiddleware("DRIVER"), completeRide);
router.post("/:id/cancel", authMiddleware, roleMiddleware("USER", "DRIVER"), cancelRide);
router.post("/:id/cancel-middle", authMiddleware, roleMiddleware("USER", "DRIVER"), cancelAtMiddle);
router.post("/:id/accept", authMiddleware, roleMiddleware("DRIVER"), acceptRide);
router.post("/:id/reject", authMiddleware, roleMiddleware("DRIVER"), rejectRide);

module.exports = router;
