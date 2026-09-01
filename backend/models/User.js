import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, default: "Account Holder" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
