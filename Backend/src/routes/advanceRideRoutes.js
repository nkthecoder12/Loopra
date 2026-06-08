const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { bookAdvanceRide, respondToOffer } = require("../controllers/advanceRideController");

// User books advance ride B linked to ride A
router.post("/book", authMiddleware, roleMiddleware("USER"), bookAdvanceRide);

// Driver responds to the offer
router.post("/:rideId/driver-response", authMiddleware, roleMiddleware("DRIVER"), respondToOffer);

module.exports = router;
