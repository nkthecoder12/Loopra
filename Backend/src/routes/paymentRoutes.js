const express = require("express");
const router = express.Router();
const {
  createPaymentOrder,
  verifyPayment,
  createAdvancePaymentOrder,
  verifyAdvancePayment,
} = require("../controllers/paymentController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Create payment order
router.post("/:rideId/order", authMiddleware, roleMiddleware("USER"), createPaymentOrder);

// Verify standard payment
router.post("/verify", authMiddleware, roleMiddleware("USER"), verifyPayment);

// Create advance payment order
router.post("/advance/:rideId/order", authMiddleware, roleMiddleware("USER"), createAdvancePaymentOrder);

// Verify advance payment
router.post("/advance/verify", authMiddleware, roleMiddleware("USER"), verifyAdvancePayment);

// Webhook is mounted in server.js before express.json() for raw body signature verification

module.exports = router;
