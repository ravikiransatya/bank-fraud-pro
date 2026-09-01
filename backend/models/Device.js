import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    phone: { type: String, required: true, index: true },
    deviceFingerprint: { type: String, required: true, index: true },
    deviceName: { type: String, default: "Personal Computer / Browser" },
    deviceType: {
      type: String,
      enum: ["Desktop", "Mobile", "Tablet", "Unknown"],
      default: "Desktop",
    },
    operatingSystem: { type: String, default: "Windows" },
    osVersion: { type: String, default: "10/11" },
    browser: { type: String, default: "Chrome" },
    browserVersion: { type: String, default: "Latest" },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "127.0.0.1" },
    location: { type: String, default: "Vadodara, Gujarat" },
    country: { type: String, default: "India" },
    city: { type: String, default: "Vadodara" },
    timezone: { type: String, default: "Asia/Kolkata" },
    screenResolution: { type: String, default: "1920x1080" },
    language: { type: String, default: "en-US" },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now },
    isCurrentDevice: { type: Boolean, default: false },
    trustStatus: {
      type: String,
      enum: ["TRUSTED", "SUSPICIOUS", "REVOKED", "PENDING_REVIEW"],
      default: "TRUSTED",
    },
    riskScore: { type: Number, default: 5 },
    isRevoked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast user-device lookups
deviceSchema.index({ phone: 1, deviceFingerprint: 1 });

export default mongoose.model("Device", deviceSchema);
