import express from "express";
import { getIncidents, updateIncidentAction } from "../services/incidentService.js";

const router = express.Router();

// GET /api/incidents?phone=...&status=...
router.get("/", async (req, res) => {
  try {
    const { phone, status = "ALL" } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const incidents = getIncidents(phone, status);
    const openCount = incidents.filter((i) => i.status === "OPEN").length;
    const investigatingCount = incidents.filter((i) => i.status === "INVESTIGATING").length;

    res.json({
      success: true,
      incidents,
      openCount,
      investigatingCount,
      totalCount: incidents.length,
    });
  } catch (err) {
    console.error("Get incidents error:", err);
    res.status(500).json({ error: "Failed to fetch security incidents" });
  }
});

// GET /api/incidents/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: "Phone parameter is required" });

    const incidents = getIncidents(phone, "ALL");
    const inc = incidents.find((i) => i.incidentId === id || i.id === id);

    if (!inc) return res.status(404).json({ error: "Security incident not found" });

    res.json({
      success: true,
      incident: inc,
    });
  } catch (err) {
    console.error("Get incident details error:", err);
    res.status(500).json({ error: "Failed to fetch incident details" });
  }
});

// PATCH /api/incidents/:id/action
router.patch("/:id/action", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, action } = req.body; // 'CONTAIN' | 'INVESTIGATE' | 'RESOLVE' | 'DISMISS'
    if (!phone || !action) return res.status(400).json({ error: "Phone and action are required" });

    const updated = updateIncidentAction(phone, id, action);
    if (!updated) return res.status(404).json({ error: "Security incident not found" });

    res.json({
      success: true,
      incident: updated,
      message: `Incident ${id} updated with action ${action}.`,
    });
  } catch (err) {
    console.error("Update incident action error:", err);
    res.status(500).json({ error: "Failed to perform action on incident" });
  }
});

export default router;
