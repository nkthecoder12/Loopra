const express = require("express");
const router = express.Router();
const { getProfile, getUserRides } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/me", authMiddleware, roleMiddleware("USER", "DRIVER", "ADMIN"), getProfile);
router.get("/me/rides", authMiddleware, roleMiddleware("USER"), getUserRides);

module.exports = router;
