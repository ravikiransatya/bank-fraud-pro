import express from "express";
import { getSecurityEvents, emitSecurityEvent, EVENT_TYPES } from "../services/eventBus.js";
import { calculateAccountSecurityScore } from "../services/accountSecurityService.js";
import { getUserDatasets } from "./analytics.js";
import { correlateIncident } from "../services/incidentService.js";
import { createNotification } from "../services/notificationService.js";
import { updateDeviceTrust } from "../services/deviceService.js";

const router = express.Router();

// GET /api/security-ops/feed?phone=...&severity=...&limit=...
router.get("/feed", async (req, res) => {
  try {
    const { phone, severity = "ALL", limit = 50 } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const events = getSecurityEvents(phone, {
      limit: parseInt(limit, 10) || 50,
      severity,
    });

    res.json({
      success: true,
      events,
      totalCount: events.length,
    });
  } catch (err) {
    console.error("Get security feed error:", err);
    res.status(500).json({ error: "Failed to fetch live security operations feed" });
  }
});

// GET /api/security-ops/summary?phone=...
router.get("/summary", async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const { accounts, transactions, alerts } = await getUserDatasets(phone);

    const securityReport = await calculateAccountSecurityScore({
      phone,
      accounts,
      transactions,
      alerts,
    });

    res.json({
      success: true,
      ...securityReport,
    });
  } catch (err) {
    console.error("Get security summary error:", err);
    res.status(500).json({ error: "Failed to calculate account security score" });
  }
});

// POST /api/security-ops/simulate -> Controlled Real-Time Security Simulations
router.post("/simulate", async (req, res) => {
  try {
    const { phone, scenario } = req.body;
    if (!phone || !scenario) {
      return res.status(400).json({ error: "Phone and scenario are required" });
    }

    let result = {};

    switch (scenario.toLowerCase()) {
      case "unknown_device": {
        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.UNKNOWN_DEVICE,
          severity: "HIGH",
          title: "New Hardware Fingerprint Detected",
          description: "Unrecognized macOS Apple Silicon Safari client initiated authentication from Delhi.",
          account: "Security Perimeter",
          source: "DEVICE_GUARD",
          actor: "SYSTEM",
        });

        createNotification({
          phone,
          type: "DEVICE_DETECTED",
          severity: "WARNING",
          title: "Unrecognized Device Login Attempt",
          message: "New macOS device login detected from New Delhi.",
          link: "devices",
        });

        result = { scenario: "UNKNOWN_DEVICE", message: "Simulated unknown device event published." };
        break;
      }

      case "impossible_travel": {
        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.UNKNOWN_LOCATION,
          severity: "CRITICAL",
          title: "Impossible Travel Anomaly Flagged",
          description: "Concurrent access detected in Hyderabad and Delhi within 8 minutes (Impossible velocity: 1,250 km/h).",
          account: "Multi-Session Guard",
          source: "GEOFENCE_ENGINE",
          actor: "SYSTEM",
        });

        correlateIncident({
          phone,
          title: "Impossible Travel & Concurrent Geo-Location Incursion",
          severity: "CRITICAL",
          summary: "Simultaneous access requests initiated from Hyderabad and Delhi within 8 minutes.",
          triggeredRules: ["RULE_003 (Impossible Travel)", "RULE_009 (Simultaneous Locations)"],
          location: "Hyderabad (14:00) / Delhi (14:08)",
          device: "Multiple Unrecognized Clients",
        });

        createNotification({
          phone,
          type: "SECURITY_ALERT",
          severity: "CRITICAL",
          title: "Critical Geofence Breach Flagged",
          message: "Impossible travel detected between Hyderabad and Delhi.",
          link: "alerts",
        });

        result = { scenario: "IMPOSSIBLE_TRAVEL", message: "Simulated impossible travel anomaly and incident correlated." };
        break;
      }

      case "velocity_burst": {
        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.VELOCITY_ANOMALY,
          severity: "HIGH",
          title: "Rapid Sequential Debit Spike",
          description: "5 rapid UPI payment attempts initiated within 90 seconds. Transaction throttling active.",
          account: "HDFC · •••• 8834",
          source: "VELOCITY_MONITOR",
          actor: "SYSTEM",
        });

        createNotification({
          phone,
          type: "TRANSACTION_FLAGGED",
          severity: "WARNING",
          title: "Elevated Transaction Velocity",
          message: "5 rapid transactions initiated in under 2 minutes.",
          link: "transactions",
        });

        result = { scenario: "VELOCITY_BURST", message: "Simulated velocity anomaly event recorded." };
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown simulation scenario: ${scenario}` });
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Failed to execute simulation" });
  }
});

export default router;
