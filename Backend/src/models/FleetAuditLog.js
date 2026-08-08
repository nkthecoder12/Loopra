const mongoose = require("mongoose");

const fleetAuditLogSchema = new mongoose.Schema(
  {
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fleetId: { type: mongoose.Schema.Types.ObjectId, ref: "Fleet", required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, default: null },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FleetAuditLog", fleetAuditLogSchema);
