import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import transactionRoutes from "./routes/transactions.js";
import fraudRoutes from "./routes/fraud.js";
import bankRoutes from "./routes/banks.js";
import chatRoutes from "./routes/chat.js";

dotenv.config(); // ✅ VERY IMPORTANT

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/chat", chatRoutes);

app.listen(5000, () => console.log("🚀 Server running on port 5000"));