const User = require("../models/User");
const Ride = require("../models/Ride");
const bcrypt = require("bcryptjs");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email profileImage");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const getUserRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const rides = await Ride.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("driverId", "name phone vehicle");
      
    res.json({ success: true, page, limit, rides });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ride history" });
  }
};

module.exports = { getProfile, getUserRides };