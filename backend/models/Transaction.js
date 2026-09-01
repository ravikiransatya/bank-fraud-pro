import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String, required: true },
  referenceId: { type: String, required: true },
  accountId: { type: String },
  bankName: { type: String, required: true },
  type: { type: String, required: true }, // UPI, ATM, NEFT, Card, IMPS, RTGS
  transactionType: { type: String, enum: ["CREDIT", "DEBIT"], default: "DEBIT" },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  merchant: { type: String, required: true },
  merchantCategory: { type: String, default: "Other" }, // Food, Shopping, Travel, Bills, Salary, Cash, Transfer, Entertainment, Health
  time: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ["success", "completed", "flagged", "blocked", "pending"], default: "success" },
  fraud_score: { type: Number, default: 0 },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
  risk_reason: { type: String },
  description: { type: String },
  isFlagged: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
