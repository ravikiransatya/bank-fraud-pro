import express from "express";
import mongoose from "mongoose";
import SecurityEvent from "../models/FraudLog.js";
import Transaction from "../models/Transaction.js";
import AuditLog from "../models/AuditLog.js";
import { getUserDatasets } from "./analytics.js";
import { inMemoryStore } from "../seed/seedData.js";
import { analyzeTransaction } from "../services/riskEngine.js";

const router = express.Router();

// GET /api/fraud/alerts?phone=...&status=...&severity=...&sortBy=...
router.get("/alerts", async (req, res) => {
  try {
    const {
      phone,
      status = "All",
      severity = "All",
      sortBy = "detectedAt", // 'riskScore' | 'amount' | 'detectedAt' | 'severity'
      order = "desc",
    } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    const { alerts } = await getUserDatasets(phone);

    // Filter alerts
    let filtered = alerts.filter((a) => {
      const aStatus = a.status ? a.status.toUpperCase() : "OPEN";
      const aSev = a.severity ? a.severity.toUpperCase() : (a.level ? a.level.toUpperCase() : "MEDIUM");

      const matchesStatus =
        status === "All" ||
        (status === "Active" && aStatus !== "RESOLVED" && aStatus !== "DISMISSED") ||
        (status === "New" && (aStatus === "NEW" || aStatus === "OPEN")) ||
        (status === "Investigating" && aStatus === "INVESTIGATING") ||
        (status === "Resolved" && aStatus === "RESOLVED") ||
        (status === "Dismissed" && aStatus === "DISMISSED") ||
        (status === "Blocked" && aStatus === "BLOCKED") ||
        aStatus === status.toUpperCase();

      const matchesSeverity =
        severity === "All" ||
        aSev === severity.toUpperCase();

      return matchesStatus && matchesSeverity;
    });

    // Sorting
    filtered.sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      if (sortBy === "riskScore") {
        return ((a.riskScore || a.score || 0) - (b.riskScore || b.score || 0)) * dir;
      }
      if (sortBy === "amount") {
        return ((a.amount || 0) - (b.amount || 0)) * dir;
      }
      if (sortBy === "severity") {
        const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const sevA = rank[a.severity?.toUpperCase() || "MEDIUM"] || 2;
        const sevB = rank[b.severity?.toUpperCase() || "MEDIUM"] || 2;
        return (sevA - sevB) * dir;
      }
      // default: detectedAt
      const dateA = new Date(a.detectedAt || a.createdAt || Date.now()).getTime();
      const dateB = new Date(b.detectedAt || b.createdAt || Date.now()).getTime();
      return (dateA - dateB) * dir;
    });

    const formatted = filtered.map((a, idx) => ({
      id: a.referenceId || a._id?.toString() || a.id || `ALT-${idx + 1}`,
      referenceId: a.referenceId || a._id?.toString() || a.id || `ALT-${idx + 1}`,
      transactionId: a.transactionId,
      level: (a.severity || "MEDIUM").toLowerCase(),
      severity: (a.severity || "MEDIUM").toUpperCase(),
      threatType: a.type || "UNUSUAL_ACTIVITY",
      title: a.title,
      desc: a.description,
      description: a.description,
      score: a.riskScore || a.score || 50,
      riskScore: a.riskScore || a.score || 50,
      time: a.detectedAt ? new Date(a.detectedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) : "Recently",
      account: a.account || "Linked Bank Account",
      amount: a.amount || 0,
      status: a.status ? a.status.toUpperCase() : "OPEN",
      indicators: a.indicators || [],
      scoreBreakdown: a.scoreBreakdown || [],
      actionTaken: a.actionTaken,
      resolvedAt: a.resolvedAt,
      detectedAt: a.detectedAt,
    }));

    const totalActive = alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED").length;
    const criticalCount = alerts.filter((a) => (a.severity === "CRITICAL" || a.level === "critical") && a.status !== "RESOLVED" && a.status !== "DISMISSED").length;
    const investigatingCount = alerts.filter((a) => a.status === "INVESTIGATING").length;
    const blockedCount = alerts.filter((a) => a.status === "BLOCKED").length;
    const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

    res.json({
      success: true,
      alerts: formatted,
      totalCount: formatted.length,
      metrics: {
        totalActive,
        criticalCount,
        investigatingCount,
        blockedCount,
        resolvedCount,
      },
    });
  } catch (err) {
    console.error("Get fraud alerts error:", err);
    res.status(500).json({ error: "Failed to fetch fraud alerts" });
  }
});

// GET /api/fraud/alerts/:id/investigate -> Deep Investigation Details
router.get("/alerts/:id/investigate", async (req, res) => {
  try {
    const { phone } = req.query;
    const { id } = req.params;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const { alerts, transactions } = await getUserDatasets(phone);
    const alert = alerts.find((a) => a.referenceId === id || a.id === id || a._id?.toString() === id);

    if (!alert) {
      return res.status(404).json({ error: "Security alert record not found" });
    }

    const relatedTxn = alert.transactionId
      ? transactions.find((t) => t.referenceId === alert.transactionId || t.id === alert.transactionId)
      : null;

    // Generate factor breakdown if not already saved
    let breakdown = alert.scoreBreakdown || [];
    if (breakdown.length === 0 && relatedTxn) {
      const evaluated = analyzeTransaction(relatedTxn, transactions);
      breakdown = evaluated.scoreBreakdown;
    }

    res.json({
      success: true,
      alert: {
        ...alert,
        id: alert.referenceId || alert.id,
        severity: alert.severity || "MEDIUM",
        status: alert.status || "OPEN",
        scoreBreakdown: breakdown,
      },
      transaction: relatedTxn,
    });
  } catch (err) {
    console.error("Investigate alert error:", err);
    res.status(500).json({ error: "Failed to fetch alert investigation details" });
  }
});

// PATCH /api/fraud/alerts/:id -> Lifecycle Management (INVESTIGATE, BLOCK, MARK_SAFE, DISMISS, RESOLVE)
router.patch("/alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, action = "resolve" } = req.body; // 'safe' | 'quarantine' | 'investigate' | 'dismiss' | 'resolve'

    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    let newStatus = "RESOLVED";
    let actionDesc = "Threat resolved by user.";
    let txnStatus = "completed";

    switch (action.toLowerCase()) {
      case "quarantine":
      case "block":
        newStatus = "BLOCKED";
        actionDesc = "Transaction quarantined, funds held, and recipient VPA blocked.";
        txnStatus = "blocked";
        break;
      case "investigate":
        newStatus = "INVESTIGATING";
        actionDesc = "Alert assigned to active security fraud investigation.";
        txnStatus = "flagged";
        break;
      case "dismiss":
        newStatus = "DISMISSED";
        actionDesc = "Alert dismissed as low operational priority.";
        txnStatus = "completed";
        break;
      case "safe":
      case "resolve":
      default:
        newStatus = "RESOLVED";
        actionDesc = "User confirmed transaction as legitimate authorized activity.";
        txnStatus = "completed";
        break;
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        const alert = await SecurityEvent.findOneAndUpdate(
          { phone, $or: [{ referenceId: id }, { _id: id }] },
          { status: newStatus, resolvedAt: new Date(), actionTaken: actionDesc },
          { new: true }
        );

        if (alert && alert.transactionId) {
          await Transaction.findOneAndUpdate(
            { phone, $or: [{ referenceId: alert.transactionId }, { _id: alert.transactionId }] },
            { status: txnStatus, isBlocked: newStatus === "BLOCKED" }
          );
        }

        await AuditLog.create({
          phone,
          eventType: `ALERT_${newStatus}`,
          details: `Security event ${id} updated to ${newStatus}. ${actionDesc}`,
          ipAddress: req.ip || "127.0.0.1",
        });
      } catch (dbErr) {
        console.warn("MongoDB alert update failed:", dbErr.message);
      }
    }

    // In-Memory Update
    if (inMemoryStore.alerts[phone]) {
      const al = inMemoryStore.alerts[phone].find((a) => a.referenceId === id || a.id === id || a._id === id);
      if (al) {
        al.status = newStatus;
        al.actionTaken = actionDesc;
        al.resolvedAt = new Date();

        if (al.transactionId && inMemoryStore.transactions[phone]) {
          const t = inMemoryStore.transactions[phone].find((txn) => txn.referenceId === al.transactionId || txn.id === al.transactionId);
          if (t) {
            t.status = txnStatus;
            t.isBlocked = newStatus === "BLOCKED";
          }
        }
      }
    }

    res.json({
      success: true,
      id,
      status: newStatus,
      message: `Alert ${id} updated to ${newStatus}.`,
      actionTaken: actionDesc,
    });
  } catch (err) {
    console.error("Update alert error:", err);
    res.status(500).json({ error: "Failed to update threat alert" });
  }
});

export default router;