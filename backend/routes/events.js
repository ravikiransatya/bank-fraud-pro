import express from "express";
import { subscribeToEvents } from "../services/eventBus.js";
import { normalizeIndianPhone } from "./auth.js";

const router = express.Router();

// GET /api/events/stream?phone=...
router.get("/stream", (req, res) => {
  const rawPhone = req.query.phone;
  const phone = normalizeIndianPhone(rawPhone);

  if (!phone) {
    return res.status(400).json({ error: "Valid phone parameter is required for real-time stream." });
  }

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection confirmation
  const initMessage = {
    type: "CONNECTED",
    phone,
    timestamp: new Date().toISOString(),
    message: "BankGuard AI Real-Time SSE Stream Connected",
  };
  res.write(`data: ${JSON.stringify(initMessage)}\n\n`);

  // Subscribe to Event Bus
  subscribeToEvents(phone, res);

  // Keep-alive heartbeat comment every 15 seconds to prevent proxy timeout
  const keepAlive = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch (err) {
      clearInterval(keepAlive);
    }
  }, 15000);

  res.on("close", () => {
    clearInterval(keepAlive);
  });
});

export default router;
