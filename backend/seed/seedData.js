import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import Transaction from "../models/Transaction.js";
import SecurityEvent from "../models/FraudLog.js";
import AuditLog from "../models/AuditLog.js";

// Deterministic Bank Accounts Definition
export const SEED_BANKS = [
  {
    bankName: "State Bank of India",
    shortName: "SBI",
    accountNo: "•••• 4521",
    rawBalance: 45230,
    ifsc: "SBIN0001842",
    color: "#0284c7",
    logo: "SBI",
    type: "Savings Account",
  },
  {
    bankName: "HDFC Bank",
    shortName: "HDFC",
    accountNo: "•••• 8834",
    rawBalance: 123450,
    ifsc: "HDFC0000214",
    color: "#dc2626",
    logo: "HDFC",
    type: "Savings Account",
  },
  {
    bankName: "ICICI Bank",
    shortName: "ICICI",
    accountNo: "•••• 2210",
    rawBalance: 67800,
    ifsc: "ICIC0006240",
    color: "#ea580c",
    logo: "ICICI",
    type: "Current Account",
  },
  {
    bankName: "Axis Bank",
    shortName: "AXIS",
    accountNo: "•••• 3310",
    rawBalance: 5750,
    ifsc: "UTIB0000412",
    color: "#c026d3",
    logo: "AXIS",
    type: "Savings Account",
  },
  {
    bankName: "Kotak Mahindra Bank",
    shortName: "KOTAK",
    accountNo: "•••• 9921",
    rawBalance: 22100,
    ifsc: "KKBK0000881",
    color: "#059669",
    logo: "KOTAK",
    type: "Savings Account",
  },
  {
    bankName: "Bank of Baroda",
    shortName: "BOB",
    accountNo: "•••• 7745",
    rawBalance: 11450,
    ifsc: "BARB0001092",
    color: "#d97706",
    logo: "BOB",
    type: "Savings Account",
  },
];

// Helper to generate ISO dates offset by days and hours
const getDateOffset = (daysAgo, hour = 12, min = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d;
};

const formatDisplayTime = (date) => {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Deterministic Realistic Transaction Pool (50 records across 30 days)
export const generateSeedTransactions = (phone) => {
  const rawTxns = [
    // Today
    { ref: "TX-1049", daysAgo: 0, h: 14, m: 30, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 500, merchant: "Swiggy Food Order", cat: "Food", loc: "Vadodara, GJ", status: "completed", score: 5, rLevel: "LOW", reason: "Verified dining vendor payment" },
    { ref: "TX-1048", daysAgo: 0, h: 3, m: 15, bank: "HDFC", type: "ATM", tt: "DEBIT", amt: 10000, merchant: "SBI ATM · Alkapuri", cat: "Cash", loc: "Mumbai Central, MH", status: "flagged", score: 87, rLevel: "HIGH", reason: "Midnight ATM cash withdrawal location anomaly" },
    // Yesterday
    { ref: "TX-1047", daysAgo: 1, h: 11, m: 0, bank: "ICICI", type: "NEFT", tt: "CREDIT", amt: 50000, merchant: "Salary Credit · TCS Ltd", cat: "Salary", loc: "Mumbai, MH", status: "completed", score: 4, rLevel: "LOW", reason: "Regular recurring institutional salary credit" },
    { ref: "TX-1046", daysAgo: 1, h: 19, m: 45, bank: "SBI", type: "Card", tt: "DEBIT", amt: 2500, merchant: "Amazon India", cat: "Shopping", loc: "Online / 3DSecure", status: "completed", score: 8, rLevel: "LOW", reason: "Verified 3DS OTP transaction" },
    // 2 Days ago
    { ref: "TX-1045", daysAgo: 2, h: 2, m: 0, bank: "HDFC", type: "UPI", tt: "DEBIT", amt: 150000, merchant: "Unknown QR Code Pay", cat: "Transfer", loc: "Unknown / Proxy IP", status: "blocked", score: 96, rLevel: "CRITICAL", reason: "High velocity transfer to unverified merchant quarantined" },
    { ref: "TX-1044", daysAgo: 2, h: 17, m: 30, bank: "ICICI", type: "IMPS", tt: "DEBIT", amt: 25000, merchant: "IMPS P2P Quick Transfer", cat: "Transfer", loc: "Ahmedabad, GJ", status: "completed", score: 22, rLevel: "LOW", reason: "Verified contact transfer" },
    // 3 Days ago
    { ref: "TX-1043", daysAgo: 3, h: 15, m: 10, bank: "SBI", type: "Card", tt: "DEBIT", amt: 3200, merchant: "Flipkart Internet Pvt Ltd", cat: "Shopping", loc: "Online / Secure", status: "completed", score: 11, rLevel: "LOW", reason: "Normal e-commerce purchase" },
    { ref: "TX-1042", daysAgo: 3, h: 9, m: 20, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 200, merchant: "Ola Cabs Vadodara", cat: "Travel", loc: "Vadodara, GJ", status: "completed", score: 2, rLevel: "LOW", reason: "Local commute payment" },
    // 4 Days ago
    { ref: "TX-1041", daysAgo: 4, h: 23, m: 55, bank: "HDFC", type: "ATM", tt: "DEBIT", amt: 20000, merchant: "HDFC ATM · Mumbai Central", cat: "Cash", loc: "Mumbai, MH", status: "flagged", score: 72, rLevel: "HIGH", reason: "High amount late-night cash withdrawal" },
    { ref: "TX-1040", daysAgo: 4, h: 9, m: 0, bank: "SBI", type: "NEFT", tt: "DEBIT", amt: 75000, merchant: "Home Loan EMI · SBI Finance", cat: "Bills", loc: "Online / Auto-Debit", status: "completed", score: 6, rLevel: "LOW", reason: "Recurring standing instruction" },
    // 5 Days ago
    { ref: "TX-1039", daysAgo: 5, h: 13, m: 15, bank: "Axis", type: "UPI", tt: "DEBIT", amt: 850, merchant: "Zomato Restaurant Delivery", cat: "Food", loc: "Vadodara, GJ", status: "completed", score: 3, rLevel: "LOW", reason: "Verified dining merchant" },
    { ref: "TX-1038", daysAgo: 5, h: 20, m: 40, bank: "Kotak", type: "Card", tt: "DEBIT", amt: 1499, merchant: "Netflix Entertainment India", cat: "Entertainment", loc: "Online / Recurring", status: "completed", score: 4, rLevel: "LOW", reason: "Standard subscription debit" },
    // 6 Days ago
    { ref: "TX-1037", daysAgo: 6, h: 16, m: 0, bank: "BOB", type: "UPI", tt: "DEBIT", amt: 4200, merchant: "D-Mart Supermarket Grocery", cat: "Shopping", loc: "Vadodara, GJ", status: "completed", score: 5, rLevel: "LOW", reason: "Regular point of sale purchase" },
    { ref: "TX-1036", daysAgo: 6, h: 10, m: 30, bank: "ICICI", type: "UPI", tt: "DEBIT", amt: 699, merchant: "Reliance Jio Infocomm Mobile", cat: "Bills", loc: "Online", status: "completed", score: 2, rLevel: "LOW", reason: "Telecom utility payment" },
    // 7 Days ago
    { ref: "TX-1035", daysAgo: 7, h: 18, m: 10, bank: "HDFC", type: "Card", tt: "DEBIT", amt: 6500, merchant: "Zara Fashion Mall Store", cat: "Shopping", loc: "Inorbit Mall, GJ", status: "completed", score: 14, rLevel: "LOW", reason: "In-store EMV chip transaction" },
    { ref: "TX-1034", daysAgo: 7, h: 11, m: 45, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 350, merchant: "Starbucks Coffee Cafe", cat: "Food", loc: "Vadodara, GJ", status: "completed", score: 4, rLevel: "LOW", reason: "Verified QR POS payment" },
    // 8-15 Days ago
    { ref: "TX-1033", daysAgo: 8, h: 14, m: 20, bank: "Axis", type: "UPI", tt: "DEBIT", amt: 2100, merchant: "Gujarat Gas Utility Bill", cat: "Bills", loc: "Online / BBPS", status: "completed", score: 3, rLevel: "LOW", reason: "Utility bill payment" },
    { ref: "TX-1032", daysAgo: 9, h: 21, m: 15, bank: "SBI", type: "Card", tt: "DEBIT", amt: 8500, merchant: "MakeMyTrip Flight Booking", cat: "Travel", loc: "Online / 3DSecure", status: "completed", score: 12, rLevel: "LOW", reason: "Verified airline booking" },
    { ref: "TX-1031", daysAgo: 10, h: 12, m: 0, bank: "ICICI", type: "NEFT", tt: "CREDIT", amt: 15000, merchant: "Consulting Fee · Apex Inc", cat: "Salary", loc: "Bangalore, KA", status: "completed", score: 5, rLevel: "LOW", reason: "Verified institutional credit" },
    { ref: "TX-1030", daysAgo: 11, h: 15, m: 45, bank: "HDFC", type: "UPI", tt: "DEBIT", amt: 1200, merchant: "Apollo Pharmacy Medicals", cat: "Health", loc: "Vadodara, GJ", status: "completed", score: 2, rLevel: "LOW", reason: "Pharmacy POS transaction" },
    { ref: "TX-1029", daysAgo: 12, h: 19, m: 20, bank: "Kotak", type: "UPI", tt: "DEBIT", amt: 450, merchant: "BookMyShow Movie Tickets", cat: "Entertainment", loc: "Online", status: "completed", score: 4, rLevel: "LOW", reason: "Cinema entertainment payment" },
    { ref: "TX-1028", daysAgo: 13, h: 8, m: 30, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 180, merchant: "Uber Premier Commute", cat: "Travel", loc: "Vadodara, GJ", status: "completed", score: 2, rLevel: "LOW", reason: "Transit payment" },
    { ref: "TX-1027", daysAgo: 14, h: 16, m: 10, bank: "BOB", type: "Card", tt: "DEBIT", amt: 3500, merchant: "Croma Electronics Store", cat: "Shopping", loc: "Vadodara, GJ", status: "completed", score: 9, rLevel: "LOW", reason: "Chip & PIN in-store payment" },
    { ref: "TX-1026", daysAgo: 15, h: 10, m: 0, bank: "ICICI", type: "NEFT", tt: "DEBIT", amt: 12000, merchant: "SIP Mutual Fund Investment", cat: "Transfer", loc: "Auto-Debit", status: "completed", score: 3, rLevel: "LOW", reason: "Registered mutual fund SIP" },
    // 16-30 Days ago
    { ref: "TX-1025", daysAgo: 16, h: 14, m: 50, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 720, merchant: "Swiggy Gourmet Dinner", cat: "Food", loc: "Vadodara, GJ", status: "completed", score: 4, rLevel: "LOW", reason: "Food delivery payment" },
    { ref: "TX-1024", daysAgo: 18, h: 11, m: 30, bank: "HDFC", type: "Card", tt: "DEBIT", amt: 18500, merchant: "Apple Store India Online", cat: "Shopping", loc: "Online / Secure", status: "completed", score: 18, rLevel: "LOW", reason: "Verified electronics purchase" },
    { ref: "TX-1023", daysAgo: 20, h: 17, m: 15, bank: "Axis", type: "UPI", tt: "DEBIT", amt: 2400, merchant: "Indian Oil Fuel Station", cat: "Travel", loc: "Highway Fuel Station", status: "completed", score: 5, rLevel: "LOW", reason: "Fuel merchant payment" },
    { ref: "TX-1022", daysAgo: 22, h: 13, m: 0, bank: "Kotak", type: "NEFT", tt: "CREDIT", amt: 8500, merchant: "Dividend Credit · HDFC AMC", cat: "Salary", loc: "Mumbai, MH", status: "completed", score: 2, rLevel: "LOW", reason: "Institutional dividend" },
    { ref: "TX-1021", daysAgo: 24, h: 20, m: 45, bank: "SBI", type: "UPI", tt: "DEBIT", amt: 650, merchant: "Dominos Pizza Online", cat: "Food", loc: "Vadodara, GJ", status: "completed", score: 3, rLevel: "LOW", reason: "Food purchase" },
    { ref: "TX-1020", daysAgo: 26, h: 15, m: 10, bank: "BOB", type: "UPI", tt: "DEBIT", amt: 1500, merchant: "Urban Company Home Services", cat: "Bills", loc: "Vadodara, GJ", status: "completed", score: 4, rLevel: "LOW", reason: "Home maintenance service" },
    { ref: "TX-1019", daysAgo: 28, h: 10, m: 0, bank: "ICICI", type: "NEFT", tt: "CREDIT", amt: 50000, merchant: "Salary Credit · TCS Ltd", cat: "Salary", loc: "Mumbai, MH", status: "completed", score: 3, rLevel: "LOW", reason: "Prior month salary credit" },
    { ref: "TX-1018", daysAgo: 30, h: 18, m: 30, bank: "HDFC", type: "Card", tt: "DEBIT", amt: 4500, merchant: "Decathlon Sports India", cat: "Shopping", loc: "Vadodara, GJ", status: "completed", score: 6, rLevel: "LOW", reason: "In-store sports purchase" },
  ];

  return rawTxns.map((t) => {
    const createdAt = getDateOffset(t.daysAgo, t.h, t.m);
    const sign = t.tt === "CREDIT" ? 1 : -1;
    return {
      phone,
      referenceId: t.ref,
      bankName: t.bank,
      type: t.type,
      transactionType: t.tt,
      amount: sign * t.amt,
      currency: "INR",
      merchant: t.merchant,
      merchantCategory: t.cat,
      time: formatDisplayTime(createdAt),
      location: t.loc,
      status: t.status,
      fraud_score: t.score,
      riskScore: t.score,
      riskLevel: t.rLevel,
      risk_reason: t.reason,
      description: `${t.type} ${t.tt} to ${t.merchant}`,
      isFlagged: t.status === "flagged",
      isBlocked: t.status === "blocked",
      createdAt,
    };
  });
};

// Deterministic Security Events
export const generateSeedAlerts = (phone) => [
  {
    phone,
    referenceId: "ALT-901",
    transactionId: "TX-1048",
    type: "UNUSUAL_LOCATION",
    severity: "HIGH",
    riskScore: 87,
    title: "High-Risk Midnight ATM Cash Withdrawal",
    description: "₹10,000 ATM withdrawal requested at 03:15 AM from Mumbai Central ATM. Usual historical location baseline is Vadodara, Gujarat (Distance deviation: 412 km).",
    account: "HDFC Bank · •••• 8834",
    amount: 10000,
    status: "OPEN",
    indicators: [
      "Midnight withdrawal window (03:15 AM)",
      "Geolocation distance jump (412 km in < 2 hours)",
      "ATM cash withdrawal velocity anomaly"
    ],
    detectedAt: getDateOffset(0, 3, 15),
  },
  {
    phone,
    referenceId: "ALT-902",
    transactionId: "TX-1045",
    type: "RAPID_TRANSACTION_PATTERN",
    severity: "CRITICAL",
    riskScore: 96,
    title: "High-Velocity Unverified QR Payment Quarantined",
    description: "₹1,50,000 transfer attempted to an unverified dynamic QR merchant at 02:00 AM via Proxy IP. Automatically quarantined by Random Forest model.",
    account: "HDFC Bank · •••• 8834",
    amount: 150000,
    status: "BLOCKED",
    indicators: [
      "Unverified dynamic QR recipient VPA",
      "High transaction amount (₹1,50,000 vs ₹3,200 avg)",
      "Proxy / VPN routing IP detected"
    ],
    detectedAt: getDateOffset(2, 2, 0),
  },
  {
    phone,
    referenceId: "ALT-903",
    transactionId: "TX-1041",
    type: "UNUSUAL_TIME",
    severity: "MEDIUM",
    riskScore: 65,
    title: "Multiple Concurrent Session Access Detected",
    description: "3 failed authentication requests initiated on ICICI linked banking portal within 10 minutes from distinct IP subnets.",
    account: "ICICI Bank · •••• 2210",
    amount: 0,
    status: "INVESTIGATING",
    indicators: [
      "3 concurrent login attempts in 10 mins",
      "Distinct subnet IP originations",
      "Unrecognized browser user-agent"
    ],
    detectedAt: getDateOffset(4, 18, 40),
  },
  {
    phone,
    referenceId: "ALT-904",
    transactionId: null,
    type: "UNUSUAL_LOCATION",
    severity: "MEDIUM",
    riskScore: 55,
    title: "New Geographic Geofence Login Detected",
    description: "Account credentials accessed from New Delhi for the first time. Device fingerprint differs from primary device.",
    account: "State Bank of India · •••• 4521",
    amount: 0,
    status: "OPEN",
    indicators: [
      "New geofence location: New Delhi",
      "Device fingerprint hardware mismatch"
    ],
    detectedAt: getDateOffset(5, 14, 15),
  },
  {
    phone,
    referenceId: "ALT-905",
    transactionId: "TX-1044",
    type: "LARGE_TRANSACTION",
    severity: "LOW",
    riskScore: 22,
    title: "Large High-Value IMPS Transfer Executed",
    description: "₹25,000 instant IMPS transfer successfully cleared to verified recipient. Dispatched confirmation notification.",
    account: "ICICI Bank · •••• 2210",
    amount: 25000,
    status: "RESOLVED",
    indicators: [
      "Verified recurring contact",
      "Two-factor OTP verified"
    ],
    detectedAt: getDateOffset(6, 11, 30),
    resolvedAt: getDateOffset(6, 12, 0),
    actionTaken: "User verified as legitimate contact transfer",
  },
];

// In-Memory Persistent Store Fallback
export const inMemoryStore = {
  accounts: {},
  transactions: {},
  alerts: {},
  auditLogs: {},
};

// Seeding Orchestrator
export const seedUserData = async (phone) => {
  const seedAccounts = SEED_BANKS.map((b, idx) => ({
    phone,
    bankName: b.bankName,
    shortName: b.shortName,
    accountNo: b.accountNo,
    balance: `₹${b.rawBalance.toLocaleString("en-IN")}`,
    rawBalance: b.rawBalance,
    ifsc: b.ifsc,
    color: b.color,
    logo: b.logo,
    type: b.type,
    upiId: `${phone}@${b.shortName.toLowerCase()}`,
    status: "ACTIVE",
    isFrozen: false,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
  }));

  const seedTxns = generateSeedTransactions(phone);
  const seedAlerts = generateSeedAlerts(phone);

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    try {
      await BankAccount.deleteMany({ phone });
      await Transaction.deleteMany({ phone });
      await SecurityEvent.deleteMany({ phone });

      const accounts = await BankAccount.insertMany(seedAccounts);
      const transactions = await Transaction.insertMany(seedTxns);
      const alerts = await SecurityEvent.insertMany(seedAlerts);

      inMemoryStore.accounts[phone] = accounts;
      inMemoryStore.transactions[phone] = transactions;
      inMemoryStore.alerts[phone] = alerts;

      return { accounts, transactions, alerts };
    } catch (err) {
      console.warn("MongoDB seed failed, using in-memory store:", err.message);
    }
  }

  // Direct In-Memory setup (0ms latency, zero buffering)
  inMemoryStore.accounts[phone] = seedAccounts.map((a, idx) => ({
    ...a,
    id: `acc_${idx + 1}`,
    _id: `acc_${idx + 1}`,
  }));

  inMemoryStore.transactions[phone] = seedTxns.map((t, idx) => ({
    ...t,
    id: t.referenceId,
    _id: `tx_${idx + 1}`,
  }));

  inMemoryStore.alerts[phone] = seedAlerts.map((al, idx) => ({
    ...al,
    id: al.referenceId,
    _id: `alt_${idx + 1}`,
  }));

  return {
    accounts: inMemoryStore.accounts[phone],
    transactions: inMemoryStore.transactions[phone],
    alerts: inMemoryStore.alerts[phone],
  };
};
