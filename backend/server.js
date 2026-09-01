import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import fraudRoutes from "./routes/fraud.js";
import bankRoutes from "./routes/banks.js";
import chatRoutes from "./routes/chat.js";
import analyticsRoutes from "./routes/analytics.js";
import deviceRoutes from "./routes/devices.js";
import notificationRoutes from "./routes/notifications.js";
import incidentRoutes from "./routes/incidents.js";
import securityOpsRoutes from "./routes/securityOps.js";
import eventRoutes from "./routes/events.js";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("⚠️ MongoDB Connection Error (Dual in-memory fallback enabled):", err.message));
}

// Mounted Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/security-ops", securityOpsRoutes);
app.use("/api/events", eventRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 BankGuard AI Server running on port ${PORT}`));