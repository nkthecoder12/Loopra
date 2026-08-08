const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["bike", "auto", "car", "suv", "economy", "premium"],
      default: "car"
    },
    model: { type: String, required: true },
    assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null, index: true },
    fleetId: { type: mongoose.Schema.Types.ObjectId, ref: "Fleet", required: true, index: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "IN_RIDE", "MAINTENANCE", "INACTIVE", "SUSPENDED"],
      default: "AVAILABLE",
      index: true
    },
    documents: {
      insurance: { type: String, default: null },
      rc: { type: String, default: null },
      permit: { type: String, default: null },
      fitness: { type: String, default: null }
    },
    compliance: {
      isCompliant: { type: Boolean, default: true },
      expirationDates: {
        insurance: { type: Date, default: null },
        permit: { type: Date, default: null },
        fitness: { type: Date, default: null }
      }
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
