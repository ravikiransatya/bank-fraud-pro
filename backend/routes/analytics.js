import express from "express";
import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import Transaction from "../models/Transaction.js";
import SecurityEvent from "../models/FraudLog.js";
import { seedUserData, inMemoryStore } from "../seed/seedData.js";
import { generateSecurityAdvisory } from "../services/advisoryService.js";

const router = express.Router();

// Helper to fetch user data across MongoDB + In-Memory Fallback
export const getUserDatasets = async (phone) => {
  let accounts = [];
  let transactions = [];
  let alerts = [];

  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    try {
      accounts = await BankAccount.find({ phone }).exec();
      transactions = await Transaction.find({ phone }).sort({ createdAt: -1 }).exec();
      alerts = await SecurityEvent.find({ phone }).sort({ detectedAt: -1 }).exec();

      if (accounts.length === 0 || transactions.length === 0) {
        const seeded = await seedUserData(phone);
        accounts = seeded.accounts;
        transactions = seeded.transactions;
        alerts = seeded.alerts;
      }
      return { accounts, transactions, alerts };
    } catch (err) {
      console.warn("MongoDB query failed, using in-memory store:", err.message);
    }
  }

  // Fast direct In-Memory fallback (0ms buffer delay)
  if (!inMemoryStore.accounts[phone] || !inMemoryStore.transactions[phone]) {
    const seeded = await seedUserData(phone);
    accounts = seeded.accounts;
    transactions = seeded.transactions;
    alerts = seeded.alerts;
  } else {
    accounts = inMemoryStore.accounts[phone];
    transactions = inMemoryStore.transactions[phone];
    alerts = inMemoryStore.alerts[phone] || [];
  }

  return { accounts, transactions, alerts };
};

// GET /api/analytics/dashboard -> Single Source of Truth Analytics
router.get("/dashboard", async (req, res) => {
  try {
    const { phone, days = 30 } = req.query;
    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    const { accounts, transactions, alerts } = await getUserDatasets(phone);

    // 1. Account Aggregations
    const activeAccounts = accounts.filter((a) => a.status !== "FROZEN" && !a.isFrozen);
    const totalBalance = activeAccounts.reduce((sum, acc) => sum + (acc.rawBalance || 0), 0);
    const monitoredAccounts = accounts.length;

    // 2. Transaction Aggregations
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days, 10));

    const periodTransactions = transactions.filter((t) => new Date(t.createdAt) >= cutoffDate);

    const safeCount = transactions.filter(
      (t) => (t.riskLevel === "LOW" || (t.fraud_score !== undefined ? t.fraud_score : t.score) < 30) && t.status !== "blocked"
    ).length;

    const threatCount = transactions.filter(
      (t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL" || t.status === "flagged" || t.status === "blocked"
    ).length;

    const blockedTxns = transactions.filter((t) => t.status === "blocked");
    const capitalProtected = blockedTxns.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // 3. System Status Calculation
    const openCriticalAlerts = alerts.filter((a) => a.severity === "CRITICAL" && a.status !== "RESOLVED" && a.status !== "DISMISSED");
    const openWarningAlerts = alerts.filter((a) => (a.severity === "HIGH" || a.severity === "MEDIUM") && a.status !== "RESOLVED" && a.status !== "DISMISSED");

    let systemStatus = "PROTECTED";
    if (openCriticalAlerts.length > 0) {
      systemStatus = "CRITICAL";
    } else if (openWarningAlerts.length > 0) {
      systemStatus = "ATTENTION REQUIRED";
    }

    // 4. Spending & Income Over Time (Grouped by Day)
    const dailyMap = {};
    for (let i = parseInt(days, 10) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      dailyMap[dateKey] = { date: dateKey, spending: 0, income: 0, fraudAttempts: 0 };
    }

    let totalSpending = 0;
    let totalIncome = 0;

    periodTransactions.forEach((t) => {
      const dateKey = new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (dailyMap[dateKey]) {
        if (t.amount < 0 && t.status !== "blocked") {
          const deb = Math.abs(t.amount);
          dailyMap[dateKey].spending += deb;
          totalSpending += deb;
        } else if (t.amount > 0) {
          dailyMap[dateKey].income += t.amount;
          totalIncome += t.amount;
        }

        if (t.status === "flagged" || t.status === "blocked" || (t.fraud_score || t.score) >= 70) {
          dailyMap[dateKey].fraudAttempts += 1;
        }
      }
    });

    const spendingOverTime = Object.values(dailyMap);

    // 5. Category Breakdown
    const categoryMap = {};
    periodTransactions
      .filter((t) => t.amount < 0 && t.status !== "blocked")
      .forEach((t) => {
        const cat = t.merchantCategory || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount);
      });

    const spendingByCategory = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totalSpending > 0 ? Math.round((amount / totalSpending) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 6. Top Merchants
    const merchantMap = {};
    periodTransactions
      .filter((t) => t.amount < 0 && t.status !== "blocked")
      .forEach((t) => {
        if (!merchantMap[t.merchant]) {
          merchantMap[t.merchant] = { merchant: t.merchant, total: 0, count: 0 };
        }
        merchantMap[t.merchant].total += Math.abs(t.amount);
        merchantMap[t.merchant].count += 1;
      });

    const topMerchants = Object.values(merchantMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 7. Channel Volume Distribution
    const channelMap = { UPI: 0, Card: 0, ATM: 0, NEFT: 0, IMPS: 0 };
    transactions.forEach((t) => {
      const ch = t.type || "UPI";
      if (channelMap[ch] !== undefined) {
        channelMap[ch] += 1;
      } else {
        channelMap.UPI += 1;
      }
    });

    const totalTxnCount = transactions.length || 1;
    const channelDistribution = Object.entries(channelMap).map(([channel, count]) => ({
      channel,
      count,
      pct: Math.round((count / totalTxnCount) * 100),
    }));

    // 8. Risk Distribution
    const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    transactions.forEach((t) => {
      const rl = t.riskLevel || (t.fraud_score >= 80 ? "CRITICAL" : t.fraud_score >= 60 ? "HIGH" : t.fraud_score >= 30 ? "MEDIUM" : "LOW");
      if (riskLevels[rl] !== undefined) riskLevels[rl] += 1;
    });

    // 9. Anomaly Types Breakdown (from actual alerts and flagged txns)
    const anomalyCounts = {
      UNUSUAL_AMOUNT: 0,
      UNUSUAL_TIME: 0,
      UNUSUAL_LOCATION: 0,
      UNKNOWN_DEVICE: 0,
      HIGH_VELOCITY: 0,
      SUSPICIOUS_MERCHANT: 0,
      LARGE_TRANSFER: 0,
    };

    alerts.forEach((a) => {
      const t = a.type || a.threatType;
      if (anomalyCounts[t] !== undefined) {
        anomalyCounts[t] += 1;
      } else if (t) {
        anomalyCounts[t] = (anomalyCounts[t] || 0) + 1;
      }
    });

    const anomalyDistribution = Object.entries(anomalyCounts)
      .map(([type, count]) => ({
        type: type.replace(/_/g, " "),
        key: type,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // 10. Alert Severity Breakdown
    const severityCounts = {
      CRITICAL: alerts.filter((a) => a.severity === "CRITICAL").length,
      HIGH: alerts.filter((a) => a.severity === "HIGH").length,
      MEDIUM: alerts.filter((a) => a.severity === "MEDIUM").length,
      LOW: alerts.filter((a) => a.severity === "LOW").length,
    };

    // 11. Dynamic AI Security Advisory
    const advisory = generateSecurityAdvisory(alerts, transactions, accounts);

    // 12. Recent 5 Transactions
    const recentTransactions = transactions.slice(0, 5).map((t) => ({
      id: t.referenceId || t._id || t.id,
      merchant: t.merchant,
      bank: t.bankName,
      type: t.type,
      transactionType: t.transactionType,
      amount: t.amount,
      time: t.time,
      location: t.location,
      device: t.device || "Primary Mobile",
      status: t.status,
      fraud_score: t.fraud_score !== undefined ? t.fraud_score : t.riskScore || t.score,
      score: t.fraud_score !== undefined ? t.fraud_score : t.riskScore || t.score,
      riskLevel: t.riskLevel || (t.fraud_score >= 80 ? "CRITICAL" : t.fraud_score >= 60 ? "HIGH" : t.fraud_score >= 30 ? "MEDIUM" : "LOW"),
      risk_reason: t.risk_reason,
      scoreBreakdown: t.scoreBreakdown || [],
      merchantCategory: t.merchantCategory,
    }));

    res.json({
      success: true,
      totalBalance,
      monitoredAccounts,
      safeCount,
      safePercentage: Math.round((safeCount / totalTxnCount) * 100 * 10) / 10,
      threatCount,
      capitalProtected,
      systemStatus,
      spendingOverTime,
      totalSpending,
      totalIncome,
      netCashFlow: totalIncome - totalSpending,
      spendingByCategory,
      topMerchants,
      channelDistribution,
      riskDistribution: riskLevels,
      anomalyDistribution,
      severityCounts,
      advisory,
      recentTransactions,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Dashboard analytics error:", err);
    res.status(500).json({ error: "Failed to aggregate dashboard analytics" });
  }
});

export default router;
