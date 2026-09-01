/**
 * BankGuard AI — Real Database-Backed Device Trust Management Service
 * Manages login-aware device registrations, fingerprinting, dynamic risk scoring, and security lifecycles.
 */

import mongoose from "mongoose";
import Device from "../models/Device.js";
import { emitSecurityEvent, EVENT_TYPES } from "./eventBus.js";

// In-Memory Device Store for dual local development fallback when MongoDB daemon is offline
export const inMemoryDevicesStore = {
  devices: {}, // Keyed by phone: Array of Device objects
};

/**
 * Calculates a dynamic, multi-factor risk score for a device.
 * @param {Object} device - Device record with telemetry metadata
 * @param {Object} context - Optional environmental context
 * @returns {Number} Risk score between 1 and 100
 */
export const calculateDeviceRisk = (device, context = {}) => {
  if (!device) return 50;

  // Revoked devices automatically receive 100% risk
  if (device.isRevoked || device.trustStatus === "REVOKED") {
    return 100;
  }

  let score = 5; // Nominal baseline for recognized hardware

  // 1. Trust status weight
  if (device.trustStatus === "SUSPICIOUS") {
    score += 60;
  } else if (device.trustStatus === "PENDING_REVIEW") {
    score += 30;
  }

  // 2. Hardware / OS / UserAgent checks
  const os = (device.operatingSystem || "").toLowerCase();
  const ua = (device.userAgent || "").toLowerCase();
  if (ua.includes("headless") || ua.includes("bot") || ua.includes("crawler")) {
    score += 45;
  } else if (os.includes("linux") && !ua.includes("android")) {
    score += 20; // Generic Linux without mobile/standard desktop signatures
  }

  // 3. Timezone vs Expected regional baseline
  const tz = (device.timezone || "").toLowerCase();
  if (tz && !tz.includes("kolkata") && !tz.includes("calcutta") && !tz.includes("asia")) {
    score += 15; // Non-Indian timezone for Indian banking user
  }

  // 4. Age of device registration
  const firstSeen = device.firstSeenAt ? new Date(device.firstSeenAt).getTime() : Date.now();
  const ageHours = (Date.now() - firstSeen) / (1000 * 60 * 60);
  if (ageHours < 1 && device.trustStatus !== "TRUSTED") {
    score += 10; // Brand new device in first hour
  }

  // 5. If marked Trusted without headless/bot/suspicious indicators, guarantee safe bounds (2 - 10%)
  const hasCriticalAnomaly = ua.includes("headless") || ua.includes("bot") || ua.includes("crawler");
  if (device.trustStatus === "TRUSTED" && !device.isRevoked && !hasCriticalAnomaly) {
    score = Math.min(score, 10);
    score = Math.max(score, 2);
  }

  return Math.min(100, Math.max(1, Math.round(score)));
};

/**
 * Helper to check if MongoDB is active and ready
 */
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Registers or updates a device session upon user authentication or heartbeat.
 */
export const registerOrUpdateDevice = async ({
  phone,
  userId = null,
  clientMetadata = {},
  ipAddress = "127.0.0.1",
  userAgent = "",
  isLogin = false,
}) => {
  if (!phone) return null;

  const fingerprint = clientMetadata.deviceFingerprint || "dev_fingerprint_generic";
  const deviceName = clientMetadata.deviceName || `${clientMetadata.operatingSystem || "Windows"} PC (${clientMetadata.browser || "Browser"})`;
  const now = new Date();

  let device = null;

  if (isDbConnected()) {
    try {
      device = await Device.findOne({ phone, deviceFingerprint: fingerprint });

      if (device) {
        // Update existing device
        device.lastSeenAt = now;
        if (isLogin) {
          device.lastLoginAt = now;
          device.ipAddress = ipAddress;
        }
        if (clientMetadata.screenResolution) device.screenResolution = clientMetadata.screenResolution;
        if (clientMetadata.timezone) device.timezone = clientMetadata.timezone;
        if (clientMetadata.language) device.language = clientMetadata.language;

        device.riskScore = calculateDeviceRisk(device);
        await device.save();
      } else {
        // Create new device for user
        const totalUserDevices = await Device.countDocuments({ phone });
        const defaultTrust = totalUserDevices === 0 ? "TRUSTED" : "TRUSTED";

        device = await Device.create({
          userId,
          phone,
          deviceFingerprint: fingerprint,
          deviceName,
          deviceType: clientMetadata.deviceType || "Desktop",
          operatingSystem: clientMetadata.operatingSystem || "Windows",
          osVersion: clientMetadata.osVersion || "11",
          browser: clientMetadata.browser || "Chrome",
          browserVersion: clientMetadata.browserVersion || "Latest",
          userAgent: userAgent || clientMetadata.userAgent || "",
          ipAddress,
          location: clientMetadata.location || "Vadodara, Gujarat",
          country: clientMetadata.country || "India",
          city: clientMetadata.city || "Vadodara",
          timezone: clientMetadata.timezone || "Asia/Kolkata",
          screenResolution: clientMetadata.screenResolution || "1920x1080",
          language: clientMetadata.language || "en-US",
          firstSeenAt: now,
          lastSeenAt: now,
          lastLoginAt: now,
          isCurrentDevice: true,
          trustStatus: defaultTrust,
          riskScore: 4,
          isRevoked: false,
        });

        // Emit security event for new device detection
        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.UNKNOWN_DEVICE,
          severity: "LOW",
          title: `New Device Registered: ${deviceName}`,
          description: `Browser session registered from ${clientMetadata.operatingSystem || "Desktop"} (${ipAddress}).`,
          actor: "AUTHENTICATION_GATEWAY",
          metadata: { deviceFingerprint: fingerprint },
        });
      }

      return device.toObject ? device.toObject() : device;
    } catch (err) {
      console.warn("DB error in registerOrUpdateDevice, falling back to memory:", err.message);
    }
  }

  // Dual Fallback: In-Memory Store
  if (!inMemoryDevicesStore.devices[phone]) {
    inMemoryDevicesStore.devices[phone] = [];
  }

  const existingIndex = inMemoryDevicesStore.devices[phone].findIndex(
    (d) => d.deviceFingerprint === fingerprint
  );

  if (existingIndex !== -1) {
    const existing = inMemoryDevicesStore.devices[phone][existingIndex];
    existing.lastSeenAt = now;
    if (isLogin) {
      existing.lastLoginAt = now;
      existing.ipAddress = ipAddress;
    }
    existing.riskScore = calculateDeviceRisk(existing);
    device = existing;
  } else {
    const isFirst = inMemoryDevicesStore.devices[phone].length === 0;
    const newId = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;

    device = {
      _id: newId,
      id: newId,
      userId,
      phone,
      deviceFingerprint: fingerprint,
      deviceName,
      deviceType: clientMetadata.deviceType || "Desktop",
      operatingSystem: clientMetadata.operatingSystem || "Windows",
      osVersion: clientMetadata.osVersion || "11",
      browser: clientMetadata.browser || "Chrome",
      browserVersion: clientMetadata.browserVersion || "Latest",
      userAgent: userAgent || clientMetadata.userAgent || "",
      ipAddress,
      location: clientMetadata.location || "Vadodara, Gujarat",
      country: clientMetadata.country || "India",
      city: clientMetadata.city || "Vadodara",
      timezone: clientMetadata.timezone || "Asia/Kolkata",
      screenResolution: clientMetadata.screenResolution || "1920x1080",
      language: clientMetadata.language || "en-US",
      firstSeenAt: now,
      lastSeenAt: now,
      lastLoginAt: now,
      isCurrentDevice: true,
      trustStatus: "TRUSTED",
      riskScore: isFirst ? 3 : 5,
      isRevoked: false,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryDevicesStore.devices[phone].unshift(device);

    emitSecurityEvent({
      phone,
      eventType: EVENT_TYPES.UNKNOWN_DEVICE,
      severity: "LOW",
      title: `New Device Registered: ${deviceName}`,
      description: `Browser session registered from ${clientMetadata.operatingSystem || "Desktop"} (${ipAddress}).`,
      actor: "AUTHENTICATION_GATEWAY",
    });
  }

  return device;
};

/**
 * Retrieves all registered devices strictly scoped to the authenticated user.
 */
export const getUserDevices = async (phone, currentFingerprint = null) => {
  if (!phone) return [];

  let list = [];

  if (isDbConnected()) {
    try {
      const docs = await Device.find({ phone }).sort({ lastSeenAt: -1 }).lean();
      if (docs && docs.length > 0) {
        list = docs.map((d) => ({
          ...d,
          id: d._id.toString(),
          isCurrentDevice: currentFingerprint ? d.deviceFingerprint === currentFingerprint : d.isCurrentDevice,
          riskScore: calculateDeviceRisk(d),
        }));
        return list;
      }
    } catch (err) {
      console.warn("DB error in getUserDevices, falling back to memory:", err.message);
    }
  }

  // Memory Fallback
  if (!inMemoryDevicesStore.devices[phone] || inMemoryDevicesStore.devices[phone].length === 0) {
    // If no devices yet, create default current browser device
    inMemoryDevicesStore.devices[phone] = [
      {
        _id: "DEV-1001",
        id: "DEV-1001",
        phone,
        deviceFingerprint: currentFingerprint || "primary_browser_fingerprint",
        deviceName: "Primary Workstation (Chrome)",
        deviceType: "Desktop",
        operatingSystem: "Windows",
        osVersion: "11 Pro",
        browser: "Google Chrome",
        browserVersion: "128.0",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "152.58.12.94",
        location: "Vadodara, Gujarat",
        country: "India",
        city: "Vadodara",
        timezone: "Asia/Kolkata",
        screenResolution: "1920x1080",
        language: "en-US",
        firstSeenAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastSeenAt: new Date(),
        lastLoginAt: new Date(),
        isCurrentDevice: true,
        trustStatus: "TRUSTED",
        riskScore: 3,
        isRevoked: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    ];
  }

  list = inMemoryDevicesStore.devices[phone].map((d) => ({
    ...d,
    id: d._id || d.id,
    isCurrentDevice: currentFingerprint ? d.deviceFingerprint === currentFingerprint : d.isCurrentDevice,
    riskScore: calculateDeviceRisk(d),
  }));

  return list;
};

/**
 * Updates trust status of a specific device.
 */
export const updateDeviceTrust = async (phone, deviceId, newTrustStatus, actor = "USER") => {
  if (!phone || !deviceId) return null;

  const validStatuses = ["TRUSTED", "SUSPICIOUS", "REVOKED", "PENDING_REVIEW"];
  const status = newTrustStatus.toUpperCase();
  if (!validStatuses.includes(status)) return null;

  const now = new Date();

  if (isDbConnected()) {
    try {
      const dev = await Device.findOne({ _id: deviceId, phone });
      if (dev) {
        dev.trustStatus = status;
        dev.isRevoked = status === "REVOKED";
        dev.lastSeenAt = now;
        dev.riskScore = calculateDeviceRisk(dev);
        await dev.save();

        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.DEVICE_TRUST_UPDATED,
          severity: status === "REVOKED" || status === "SUSPICIOUS" ? "HIGH" : "LOW",
          title: `Device ${dev.deviceName} updated to ${status}`,
          description: `Trust status updated to ${status} by ${actor}.`,
          actor,
        });

        return dev.toObject ? dev.toObject() : dev;
      }
    } catch (err) {
      console.warn("DB error in updateDeviceTrust, falling back to memory:", err.message);
    }
  }

  // Memory Fallback
  if (!inMemoryDevicesStore.devices[phone]) return null;

  const dev = inMemoryDevicesStore.devices[phone].find(
    (d) => d._id === deviceId || d.id === deviceId
  );
  if (!dev) return null;

  dev.trustStatus = status;
  dev.isRevoked = status === "REVOKED";
  dev.lastSeenAt = now;
  dev.riskScore = calculateDeviceRisk(dev);

  emitSecurityEvent({
    phone,
    eventType: EVENT_TYPES.DEVICE_TRUST_UPDATED,
    severity: status === "REVOKED" || status === "SUSPICIOUS" ? "HIGH" : "LOW",
    title: `Device ${dev.deviceName} updated to ${status}`,
    description: `Trust status updated to ${status} by ${actor}.`,
    actor,
  });

  return dev;
};

/**
 * Revokes access for a device.
 */
export const revokeUserDevice = async (phone, deviceId, actor = "USER") => {
  return await updateDeviceTrust(phone, deviceId, "REVOKED", actor);
};

/**
 * Permanently removes a device record for a user.
 */
export const removeUserDevice = async (phone, deviceId, actor = "USER") => {
  if (!phone || !deviceId) return false;

  if (isDbConnected()) {
    try {
      const res = await Device.deleteOne({ _id: deviceId, phone });
      if (res.deletedCount > 0) {
        emitSecurityEvent({
          phone,
          eventType: EVENT_TYPES.SECURITY_ACTION_TAKEN,
          severity: "MEDIUM",
          title: `Device Record Removed`,
          description: `Device ID ${deviceId} removed by ${actor}.`,
          actor,
        });
        return true;
      }
    } catch (err) {
      console.warn("DB error in removeUserDevice, falling back to memory:", err.message);
    }
  }

  // Memory Fallback
  if (!inMemoryDevicesStore.devices[phone]) return false;

  const idx = inMemoryDevicesStore.devices[phone].findIndex(
    (d) => d._id === deviceId || d.id === deviceId
  );
  if (idx === -1) return false;

  const [removed] = inMemoryDevicesStore.devices[phone].splice(idx, 1);

  emitSecurityEvent({
    phone,
    eventType: EVENT_TYPES.SECURITY_ACTION_TAKEN,
    severity: "MEDIUM",
    title: `Device Access Revoked: ${removed.deviceName}`,
    description: `Hardware access token invalidated for ${removed.deviceName}.`,
    actor,
  });

  return true;
};
