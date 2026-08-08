const mongoose = require("mongoose");

const fleetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["ACTIVE", "SUSPENDED", "INACTIVE"], default: "ACTIVE", index: true },
    contactInfo: {
      phone: { type: String },
      email: { type: String }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fleet", fleetSchema);
