const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const User = require("../models/User");
const Driver = require("../models/Driver");

const mongodbUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/Loopra";

async function run() {
  console.log("Connecting to Database:", mongodbUrl);
  await mongoose.connect(mongodbUrl);
  console.log("Connected successfully!");

  // --- PASSENGER SEED ACCOUNT ---
  const passengerEmail = "passenger@test.com";
  const passengerPassword = "password123";
  let passengerUser = await User.findOne({ email: passengerEmail });

  if (passengerUser) {
    console.log("Passenger user already exists with email:", passengerEmail);
  } else {
    console.log("Creating Passenger User record...");
    const hashedPassengerPassword = await bcrypt.hash(passengerPassword, 10);
    passengerUser = await User.create({
      name: "Test Passenger",
      email: passengerEmail,
      password: hashedPassengerPassword,
      role: "USER",
      isVerified: true
    });
    console.log("Passenger User created! ID:", passengerUser._id);
  }

  // --- DRIVER SEED ACCOUNT ---
  const driverEmail = "driver@test.com";
  const driverPassword = "password123";
  const driverPhone = "+919876543210";
  const vehicleType = "sedan";
  const vehicleNumber = "TN 38 BX 4521";

  let driverUser = await User.findOne({ email: driverEmail });
  if (driverUser) {
    console.log("Driver user already exists with email:", driverEmail);
  } else {
    console.log("Creating Driver User record...");
    const hashedDriverPassword = await bcrypt.hash(driverPassword, 10);
    driverUser = await User.create({
      name: "Rajesh Kumar",
      email: driverEmail,
      password: hashedDriverPassword,
      role: "DRIVER",
      isVerified: true
    });
    console.log("Driver User created! ID:", driverUser._id);
  }

  // Ensure driver role is set properly
  if (driverUser.role !== "DRIVER" || !driverUser.isVerified) {
    driverUser.role = "DRIVER";
    driverUser.isVerified = true;
    await driverUser.save();
    console.log("Updated driver user credentials.");
  }

  // Check if Driver profile exists
  let driverProfile = await Driver.findOne({ userId: driverUser._id });
  if (driverProfile) {
    console.log("Driver profile already exists. Ensuring available and active status...");
    driverProfile.onboardingStatus = "APPROVED";
    driverProfile.isAvailable = true;
    driverProfile.isActive = true;
    driverProfile.isDeleted = false;
    driverProfile.location = {
      type: "Point",
      coordinates: [76.9558, 11.0168] // Close proximity center
    };
    driverProfile.vehicle = {
      type: vehicleType,
      number: vehicleNumber
    };
    await driverProfile.save();
    console.log("Driver profile updated.");
  } else {
    console.log("Creating Driver profile...");
    driverProfile = await Driver.create({
      userId: driverUser._id,
      name: "Rajesh Kumar",
      phone: driverPhone,
      vehicle: {
        type: vehicleType,
        number: vehicleNumber
      },
      onboardingStatus: "APPROVED",
      isAvailable: true,
      isActive: true,
      isDeleted: false,
      location: {
        type: "Point",
        coordinates: [76.9558, 11.0168] // Centered at default passenger start bounds
      }
    });
    console.log("Driver profile created successfully!");
  }

  console.log("\n============================================");
  console.log("DEVELOPMENT TEST SEED COMPLETED!");
  console.log("--------------------------------------------");
  console.log("PASSENGER USER:");
  console.log("  Email:     " + passengerEmail);
  console.log("  Password:  " + passengerPassword);
  console.log("--------------------------------------------");
  console.log("DRIVER USER:");
  console.log("  Email:     " + driverEmail);
  console.log("  Password:  " + driverPassword);
  console.log("  Phone:     " + driverPhone);
  console.log("  Vehicle:   " + vehicleType + " (" + vehicleNumber + ")");
  console.log("  Status:    APPROVED & ONLINE (isAvailable: true)");
  console.log("  Location:  Coimbatore default center coordinates");
  console.log("============================================\n");

  await mongoose.connection.close();
  console.log("Database connection closed.");
}

run().catch(err => {
  console.error("Error running developer seed script:", err);
  mongoose.connection.close();
});
