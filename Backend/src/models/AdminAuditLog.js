const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["DRIVER_APPLICATION", "DRIVER", "USER"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "APPROVE_APPLICATION",
        "REJECT_APPLICATION",
        "REQUEST_DOCUMENT_CHANGES",
        "VERIFY_DOCUMENT",
        "SUSPEND_DRIVER",
        "REACTIVATE_DRIVER",
        "DEACTIVATE_DRIVER",
        "SOFT_DELETE_DRIVER",
      ],
      required: true,
    },
    reason: { type: String, default: null },
    metadata: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
