import express from "express";
import mongoose from "mongoose";
import BankAccount from "../models/BankAccount.js";
import AuditLog from "../models/AuditLog.js";
import { getUserDatasets } from "./analytics.js";
import { inMemoryStore } from "../seed/seedData.js";
import { emitSecurityEvent, EVENT_TYPES } from "../services/eventBus.js";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();

// GET /api/banks/linked?phone=...
router.get("/linked", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    const { accounts, transactions } = await getUserDatasets(phone);

    const formatted = accounts.map((acc, index) => {
      const txnCount = transactions.filter((t) => t.bankName === acc.shortName || t.bankName === acc.bankName).length;
      return {
        id: acc._id || acc.id || `acc_${index + 1}`,
        name: acc.bankName,
        shortName: acc.shortName,
        accountNo: acc.accountNo,
        balance: `₹${(acc.rawBalance || 0).toLocaleString("en-IN")}`,
        rawBalance: acc.rawBalance || 0,
        ifsc: acc.ifsc,
        color: acc.color,
        logo: acc.logo,
        type: acc.type,
        upiId: acc.upiId,
        status: acc.status || "ACTIVE",
        isFrozen: acc.isFrozen || acc.status === "FROZEN",
        lastSyncedAt: acc.lastSyncedAt || new Date(),
        txnCount,
      };
    });

    const totalBalance = formatted
      .filter((a) => !a.isFrozen)
      .reduce((sum, a) => sum + a.rawBalance, 0);

    res.json({
      success: true,
      accounts: formatted,
      totalBalance,
      monitoredAccounts: formatted.length,
    });
  } catch (err) {
    console.error("Get linked banks error:", err);
    res.status(500).json({ error: "Failed to fetch linked bank accounts" });
  }
});

// POST /api/banks/freeze -> Toggle Freeze on Accounts
router.post("/freeze", async (req, res) => {
  try {
    const { phone, freeze = true } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required" });
    }

    const newStatus = freeze ? "FROZEN" : "ACTIVE";
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        await BankAccount.updateMany({ phone }, { status: newStatus, isFrozen: freeze });
        await AuditLog.create({
          phone,
          eventType: freeze ? "ACCOUNT_FROZEN" : "ACCOUNT_UNFROZEN",
          details: freeze ? "User requested emergency freeze on all linked bank accounts." : "User lifted emergency freeze on all linked bank accounts.",
          ipAddress: req.ip || "127.0.0.1",
        });
      } catch (dbErr) {
        console.warn("MongoDB freeze update failed:", dbErr.message);
      }
    }

    if (inMemoryStore.accounts[phone]) {
      inMemoryStore.accounts[phone].forEach((a) => {
        a.status = newStatus;
        a.isFrozen = freeze;
      });
    }

    // Emit Real-Time Security Event Bus Dispatch
    emitSecurityEvent({
      phone,
      eventType: freeze ? EVENT_TYPES.ACCOUNT_FROZEN : EVENT_TYPES.ACCOUNT_UNFROZEN,
      severity: freeze ? "HIGH" : "LOW",
      title: freeze ? "Emergency Account Containment Engaged" : "Emergency Account Freeze Lifted",
      description: freeze ? "All linked banking institutions locked. Outgoing debits restricted." : "Normal operational transaction screening restored.",
      actor: "USER",
    });

    createNotification({
      phone,
      type: "SECURITY_ALERT",
      severity: freeze ? "CRITICAL" : "INFO",
      title: freeze ? "Emergency Freeze Active" : "Account Unfrozen",
      message: freeze ? "All linked accounts placed in freeze mode." : "Account operations restored.",
      link: "security-center",
    });

    res.json({
      success: true,
      frozen: freeze,
      message: freeze ? "All accounts frozen successfully." : "All accounts unfrozen and active.",
    });
  } catch (err) {
    console.error("Freeze accounts error:", err);
    res.status(500).json({ error: "Failed to update account freeze status" });
  }
});

export default router;