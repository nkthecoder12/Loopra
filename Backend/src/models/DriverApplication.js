const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "RE_UPLOAD_REQUIRED"],
      default: "PENDING",
    },
    reviewNotes: { type: String, default: "" },
  },
  { _id: false }
);

const driverApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "PENDING",
        "APPROVED",
        "REJECTED",
        "REQUEST_CHANGES",
        "SUSPENDED",
        "INACTIVE",
        "DELETED",
      ],
      default: "SUBMITTED",
      index: true,
    },

    personalDetails: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      dob: { type: Date },
      gender: { type: String, default: "other" },
      address: { type: String, required: true },
      city: { type: String, default: "Coimbatore" },
      state: { type: String, default: "Tamil Nadu" },
      pincode: { type: String, default: "" },
      emergencyContact: { type: String, default: "" },
      profilePhoto: { type: documentSchema, default: () => ({}) },
    },

    licenseDetails: {
      licenseNumber: { type: String, required: true },
      issueDate: { type: Date },
      expiryDate: { type: Date, required: true },
      licenseFront: { type: documentSchema, default: () => ({}) },
      licenseBack: { type: documentSchema, default: () => ({}) },
    },

    vehicleDetails: {
      vehicleType: {
        type: String,
        enum: ["bike", "auto", "car", "suv", "economy", "premium"],
        required: true,
      },
      brand: { type: String, default: "" },
      model: { type: String, default: "" },
      year: { type: String, default: "" },
      number: { type: String, required: true },
      colour: { type: String, default: "" },
      vehiclePhoto: { type: documentSchema, default: () => ({}) },
    },

    documents: {
      rcBook: { type: documentSchema, default: () => ({}) },
      insurance: { type: documentSchema, default: () => ({}) },
      pollutionCertificate: { type: documentSchema, default: () => ({}) },
      govtId: { type: documentSchema, default: () => ({}) },
      selfie: { type: documentSchema, default: () => ({}) },
    },

    bankDetails: {
      accountHolder: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      bankName: { type: String, default: "" },
      branch: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },

    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      },
    ],

    rejectionReason: { type: String, default: null },
    reviewComments: { type: String, default: null },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DriverApplication", driverApplicationSchema);
