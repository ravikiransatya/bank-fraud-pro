import express from "express";
import {
  getUserDevices,
  registerOrUpdateDevice,
  updateDeviceTrust,
  revokeUserDevice,
  removeUserDevice,
} from "../services/deviceService.js";
import { normalizeIndianPhone } from "./auth.js";

const router = express.Router();

// Helper to extract phone from query/body
const getPhone = (req) => {
  const raw = req.query.phone || req.body.phone;
  return normalizeIndianPhone(raw);
};

// GET /api/devices?phone=...&currentFingerprint=...
router.get("/", async (req, res) => {
  try {
    const phone = getPhone(req);
    const { currentFingerprint } = req.query;

    if (!phone) {
      return res.status(400).json({ error: "Phone parameter is required and must be valid." });
    }

    const devices = await getUserDevices(phone, currentFingerprint);

    const trustedCount = devices.filter((d) => d.trustStatus === "TRUSTED" && !d.isRevoked).length;
    const suspiciousCount = devices.filter((d) => d.trustStatus === "SUSPICIOUS" && !d.isRevoked).length;
    const revokedCount = devices.filter((d) => d.trustStatus === "REVOKED" || d.isRevoked).length;

    res.json({
      success: true,
      devices,
      trustedCount,
      suspiciousCount,
      revokedCount,
      totalCount: devices.length,
    });
  } catch (err) {
    console.error("Get devices error:", err);
    res.status(500).json({ error: "Failed to fetch user device records" });
  }
});

// GET /api/devices/:id?phone=...
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const phone = getPhone(req);

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const devices = await getUserDevices(phone);
    const device = devices.find((d) => d.id === id || d._id === id);

    if (!device) return res.status(404).json({ error: "Device not found for this user account." });

    res.json({
      success: true,
      device,
    });
  } catch (err) {
    console.error("Get device error:", err);
    res.status(500).json({ error: "Failed to fetch device details" });
  }
});

// POST /api/devices/register
router.post("/register", async (req, res) => {
  try {
    const phone = getPhone(req);
    const { clientMetadata = {}, isLogin = false } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    const device = await registerOrUpdateDevice({
      phone,
      clientMetadata,
      ipAddress: typeof ipAddress === "string" ? ipAddress.split(",")[0].trim() : "127.0.0.1",
      userAgent,
      isLogin,
    });

    res.json({
      success: true,
      device,
      message: "Device session registered successfully.",
    });
  } catch (err) {
    console.error("Register device error:", err);
    res.status(500).json({ error: "Failed to register device session" });
  }
});

// PATCH /api/devices/:id/trust
router.patch("/:id/trust", async (req, res) => {
  try {
    const { id } = req.params;
    const phone = getPhone(req);
    const { trustStatus = "TRUSTED" } = req.body;

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const updated = await updateDeviceTrust(phone, id, trustStatus);
    if (!updated) return res.status(404).json({ error: "Device not found for this user account." });

    res.json({
      success: true,
      device: updated,
      message: `Device marked as ${trustStatus}.`,
    });
  } catch (err) {
    console.error("Update device trust error:", err);
    res.status(500).json({ error: "Failed to update device trust status" });
  }
});

// PATCH /api/devices/:id/flag
router.patch("/:id/flag", async (req, res) => {
  try {
    const { id } = req.params;
    const phone = getPhone(req);

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const updated = await updateDeviceTrust(phone, id, "SUSPICIOUS");
    if (!updated) return res.status(404).json({ error: "Device not found for this user account." });

    res.json({
      success: true,
      device: updated,
      message: "Device flagged as suspicious.",
    });
  } catch (err) {
    console.error("Flag device error:", err);
    res.status(500).json({ error: "Failed to flag device" });
  }
});

// POST /api/devices/:id/revoke
router.post("/:id/revoke", async (req, res) => {
  try {
    const { id } = req.params;
    const phone = getPhone(req);

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const updated = await revokeUserDevice(phone, id);
    if (!updated) return res.status(404).json({ error: "Device not found for this user account." });

    res.json({
      success: true,
      device: updated,
      message: "Device access revoked immediately.",
    });
  } catch (err) {
    console.error("Revoke device error:", err);
    res.status(500).json({ error: "Failed to revoke device access" });
  }
});

// DELETE /api/devices/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const phone = getPhone(req);

    if (!phone) return res.status(400).json({ error: "Phone parameter is required." });

    const success = await removeUserDevice(phone, id);
    if (!success) return res.status(404).json({ error: "Device not found for this user account." });

    res.json({
      success: true,
      message: "Device record deleted successfully.",
    });
  } catch (err) {
    console.error("Remove device error:", err);
    res.status(500).json({ error: "Failed to remove device" });
  }
});

export default router;
