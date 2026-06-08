const Rating = require("../models/Rating");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Ride = require("../models/Ride");

const submitRating = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    if (ride.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the rider can rate the driver for this ride" });
    }

    if (ride.status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Ride is not completed yet" });
    }

    // Create or update the rating
    const ratingDoc = await Rating.findOneAndUpdate(
      { rideId, ratedBy: "USER" },
      { userId, driverId: ride.driverId, rating, comment, ratedBy: "USER" },
      { upsert: true, new: true }
    );

    // Calculate new average rating for driver
    const driverRatings = await Rating.find({ driverId: ride.driverId, ratedBy: "USER" });
    const totalRating = driverRatings.reduce((sum, doc) => sum + doc.rating, 0);
    const avgRating = totalRating / driverRatings.length;

    await Driver.findByIdAndUpdate(ride.driverId, {
      $set: {
        "earnings.rating": parseFloat(avgRating.toFixed(2)),
        "earnings.rides": driverRatings.length
      }
    });

    return res.status(201).json({ success: true, message: "Rating submitted", data: ratingDoc });
  } catch (err) {
    next(err);
  }
};

const submitDriverRating = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const { rating, comment } = req.body;
    const driverUser = req.user;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ success: false, message: "Ride not found" });
    }

    const driver = await Driver.findOne({ userId: driverUser.id });
    if (!driver || ride.driverId.toString() !== driver._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the assigned driver can rate the user for this ride" });
    }

    if (ride.status !== "COMPLETED") {
      return res.status(400).json({ success: false, message: "Ride is not completed yet" });
    }

    // Create or update the rating
    const ratingDoc = await Rating.findOneAndUpdate(
      { rideId, ratedBy: "DRIVER" },
      { userId: ride.userId, driverId: driver._id, rating, comment, ratedBy: "DRIVER" },
      { upsert: true, new: true }
    );

    // Calculate new average rating for user
    const userRatings = await Rating.find({ userId: ride.userId, ratedBy: "DRIVER" });
    const totalRating = userRatings.reduce((sum, doc) => sum + doc.rating, 0);
    const avgRating = totalRating / userRatings.length;

    await User.findByIdAndUpdate(ride.userId, {
      $set: {
        rating: parseFloat(avgRating.toFixed(2)),
        ridesCount: userRatings.length
      }
    });

    return res.status(201).json({ success: true, message: "User rating submitted", data: ratingDoc });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitRating, submitDriverRating };
