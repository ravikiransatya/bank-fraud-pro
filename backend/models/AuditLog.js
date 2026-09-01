import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String, required: true },
  eventType: {
    type: String,
    enum: [
      "LOGIN",
      "LOGOUT",
      "ACCOUNT_LINKED",
      "ACCOUNT_FROZEN",
      "ACCOUNT_UNFROZEN",
      "TRANSACTION_EXECUTED",
      "TRANSACTION_FLAGGED",
      "TRANSACTION_BLOCKED",
      "ALERT_RESOLVED",
      "ALERT_QUARANTINED",
      "SECURITY_SCAN_TRIGGERED"
    ],
    required: true
  },
  details: { type: String, required: true },
  metadata: { type: Object },
  ipAddress: { type: String, default: "127.0.0.1" },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("AuditLog", auditLogSchema);
