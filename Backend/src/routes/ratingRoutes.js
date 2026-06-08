const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { submitRating, submitDriverRating } = require("../controllers/ratingController");

// Rider rates driver
router.post("/:rideId", authMiddleware, roleMiddleware("USER"), submitRating);

// Driver rates rider
router.post("/:rideId/driver", authMiddleware, roleMiddleware("DRIVER"), submitDriverRating);

module.exports = router;
