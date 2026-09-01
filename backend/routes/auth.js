import express from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import crypto from "crypto";
import User from "../models/User.js";
import BankAccount from "../models/BankAccount.js";
import Transaction from "../models/Transaction.js";
import { registerOrUpdateDevice } from "../services/deviceService.js";

const router = express.Router();

// ==========================================
// 1. Phone Validation & Normalization
// ==========================================
export function normalizeIndianPhone(input) {
  if (!input || typeof input !== "string") return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}

// ==========================================
// 2. In-Memory Security & Session Store
// ==========================================
// Map: phone -> { otp, createdAt, lastSentAt, attempts, sendCount, windowStart }
const otpSessions = new Map();

const RESEND_COOLDOWN_MS = 60 * 1000; // 60s cooldown between send attempts
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 verification attempts per OTP session
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes sliding window
const MAX_SENDS_PER_WINDOW = 5; // Max 5 OTP requests in 10 minutes
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes OTP session validity

// In-Memory Fallback Database Store (Active if MongoDB daemon is offline)
const inMemoryStore = {
  users: {},
  accounts: {},
  transactions: {},
};

// Pool of major Indian Banks
const BANK_POOL = [
  { bankName: "State Bank of India", shortName: "SBI", color: "#1a237e", logo: "SBI", ifscPrefix: "SBIN000" },
  { bankName: "HDFC Bank", shortName: "HDFC", color: "#e53935", logo: "HDFC", ifscPrefix: "HDFC000" },
  { bankName: "ICICI Bank", shortName: "ICICI", color: "#f57c00", logo: "ICICI", ifscPrefix: "ICIC000" },
  { bankName: "Axis Bank", shortName: "Axis", color: "#880e4f", logo: "AXIS", ifscPrefix: "UTIB000" },
  { bankName: "Kotak Mahindra Bank", shortName: "Kotak", color: "#c62828", logo: "KOTAK", ifscPrefix: "KKBK000" },
  { bankName: "Punjab National Bank", shortName: "PNB", color: "#00695c", logo: "PNB", ifscPrefix: "PUNB000" },
  { bankName: "Bank of Baroda", shortName: "BOB", color: "#ef6c00", logo: "BOB", ifscPrefix: "BARB000" },
];

export function getInMemoryData(phone) {
  return {
    accounts: inMemoryStore.accounts[phone] || [],
    transactions: inMemoryStore.transactions[phone] || [],
  };
}

// Helper to seed bank accounts and fraud transactions for new users
export async function seedUserData(phone, userObj = null) {
  let user = userObj;
  let accounts = [];
  let transactions = [];

  try {
    if (!user) {
      user = await User.findOne({ phone }).exec();
      if (!user) {
        user = await User.create({ phone, name: `User ${phone.slice(-4)}` });
      }
    }

    accounts = await BankAccount.find({ phone }).exec();
    if (accounts.length === 0) {
      const shuffled = [...BANK_POOL].sort(() => 0.5 - Math.random());
      const selectedBanks = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

      for (const b of selectedBanks) {
        const randomAcc = Math.floor(1000 + Math.random() * 9000).toString();
        const rawBal = Math.floor(25000 + Math.random() * 150000);
        const formattedBal = `₹${rawBal.toLocaleString("en-IN")}`;
        const randomIfsc = `${b.ifscPrefix}${Math.floor(1000 + Math.random() * 9000)}`;

        const acc = await BankAccount.create({
          userId: user._id,
          phone,
          bankName: b.bankName,
          shortName: b.shortName,
          accountNo: `****${randomAcc}`,
          balance: formattedBal,
          rawBalance: rawBal,
          ifsc: randomIfsc,
          color: b.color,
          logo: b.logo,
          type: Math.random() > 0.5 ? "Savings" : "Current",
          upiId: `${phone}@${b.shortName.toLowerCase()}`,
        });
        accounts.push(acc);
      }
    }

    transactions = await Transaction.find({ phone }).sort({ createdAt: -1 }).exec();
    if (transactions.length === 0 && accounts.length > 0) {
      const bank = accounts[0];
      const now = new Date();
      const formatDate = (daysAgo, hours = 14) => {
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        d.setHours(hours, Math.floor(Math.random() * 60));
        return d.toISOString().replace("T", " ").substring(0, 16);
      };

      const mockTxns = [
        {
          userId: user._id,
          phone,
          bankId: bank._id ? bank._id.toString() : "1",
          bankName: bank.shortName,
          type: "UPI",
          amount: 450,
          merchant: "Swiggy",
          time: formatDate(0, 13),
          location: "Vadodara",
          status: "success",
          fraud_score: 4,
          risk_reason: "Normal dining transaction",
        },
        {
          userId: user._id,
          phone,
          bankId: bank._id ? bank._id.toString() : "1",
          bankName: bank.shortName,
          type: "Card",
          amount: 3290,
          merchant: "Amazon India",
          time: formatDate(1, 18),
          location: "Online",
          status: "success",
          fraud_score: 7,
          risk_reason: "Verified merchant purchase",
        },
        {
          userId: user._id,
          phone,
          bankId: bank._id ? bank._id.toString() : "1",
          bankName: bank.shortName,
          type: "NEFT",
          amount: 75000,
          merchant: "Salary Credit - TechCorp",
          time: formatDate(2, 10),
          location: "Online",
          status: "success",
          fraud_score: 2,
          risk_reason: "Regular salary credit",
        },
        {
          userId: user._id,
          phone,
          bankId: bank._id ? bank._id.toString() : "1",
          bankName: bank.shortName,
          type: "ATM",
          amount: 25000,
          merchant: "ATM Cash Withdrawal (Alkapuri)",
          time: formatDate(0, 3),
          location: "London, UK",
          status: "flagged",
          fraud_score: 94,
          risk_reason: "Midnight International ATM withdrawal anomaly",
        },
        {
          userId: user._id,
          phone,
          bankId: bank._id ? bank._id.toString() : "1",
          bankName: bank.shortName,
          type: "UPI",
          amount: 185000,
          merchant: "Unverified VPA Transfer",
          time: formatDate(1, 2),
          location: "Unknown / Proxy IP",
          status: "blocked",
          fraud_score: 97,
          risk_reason: "High-amount transfer to flagged unverified VPA",
        },
      ];

      transactions = await Transaction.insertMany(mockTxns);
    }
  } catch (dbErr) {
    if (!inMemoryStore.accounts[phone]) {
      const shuffled = [...BANK_POOL].sort(() => 0.5 - Math.random());
      const selectedBanks = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

      inMemoryStore.accounts[phone] = selectedBanks.map((b, idx) => {
        const randomAcc = Math.floor(1000 + Math.random() * 9000).toString();
        const rawBal = Math.floor(25000 + Math.random() * 150000);
        return {
          id: `mem_acc_${idx + 1}`,
          bankName: b.bankName,
          shortName: b.shortName,
          accountNo: `****${randomAcc}`,
          balance: `₹${rawBal.toLocaleString("en-IN")}`,
          ifsc: `${b.ifscPrefix}${Math.floor(1000 + Math.random() * 9000)}`,
          color: b.color,
          logo: b.logo,
          type: idx % 2 === 0 ? "Savings" : "Current",
          upiId: `${phone}@${b.shortName.toLowerCase()}`,
        };
      });
    }

    if (!inMemoryStore.transactions[phone]) {
      const firstBank = inMemoryStore.accounts[phone][0];
      inMemoryStore.transactions[phone] = [
        {
          id: "mem_tx_1",
          bankName: firstBank ? firstBank.shortName : "SBI",
          type: "UPI",
          amount: 450,
          merchant: "Swiggy",
          time: "Today, 13:45",
          location: "Vadodara",
          status: "success",
          fraud_score: 4,
          risk_reason: "Normal transaction",
        },
        {
          id: "mem_tx_2",
          bankName: firstBank ? firstBank.shortName : "SBI",
          type: "Card",
          amount: 3290,
          merchant: "Amazon India",
          time: "Yesterday, 18:20",
          location: "Online",
          status: "success",
          fraud_score: 7,
          risk_reason: "Verified merchant purchase",
        },
        {
          id: "mem_tx_3",
          bankName: firstBank ? firstBank.shortName : "SBI",
          type: "ATM",
          amount: 25000,
          merchant: "ATM Cash Withdrawal (Alkapuri)",
          time: "Today, 03:15 AM",
          location: "London, UK",
          status: "flagged",
          fraud_score: 94,
          risk_reason: "Midnight International ATM withdrawal anomaly",
        },
        {
          id: "mem_tx_4",
          bankName: firstBank ? firstBank.shortName : "SBI",
          type: "UPI",
          amount: 185000,
          merchant: "Unverified VPA Transfer",
          time: "Yesterday, 02:10 AM",
          location: "Unknown / Proxy IP",
          status: "blocked",
          fraud_score: 97,
          risk_reason: "High-amount transfer to flagged unverified VPA",
        },
      ];
    }

    user = { _id: `mem_user_${phone}`, phone, name: `User ${phone.slice(-4)}` };
    accounts = inMemoryStore.accounts[phone];
    transactions = inMemoryStore.transactions[phone];
  }

  return { user, accounts, transactions };
}

// ==========================================
// 3. Endpoint: /send-otp (Strict 2Factor SMS OTP)
// ==========================================
router.post("/send-otp", async (req, res) => {
  try {
    const rawPhone = req.body.phone;
    const phone = normalizeIndianPhone(rawPhone);

    if (!phone) {
      return res.status(400).json({
        error: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
      });
    }

    const twoFactorApiKey = process.env.TWOFACTOR_API_KEY?.trim();
    if (!twoFactorApiKey) {
      return res.status(500).json({
        error: "2Factor API key is not configured. Please set TWOFACTOR_API_KEY in backend/.env.",
      });
    }

    const now = Date.now();
    const existing = otpSessions.get(phone);

    // Check 60-second Resend Cooldown
    if (existing && existing.lastSentAt && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} second(s) before requesting another OTP.`,
        cooldownRemaining: waitSec,
      });
    }

    // Check 10-minute rate limit window
    let windowStart = existing?.windowStart || now;
    let sendCount = existing?.sendCount || 0;

    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      windowStart = now;
      sendCount = 0;
    }

    if (sendCount >= MAX_SENDS_PER_WINDOW) {
      const resetMin = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 60000);
      return res.status(429).json({
        error: `Too many OTP requests for this number. Please try again in ${resetMin} minute(s).`,
      });
    }

    // Generate a cryptographically secure 6-digit numeric OTP
    const generatedOtp = crypto.randomInt(100000, 999999).toString();

    // Dedicated 2Factor Direct Transactional SMS OTP Endpoint (NOT Voice/OBD):
    // Format: https://2factor.in/API/V1/{API_KEY}/SMS/+91{PHONE}/{OTP_VALUE}
    // Or with custom approved DLT template: https://2factor.in/API/V1/{API_KEY}/SMS/+91{PHONE}/{OTP_VALUE}/{TEMPLATE_NAME}
    const templateName = process.env.TWOFACTOR_OTP_TEMPLATE?.trim();
    const twoFactorSmsUrl = templateName
      ? `https://2factor.in/API/V1/${encodeURIComponent(twoFactorApiKey)}/SMS/+91${phone}/${encodeURIComponent(generatedOtp)}/${encodeURIComponent(templateName)}`
      : `https://2factor.in/API/V1/${encodeURIComponent(twoFactorApiKey)}/SMS/+91${phone}/${encodeURIComponent(generatedOtp)}`;

    const response = await axios.get(twoFactorSmsUrl, {
      timeout: 10000,
      headers: { "Cache-Control": "no-cache" },
    });

    const data = response.data;

    if (data.Status === "Success") {
      // Store session securely on backend with generated OTP
      otpSessions.set(phone, {
        otp: generatedOtp,
        phone,
        createdAt: now,
        lastSentAt: now,
        attempts: 0,
        sendCount: sendCount + 1,
        windowStart,
      });

      return res.json({
        success: true,
        message: `SMS OTP sent successfully to +91 ${phone}`,
        cooldownSeconds: 60,
      });
    } else {
      const reason = data.Details || "2Factor rejected the SMS request.";
      return res.status(400).json({
        error: `Failed to dispatch SMS OTP: ${reason}`,
      });
    }
  } catch (err) {
    const errorDetails = err.response?.data?.Details || err.response?.data?.message || err.message;
    console.error("2Factor SMS OTP Dispatch Error:", errorDetails);

    if (err.response?.status === 401 || errorDetails?.toLowerCase().includes("key")) {
      return res.status(500).json({
        error: "Invalid 2Factor API Key. Please verify TWOFACTOR_API_KEY in backend/.env.",
      });
    }

    return res.status(500).json({
      error: `Could not send SMS OTP: ${errorDetails}`,
    });
  }
});

// ==========================================
// 4. Endpoint: /verify-otp (Backend Session Verification)
// ==========================================
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone: rawPhone, otp } = req.body;
    const phone = normalizeIndianPhone(rawPhone);

    if (!phone) {
      return res.status(400).json({
        error: "Valid 10-digit Indian phone number is required.",
      });
    }

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({
        error: "Please enter a valid 6-digit numeric OTP code.",
      });
    }

    const cleanOtp = otp.trim();
    const session = otpSessions.get(phone);

    if (!session || !session.otp) {
      return res.status(400).json({
        error: "No active OTP session found. Please request an SMS OTP first.",
      });
    }

    const now = Date.now();
    if (now - session.createdAt > OTP_EXPIRY_MS) {
      otpSessions.delete(phone);
      return res.status(400).json({
        error: "OTP has expired. Please request a new SMS OTP.",
      });
    }

    if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
      otpSessions.delete(phone);
      return res.status(429).json({
        error: "Maximum verification attempts exceeded. Please request a new OTP.",
      });
    }

    // Verify submitted OTP against stored session OTP
    if (session.otp === cleanOtp) {
      // Successful verification! Invalidate session immediately
      otpSessions.delete(phone);

      const { user, accounts, transactions } = await seedUserData(phone);

      // Register / update device session for the authenticated user
      const { clientMetadata } = req.body;
      const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "";

      let device = null;
      try {
        device = await registerOrUpdateDevice({
          phone: user.phone,
          userId: user._id || user.id,
          clientMetadata: clientMetadata || {},
          ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "127.0.0.1",
          userAgent,
          isLogin: true,
        });
      } catch (devErr) {
        console.warn("Device registration notice during login:", devErr.message);
      }

      const jwtSecret = process.env.JWT_SECRET || "supersecretkey1283712893";
      const token = jwt.sign(
        { userId: user._id || user.id, phone: user.phone },
        jwtSecret,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
        message: "SMS OTP verified successfully!",
        token,
        user: { id: user._id || user.id, phone: user.phone, name: user.name },
        device,
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        flaggedCount: transactions.filter((t) => t.status === "flagged" || t.status === "blocked").length,
      });
    } else {
      session.attempts += 1;
      const remaining = MAX_VERIFY_ATTEMPTS - session.attempts;

      if (remaining <= 0) {
        otpSessions.delete(phone);
        return res.status(400).json({
          error: "Incorrect OTP. Maximum attempts reached. Please request a new SMS OTP.",
        });
      }

      return res.status(400).json({
        error: `Incorrect OTP code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }
  } catch (err) {
    console.error("Verify OTP Error:", err.message);
    return res.status(500).json({
      error: "Internal server error during OTP verification.",
    });
  }
});

export default router;