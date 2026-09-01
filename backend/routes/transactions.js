import express from "express";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import BankAccount from "../models/BankAccount.js";
import SecurityEvent from "../models/FraudLog.js";
import AuditLog from "../models/AuditLog.js";
import { getUserDatasets } from "./analytics.js";
import { inMemoryStore } from "../seed/seedData.js";
import { analyzeTransaction } from "../services/riskEngine.js";
import { emitSecurityEvent, EVENT_TYPES } from "../services/eventBus.js";
import { createNotification } from "../services/notificationService.js";
import { correlateIncident } from "../services/incidentService.js";

const router = express.Router();

// GET /api/transactions?phone=...&page=1&limit=10&search=...&type=...&riskLevel=...&bank=...
router.get("/", async (req, res) => {
  try {
    const {
      phone,
      search = "",
      type = "All",
      riskLevel = "All",
      bank = "All",
      page = 1,
      limit = 10,
    } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone number parameter required" });
    }

    const { transactions } = await getUserDatasets(phone);

    // Apply filtering
    let filtered = transactions.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.merchant.toLowerCase().includes(q) ||
        (t.bank && t.bank.toLowerCase().includes(q)) ||
        (t.bankName && t.bankName.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));

      const matchesType = type === "All" || t.type === type;

      const score = t.fraud_score !== undefined ? t.fraud_score : t.riskScore || t.score;
      const matchesRisk =
        riskLevel === "All" ||
        (riskLevel === "Safe" && score < 30 && t.status !== "blocked") ||
        (riskLevel === "Flagged" && score >= 30 && score < 70) ||
        (riskLevel === "HighRisk" && (score >= 70 || t.status === "blocked"));

      const bName = t.bank || t.bankName;
      const matchesBank = bank === "All" || bName?.toUpperCase() === bank;

      return matchesSearch && matchesType && matchesRisk && matchesBank;
    });

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const paginated = filtered.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    const formatted = paginated.map((t, idx) => ({
      id: t.referenceId || t._id || t.id || `TX-${idx + 1}`,
      referenceId: t.referenceId || t._id || t.id,
      bank: t.bankName,
      bankName: t.bankName,
      type: t.type,
      transactionType: t.transactionType || (t.amount > 0 ? "CREDIT" : "DEBIT"),
      amount: t.amount,
      merchant: t.merchant,
      merchantCategory: t.merchantCategory || "Other",
      time: t.time,
      location: t.location,
      device: t.device || "Primary Mobile",
      status: t.status,
      fraud_score: t.fraud_score !== undefined ? t.fraud_score : t.riskScore || t.score,
      score: t.fraud_score !== undefined ? t.fraud_score : t.riskScore || t.score,
      riskLevel: t.riskLevel || (t.fraud_score >= 80 ? "CRITICAL" : t.fraud_score >= 60 ? "HIGH" : t.fraud_score >= 30 ? "MEDIUM" : "LOW"),
      risk_reason: t.risk_reason || "Normal transaction baseline verified.",
      scoreBreakdown: t.scoreBreakdown || [],
      description: t.description,
      createdAt: t.createdAt,
    }));

    res.json({
      success: true,
      transactions: formatted,
      totalCount,
      totalPages,
      page: pageNum,
      limit: pageSize,
    });
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /api/transactions/:id -> Single transaction details with complete explainability
router.get("/:id", async (req, res) => {
  try {
    const { phone } = req.query;
    const { id } = req.params;
    if (!phone) return res.status(400).json({ error: "Phone parameter required" });

    const { transactions } = await getUserDatasets(phone);
    const txn = transactions.find((t) => (t.referenceId === id || t._id?.toString() === id || t.id === id));

    if (!txn) {
      return res.status(404).json({ error: "Transaction record not found" });
    }

    // If transaction doesn't have scoreBreakdown saved, analyze it dynamically
    const riskAssessment = txn.scoreBreakdown && txn.scoreBreakdown.length > 0
      ? {
          riskScore: txn.fraud_score !== undefined ? txn.fraud_score : txn.riskScore || txn.score,
          riskLevel: txn.riskLevel,
          scoreBreakdown: txn.scoreBreakdown,
          risk_reason: txn.risk_reason,
          recommendedAction: txn.recommendedAction || (txn.status === "blocked" ? "Quarantine & Block" : "Allow"),
        }
      : analyzeTransaction(txn, transactions);

    res.json({
      success: true,
      transaction: {
        id: txn.referenceId || txn._id || txn.id,
        referenceId: txn.referenceId || txn._id || txn.id,
        bank: txn.bankName,
        bankName: txn.bankName,
        type: txn.type,
        transactionType: txn.transactionType || (txn.amount > 0 ? "CREDIT" : "DEBIT"),
        amount: txn.amount,
        merchant: txn.merchant,
        merchantCategory: txn.merchantCategory || "Other",
        time: txn.time,
        location: txn.location,
        device: txn.device || "Primary Mobile",
        status: txn.status,
        fraud_score: riskAssessment.riskScore,
        score: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        risk_reason: riskAssessment.risk_reason,
        scoreBreakdown: riskAssessment.scoreBreakdown,
        recommendedAction: riskAssessment.recommendedAction,
        description: txn.description,
        createdAt: txn.createdAt,
      },
    });
  } catch (err) {
    console.error("Get single transaction error:", err);
    res.status(500).json({ error: "Failed to fetch transaction details" });
  }
});

// POST /api/transactions -> Process & Analyze New Transaction through Risk Engine
router.post("/", async (req, res) => {
  try {
    const {
      phone,
      bankName = "SBI",
      merchant,
      amount,
      type = "UPI",
      location = "Vadodara, GJ",
      device = "Primary Mobile",
      merchantCategory = "Shopping",
    } = req.body;

    if (!phone || !merchant || !amount) {
      return res.status(400).json({ error: "Phone, merchant, and amount are required" });
    }

    const { accounts, transactions: recentHistory } = await getUserDatasets(phone);

    // 0. Account Containment Check
    const anyFrozen = accounts.some((a) => a.isFrozen);
    if (anyFrozen) {
      return res.status(403).json({
        error: "Emergency Account Freeze is currently active. Outgoing transactions are restricted at the application level.",
      });
    }

    const numAmount = Math.abs(parseFloat(amount));

    const refId = `TX-${Math.floor(1050 + Math.random() * 9000)}`;
    const now = new Date();

    const incomingPayload = {
      phone,
      referenceId: refId,
      bankName,
      type,
      amount: -numAmount,
      merchant,
      merchantCategory,
      location,
      device,
      createdAt: now,
    };

    // 1. Centralized Risk Engine Evaluation (10 Factors + XAI Breakdown)
    const riskAssessment = analyzeTransaction(incomingPayload, recentHistory);

    const newTxn = {
      ...incomingPayload,
      transactionType: "DEBIT",
      currency: "INR",
      time: `Today, ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      status: riskAssessment.status,
      fraud_score: riskAssessment.riskScore,
      riskScore: riskAssessment.riskScore,
      riskLevel: riskAssessment.riskLevel,
      risk_reason: riskAssessment.risk_reason,
      scoreBreakdown: riskAssessment.scoreBreakdown,
      recommendedAction: riskAssessment.recommendedAction,
      description: `${type} payment to ${merchant}`,
      isFlagged: riskAssessment.status === "flagged",
      isBlocked: riskAssessment.status === "blocked",
      createdAt: now,
    };

    const isDbConnected = mongoose.connection.readyState === 1;

    // 2. Persist Transaction & Auto-Deduct Balance if Not Blocked
    if (isDbConnected) {
      try {
        await Transaction.create(newTxn);

        if (riskAssessment.status !== "blocked") {
          await BankAccount.findOneAndUpdate(
            { phone, $or: [{ shortName: bankName }, { bankName }] },
            { $inc: { rawBalance: -numAmount } }
          );
        }

        // 3. Automatically Create Categorized Security Event Alert if Flagged/Blocked
        if (riskAssessment.isAlertRequired) {
          await SecurityEvent.create({
            phone,
            referenceId: `ALT-${Math.floor(910 + Math.random() * 900)}`,
            transactionId: refId,
            type: riskAssessment.threatType,
            severity: riskAssessment.riskLevel,
            riskScore: riskAssessment.riskScore,
            title: riskAssessment.status === "blocked"
              ? `Unauthorized Outflow Quarantined: ${merchant}`
              : `High-Risk ${type} Anomaly Flagged: ${merchant}`,
            description: `₹${numAmount.toLocaleString("en-IN")} payment to ${merchant} flagged: ${riskAssessment.risk_reason}`,
            account: `${bankName} Bank`,
            amount: numAmount,
            status: riskAssessment.status === "blocked" ? "BLOCKED" : "NEW",
            indicators: riskAssessment.scoreBreakdown.map((b) => `${b.factor} (${b.points}): ${b.reason}`),
            scoreBreakdown: riskAssessment.scoreBreakdown,
            detectedAt: now,
          });
        }

        await AuditLog.create({
          phone,
          eventType: riskAssessment.status === "blocked" ? "TRANSACTION_BLOCKED" : "TRANSACTION_PROCESSED",
          details: `Processed ${type} payment of ₹${numAmount} to ${merchant}. Evaluated Risk Score: ${riskAssessment.riskScore}% (${riskAssessment.riskLevel}). Action: ${riskAssessment.recommendedAction}`,
          ipAddress: req.ip || "127.0.0.1",
        });
      } catch (dbErr) {
        console.warn("MongoDB write failed:", dbErr.message);
      }
    }

    // In-Memory Update
    if (inMemoryStore.transactions[phone]) {
      inMemoryStore.transactions[phone].unshift({ ...newTxn, id: refId });
    }
    if (inMemoryStore.accounts[phone] && riskAssessment.status !== "blocked") {
      const acc = inMemoryStore.accounts[phone].find((a) => a.shortName === bankName || a.bankName === bankName);
      if (acc) acc.rawBalance -= numAmount;
    }

    // If alert created in-memory
    if (riskAssessment.isAlertRequired && inMemoryStore.alerts[phone]) {
      const alertId = `ALT-${Math.floor(910 + Math.random() * 900)}`;
      inMemoryStore.alerts[phone].unshift({
        id: alertId,
        referenceId: alertId,
        phone,
        transactionId: refId,
        type: riskAssessment.threatType,
        severity: riskAssessment.riskLevel,
        riskScore: riskAssessment.riskScore,
        title: riskAssessment.status === "blocked"
          ? `Unauthorized Outflow Quarantined: ${merchant}`
          : `High-Risk ${type} Anomaly Flagged: ${merchant}`,
        description: `₹${numAmount.toLocaleString("en-IN")} payment to ${merchant} flagged: ${riskAssessment.risk_reason}`,
        account: `${bankName} Bank`,
        amount: numAmount,
        status: riskAssessment.status === "blocked" ? "BLOCKED" : "NEW",
        indicators: riskAssessment.scoreBreakdown.map((b) => `${b.factor} (${b.points}): ${b.reason}`),
        scoreBreakdown: riskAssessment.scoreBreakdown,
        detectedAt: now,
      });
    }

    // 4. Real-time Security Event Bus Publication
    emitSecurityEvent({
      phone,
      eventType: riskAssessment.status === "blocked"
        ? EVENT_TYPES.HIGH_RISK_TRANSACTION
        : riskAssessment.status === "flagged"
        ? EVENT_TYPES.RISK_DETECTED
        : EVENT_TYPES.TRANSACTION_CREATED,
      severity: riskAssessment.riskLevel,
      title: `${type} Transaction ${riskAssessment.status === "blocked" ? "Quarantined" : riskAssessment.status === "flagged" ? "Flagged" : "Executed"}: ${merchant}`,
      description: `₹${numAmount.toLocaleString("en-IN")} debit on ${bankName} Bank. Evaluated Risk: ${riskAssessment.riskScore}% (${riskAssessment.riskLevel}).`,
      account: `${bankName} Bank`,
      transactionId: refId,
      actor: "USER",
    });

    // 5. In-App Notification Dispatch
    if (riskAssessment.isAlertRequired) {
      createNotification({
        phone,
        type: "SECURITY_ALERT",
        severity: riskAssessment.riskLevel === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: riskAssessment.status === "blocked"
          ? `Unauthorized Outflow Quarantined: ${merchant}`
          : `High-Risk Transaction Flagged: ${merchant}`,
        message: `₹${numAmount.toLocaleString("en-IN")} payment flagged: ${riskAssessment.risk_reason}`,
        relatedTransactionId: refId,
        link: "alerts",
      });

      // 6. Security Incident Correlation for Critical Incursions
      if (riskAssessment.riskScore >= 75) {
        correlateIncident({
          phone,
          title: `Suspicious Transaction Pattern: ${merchant}`,
          severity: riskAssessment.riskLevel,
          summary: `₹${numAmount.toLocaleString("en-IN")} outflow evaluated at ${riskAssessment.riskScore}% risk score. ${riskAssessment.risk_reason}`,
          relatedTransactionIds: [refId],
          device,
          location,
        });
      }
    }

    res.json({
      success: true,
      transaction: newTxn,
      riskAssessment,
      message: riskAssessment.status === "blocked"
        ? "Transaction automatically quarantined by BankGuard AI security perimeter."
        : "Transaction verified and processed successfully.",
    });
  } catch (err) {
    console.error("Execute transaction error:", err);
    res.status(500).json({ error: "Failed to execute transaction" });
  }
});

// POST /api/transactions/:id/action -> Security Actions (BLOCK, MARK_SAFE, INVESTIGATE)
router.post("/:id/action", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, action } = req.body; // 'BLOCK' | 'MARK_SAFE' | 'INVESTIGATE'

    if (!phone || !action) {
      return res.status(400).json({ error: "Phone and action parameters are required" });
    }

    let newStatus = "completed";
    let isBlocked = false;
    let desc = "";

    if (action === "BLOCK") {
      newStatus = "blocked";
      isBlocked = true;
      desc = "Transaction and merchant quarantined by security team.";
    } else if (action === "MARK_SAFE") {
      newStatus = "completed";
      isBlocked = false;
      desc = "Transaction marked as verified legitimate by user.";
    } else if (action === "INVESTIGATE") {
      newStatus = "flagged";
      isBlocked = false;
      desc = "Transaction placed under active fraud investigation.";
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        await Transaction.findOneAndUpdate(
          { phone, $or: [{ referenceId: id }, { _id: id }] },
          { status: newStatus, isBlocked }
        );

        await AuditLog.create({
          phone,
          eventType: `TRANSACTION_${action}`,
          details: `Action ${action} executed for transaction ${id}. ${desc}`,
          ipAddress: req.ip || "127.0.0.1",
        });
      } catch (dbErr) {
        console.warn("MongoDB update failed:", dbErr.message);
      }
    }

    // In-memory update
    if (inMemoryStore.transactions[phone]) {
      const txn = inMemoryStore.transactions[phone].find((t) => t.referenceId === id || t.id === id || t._id === id);
      if (txn) {
        txn.status = newStatus;
        txn.isBlocked = isBlocked;
      }
    }

    res.json({
      success: true,
      transactionId: id,
      action,
      status: newStatus,
      message: `Transaction ${id} successfully updated to ${newStatus}.`,
    });
  } catch (err) {
    console.error("Transaction action error:", err);
    res.status(500).json({ error: "Failed to perform security action on transaction" });
  }
});

export default router;