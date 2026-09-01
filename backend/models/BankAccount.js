import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: { type: String, required: true },
  bankName: { type: String, required: true },
  shortName: { type: String, required: true },
  accountNo: { type: String, required: true },
  balance: { type: String, required: true },
  rawBalance: { type: Number, required: true },
  ifsc: { type: String, required: true },
  color: { type: String, required: true },
  logo: { type: String, required: true },
  type: { type: String, default: "Savings" },
  upiId: { type: String, required: true },
  status: { type: String, enum: ["ACTIVE", "FROZEN"], default: "ACTIVE" },
  isFrozen: { type: Boolean, default: false },
  lastSyncedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("BankAccount", bankAccountSchema);
