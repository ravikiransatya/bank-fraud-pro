import express from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService.js";

const router = express.Router();

// GET /api/notifications?phone=...&filter=...
router.get("/", async (req, res) => {
  try {
    const { phone, filter = "ALL" } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const result = getUserNotifications(phone, filter);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const success = markNotificationRead(phone, id);
    res.json({
      success,
      message: success ? "Notification marked as read." : "Notification not found.",
    });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ error: "Failed to update notification state" });
  }
});

// POST /api/notifications/read-all
router.post("/read-all", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const count = markAllNotificationsRead(phone);
    res.json({
      success: true,
      markedCount: count,
      message: `Marked ${count} notifications as read.`,
    });
  } catch (err) {
    console.error("Mark all read error:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
