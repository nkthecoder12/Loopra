const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

// Post system alert manually (secured behind auth middleware)
router.post(
  "/system-alert",
  authMiddleware,
  notificationController.sendSystemAlert
);

module.exports = router;
