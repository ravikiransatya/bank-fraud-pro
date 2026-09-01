/**
 * BankGuard AI — Centralized Modular Risk Engine & Explainable AI Evaluator
 * Analyzes incoming financial transactions across 10 security factors and produces transparent, itemized risk assessments.
 */

import { getUserProfile } from "./userProfileService.js";

// 1. Centralized Configurable Security Thresholds
export const RISK_THRESHOLDS = {
  LOW: { min: 0, max: 29, label: "LOW", status: "completed", action: "Allow & Log" },
  MEDIUM: { min: 30, max: 59, label: "MEDIUM", status: "flagged", action: "Monitor & Verify" },
  HIGH: { min: 60, max: 79, label: "HIGH", status: "flagged", action: "Hold & Review Transaction" },
  CRITICAL: { min: 80, max: 100, label: "CRITICAL", status: "blocked", action: "Quarantine & Block Immediately" },
};

/**
 * Returns the risk level category based on numeric score
 */
export const getRiskLevel = (score) => {
  if (score >= RISK_THRESHOLDS.CRITICAL.min) return "CRITICAL";
  if (score >= RISK_THRESHOLDS.HIGH.min) return "HIGH";
  if (score >= RISK_THRESHOLDS.MEDIUM.min) return "MEDIUM";
  return "LOW";
};

/**
 * Evaluates an incoming transaction against the user profile and recent historical context.
 * @param {Object} txn - Incoming transaction payload
 * @param {Array} recentHistory - User's recent transaction history
 * @returns {Object} Comprehensive Explainable Risk Assessment
 */
export const analyzeTransaction = (txn, recentHistory = []) => {
  const profile = getUserProfile(txn.phone, recentHistory);
  const amount = Math.abs(parseFloat(txn.amount) || 0);
  const txType = txn.type || "UPI";
  const merchant = txn.merchant || "Unknown Merchant";
  const location = txn.location || "Online";
  const device = txn.device || "Primary Mobile";
  const txDate = txn.createdAt ? new Date(txn.createdAt) : new Date();
  const txHour = txDate.getHours();
  const txMinute = txDate.getMinutes();

  let baseScore = 4; // Baseline noise / nominal verified trust
  const breakdown = [];
  const alertTypes = [];

  // =========================================================================
  // FACTOR 1: Amount Baseline & Statistical Outlier Deviation
  // =========================================================================
  const amountRatio = profile.avgAmount > 0 ? amount / profile.avgAmount : 1;

  if (amount >= 100000) {
    const points = 35;
    breakdown.push({
      factor: "High-Value Capital Outlier",
      points: `+${points}`,
      reason: `Transaction amount (₹${amount.toLocaleString("en-IN")}) is a high-value outlier exceeding ₹1,00,000 threshold`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("LARGE_TRANSFER");
  } else if (amount > profile.maxNormalAmount) {
    const points = Math.min(30, Math.round(15 + (amountRatio * 2)));
    breakdown.push({
      factor: "Unusual Transaction Amount",
      points: `+${points}`,
      reason: `Amount (₹${amount.toLocaleString("en-IN")}) exceeds normal max ceiling (₹${profile.maxNormalAmount.toLocaleString("en-IN")}) by ${amountRatio.toFixed(1)}×`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_AMOUNT");
  } else if (amountRatio >= 3.5) {
    const points = 15;
    breakdown.push({
      factor: "Moderate Amount Surge",
      points: `+${points}`,
      reason: `Amount is ${amountRatio.toFixed(1)}× higher than 30-day average baseline (₹${profile.avgAmount.toLocaleString("en-IN")})`,
      impact: "MEDIUM",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_AMOUNT");
  }

  // =========================================================================
  // FACTOR 2: Circadian & Midnight Window Anomaly
  // =========================================================================
  const isMidnight = txHour >= 1 && txHour <= 4;
  const isOffHours = txHour < profile.typicalHours.start || txHour > profile.typicalHours.end;

  if (isMidnight) {
    const points = 22;
    const timeString = `${String(txHour).padStart(2, "0")}:${String(txMinute).padStart(2, "0")}`;
    breakdown.push({
      factor: "Midnight Transaction Window",
      points: `+${points}`,
      reason: `Transaction initiated at ${timeString} within high-risk midnight window (01:00 AM – 04:30 AM)`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_TIME");
  } else if (isOffHours) {
    const points = 10;
    breakdown.push({
      factor: "Off-Peak Hours Activity",
      points: `+${points}`,
      reason: `Activity outside standard user operational window (${profile.typicalHours.start}:00 – ${profile.typicalHours.end}:00)`,
      impact: "LOW",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_TIME");
  }

  // =========================================================================
  // FACTOR 3: Merchant Reputation & Unverified Dynamic QR
  // =========================================================================
  const isDynamicQR = merchant.toLowerCase().includes("qr") || merchant.toLowerCase().includes("unknown");
  const isProxyMerchant = merchant.toLowerCase().includes("proxy") || merchant.toLowerCase().includes("crypto") || merchant.toLowerCase().includes("offshore");
  const isFamiliarMerchant = profile.familiarMerchants.some((m) => merchant.toLowerCase().includes(m.toLowerCase()));

  if (isProxyMerchant || (isDynamicQR && amount > 25000)) {
    const points = 30;
    breakdown.push({
      factor: "Suspicious / Unverified Recipient",
      points: `+${points}`,
      reason: `Payment directed to unverified dynamic QR recipient or high-risk offshore merchant proxy`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("SUSPICIOUS_MERCHANT");
  } else if (!isFamiliarMerchant && amount > 10000) {
    const points = 12;
    breakdown.push({
      factor: "First-Time Unfamiliar Merchant",
      points: `+${points}`,
      reason: `First recorded interaction with ${merchant} for an amount above ₹10,000`,
      impact: "MEDIUM",
    });
    baseScore += points;
  }

  // =========================================================================
  // FACTOR 4: Geolocation Anomaly & Distance Jump
  // =========================================================================
  const isProxyIP = location.toLowerCase().includes("proxy") || location.toLowerCase().includes("vpn") || location.toLowerCase().includes("tor");
  const isUnfamiliarLocation = !profile.knownLocations.some((loc) => location.toLowerCase().includes(loc.toLowerCase())) && !location.toLowerCase().includes("online");

  if (isProxyIP) {
    const points = 25;
    breakdown.push({
      factor: "Anonymized Proxy / VPN Routing",
      points: `+${points}`,
      reason: `Transaction IP resolved to commercial datacenter proxy / VPN routing node`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_LOCATION");
  } else if (isUnfamiliarLocation) {
    const points = 18;
    breakdown.push({
      factor: "Geolocation Distance Jump",
      points: `+${points}`,
      reason: `Originating location (${location}) differs significantly from primary resident geofence (${profile.knownLocations[0] || "Home"})`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("UNUSUAL_LOCATION");
  }

  // =========================================================================
  // FACTOR 5: Device Hardware & Fingerprint Anomaly
  // =========================================================================
  const isUnknownDevice = device.toLowerCase().includes("unknown") || device.toLowerCase().includes("new device") || device.toLowerCase().includes("linux");

  if (isUnknownDevice) {
    const points = 18;
    breakdown.push({
      factor: "Unrecognized Device Fingerprint",
      points: `+${points}`,
      reason: `Transaction hardware fingerprint (${device}) does not match registered trusted devices`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("UNKNOWN_DEVICE");
  }

  // =========================================================================
  // FACTOR 6: Velocity Spike & Rapid Sequential Transfers
  // =========================================================================
  const fiveMinutesAgo = new Date(txDate.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(txDate.getTime() - 60 * 60 * 1000);

  const txnsInLast5Min = recentHistory.filter((h) => new Date(h.createdAt) >= fiveMinutesAgo).length;
  const txnsInLastHour = recentHistory.filter((h) => new Date(h.createdAt) >= oneHourAgo).length;

  if (txnsInLast5Min >= 3) {
    const points = 24;
    breakdown.push({
      factor: "Rapid High-Velocity Burst",
      points: `+${points}`,
      reason: `${txnsInLast5Min + 1} transactions initiated within 5 minutes (Velocity anomaly)`,
      impact: "HIGH",
    });
    baseScore += points;
    alertTypes.push("HIGH_VELOCITY");
    alertTypes.push("RAPID_TRANSACTION_SEQUENCE");
  } else if (txnsInLastHour > profile.typicalVelocityHourly + 2) {
    const points = 14;
    breakdown.push({
      factor: "Elevated Hourly Transaction Frequency",
      points: `+${points}`,
      reason: `${txnsInLastHour + 1} transactions in the last hour exceeds typical user frequency baseline (${profile.typicalVelocityHourly}/hr)`,
      impact: "MEDIUM",
    });
    baseScore += points;
    alertTypes.push("HIGH_VELOCITY");
  }

  // =========================================================================
  // FACTOR 7: Channel-Specific Risk Weighting (e.g. Midnight ATM Cash Out)
  // =========================================================================
  if (txType === "ATM" && (isMidnight || amount >= 10000)) {
    const points = 16;
    breakdown.push({
      factor: "ATM Cash Out Risk Weight",
      points: `+${points}`,
      reason: `High-value physical ATM cash withdrawal with immediate irreversibility`,
      impact: "MEDIUM",
    });
    baseScore += points;
  }

  // =========================================================================
  // FACTOR 8: Behavioral Consistency Reduction (Familiarity Discount)
  // =========================================================================
  if (isFamiliarMerchant && !isMidnight && !isProxyIP && !isUnknownDevice && amount < profile.maxNormalAmount) {
    baseScore = Math.max(2, baseScore - 3);
    breakdown.unshift({
      factor: "Verified Behavioral Baseline",
      points: "-3",
      reason: `Known merchant (${merchant}) with verified history within normal operating hours`,
      impact: "SAFE",
    });
  }

  // Cap final score between 0 and 99 (or 100 if critical)
  const finalScore = Math.min(100, Math.max(1, baseScore));
  const riskLevel = getRiskLevel(finalScore);

  // Decision & Recommended Actions
  let status = "completed";
  let recommendedAction = RISK_THRESHOLDS[riskLevel].action;
  let isAlertRequired = false;

  if (riskLevel === "CRITICAL") {
    status = "blocked";
    isAlertRequired = true;
  } else if (riskLevel === "HIGH" || riskLevel === "MEDIUM") {
    status = "flagged";
    isAlertRequired = true;
  }

  // Primary Threat Classification
  const primaryThreatType = alertTypes[0] || (riskLevel === "LOW" ? "NORMAL_TRANSACTION" : "BEHAVIORAL_ANOMALY");

  // Human-Readable Rationale Summary
  const primaryReasons = breakdown
    .filter((b) => b.impact !== "SAFE")
    .map((b) => b.factor);
  const riskReason = primaryReasons.length > 0
    ? primaryReasons.slice(0, 3).join(" · ")
    : "Transaction matches normal historical baseline.";

  return {
    riskScore: finalScore,
    riskPercentage: finalScore,
    riskLevel,
    status,
    recommendedAction,
    isAlertRequired,
    threatType: primaryThreatType,
    alertTypes,
    scoreBreakdown: breakdown,
    risk_reason: riskReason,
    evaluationTimestamp: new Date(),
    profileSummary: {
      avgAmount: profile.avgAmount,
      maxNormalAmount: profile.maxNormalAmount,
      typicalHours: `${profile.typicalHours.start}:00 - ${profile.typicalHours.end}:00`,
    },
  };
};
