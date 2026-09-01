import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String, required: true },
  transactionId: { type: String },
  referenceId: { type: String },
  type: {
    type: String,
    enum: [
      "UNUSUAL_TRANSACTION",
      "UNUSUAL_LOCATION",
      "LARGE_TRANSACTION",
      "UNUSUAL_TIME",
      "MULTIPLE_FAILED_ATTEMPTS",
      "SUSPICIOUS_MERCHANT",
      "RAPID_TRANSACTION_PATTERN",
      "ACCOUNT_ANOMALY"
    ],
    default: "UNUSUAL_TRANSACTION"
  },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
  riskScore: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  account: { type: String },
  amount: { type: Number },
  status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED", "BLOCKED", "DISMISSED"], default: "OPEN" },
  indicators: [{ type: String }],
  detectedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  actionTaken: { type: String }
});

export default mongoose.model("SecurityEvent", securityEventSchema);
