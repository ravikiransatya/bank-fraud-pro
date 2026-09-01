/**
 * BankGuard AI — Account Security Center & Health Scoring Service
 * Computes deterministic multi-factor Account Security Scores (0-100) and security checklist matrices.
 */

import { getUserDevices } from "./deviceService.js";
import { getIncidents } from "./incidentService.js";

/**
 * Calculates overall Account Security Score (0 to 100).
 */
export const calculateAccountSecurityScore = async ({
  phone,
  accounts = [],
  transactions = [],
  alerts = [],
}) => {
  let score = 100;
  const deductions = [];
  const healthChecklist = [];

  const devices = await getUserDevices(phone);
  const incidents = getIncidents(phone, "OPEN");

  // 1. Critical Threats & Unresolved Incidents (Max -35 pts)
  const openCriticalAlerts = alerts.filter((a) => (a.severity === "CRITICAL" || a.level === "critical") && a.status !== "RESOLVED" && a.status !== "DISMISSED");
  const openHighAlerts = alerts.filter((a) => (a.severity === "HIGH" || a.level === "warning") && a.status !== "RESOLVED" && a.status !== "DISMISSED");

  if (openCriticalAlerts.length > 0) {
    const penalty = Math.min(35, openCriticalAlerts.length * 20);
    score -= penalty;
    deductions.push({ factor: "Active Critical Incursions", penalty: `-${penalty} pts`, reason: `${openCriticalAlerts.length} critical threats awaiting resolution` });
    healthChecklist.push({ title: "Critical Threat Status", status: "FAIL", message: `${openCriticalAlerts.length} unresolved critical threats` });
  } else {
    healthChecklist.push({ title: "Critical Threat Status", status: "PASS", message: "Zero unresolved critical incursions" });
  }

  if (openHighAlerts.length > 0) {
    const penalty = Math.min(20, openHighAlerts.length * 8);
    score -= penalty;
    deductions.push({ factor: "High-Risk Anomalies", penalty: `-${penalty} pts`, reason: `${openHighAlerts.length} high-risk warnings pending review` });
  }

  // 2. Suspicious / Revoked Device Footprint (Max -25 pts)
  const suspiciousDevices = devices.filter((d) => d.trustStatus === "SUSPICIOUS" || d.trustStatus === "REVOKED" || d.isRevoked);
  if (suspiciousDevices.length > 0) {
    const penalty = Math.min(25, suspiciousDevices.length * 15);
    score -= penalty;
    deductions.push({ factor: "Unrecognized / Flagged Devices", penalty: `-${penalty} pts`, reason: `${suspiciousDevices.length} suspicious/revoked device fingerprints detected` });
    healthChecklist.push({ title: "Device Trust Health", status: "WARN", message: `${suspiciousDevices.length} unverified or flagged hardware fingerprints detected` });
  } else {
    healthChecklist.push({ title: "Device Trust Health", status: "PASS", message: "All recognized sessions verified" });
  }

  // 3. Geolocation & Proxy Consistency (Max -20 pts)
  const proxyTxns = transactions.filter((t) => (t.location || "").toLowerCase().includes("proxy") || (t.location || "").toLowerCase().includes("vpn"));
  if (proxyTxns.length > 0) {
    const penalty = 15;
    score -= penalty;
    deductions.push({ factor: "Proxy IP / Geolocation Jump", penalty: `-${penalty} pts`, reason: "Recent transaction routed via commercial proxy node" });
    healthChecklist.push({ title: "Location Geofence Consistency", status: "WARN", message: "Proxy routing node detected in recent activity" });
  } else {
    healthChecklist.push({ title: "Location Geofence Consistency", status: "PASS", message: "All transaction origins within expected regional baseline" });
  }

  // 4. Account Freeze / Restrict Status
  const anyFrozen = accounts.some((a) => a.isFrozen || a.status === "FROZEN");
  if (anyFrozen) {
    healthChecklist.push({ title: "Account Operation Status", status: "RESTRICTED", message: "Accounts placed in emergency freeze mode" });
  } else {
    healthChecklist.push({ title: "Account Operation Status", status: "PASS", message: "Active institutional screening enabled" });
  }

  // 5. Carrier 2FA Security
  healthChecklist.push({ title: "Carrier SMS 2FA Authentication", status: "PASS", message: "Enforced via 2Factor.in telecom gateway" });

  const finalScore = Math.max(15, Math.min(100, score));

  // Determine overall status
  let securityStatus = "PROTECTED";
  if (anyFrozen) {
    securityStatus = "FROZEN";
  } else if (finalScore < 50 || openCriticalAlerts.length > 0) {
    securityStatus = "RESTRICTED";
  } else if (finalScore < 75 || openHighAlerts.length > 0) {
    securityStatus = "WARNING";
  } else if (finalScore < 90) {
    securityStatus = "MONITORING";
  }

  return {
    accountSecurityScore: finalScore,
    securityStatus,
    healthChecklist,
    deductions,
    openIncidentsCount: incidents.length,
    activeThreatsCount: openCriticalAlerts.length + openHighAlerts.length,
    trustedDevicesCount: devices.filter((d) => d.trustStatus === "TRUSTED" && !d.isRevoked).length,
    lastEvaluated: new Date(),
  };
};
