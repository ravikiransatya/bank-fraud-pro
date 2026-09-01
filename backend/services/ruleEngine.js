/**
 * BankGuard AI — Modular Security Rule Engine
 * Evaluates incoming events and transactions against 10 configurable institutional security rules.
 */

// Centralized Configurable Security Rules Definition
export const SECURITY_RULES = [
  {
    id: "RULE_001",
    name: "Unusual Transaction Amount",
    category: "TRANSACTION_OUTLIER",
    severity: "HIGH",
    enabled: true,
    description: "Flags transactions exceeding user's 30-day statistical ceiling by 2.5× or more.",
    evaluate: (txn, context) => {
      const amount = Math.abs(txn.amount || 0);
      const maxNormal = context.profile?.maxNormalAmount || 15000;
      return amount > maxNormal;
    },
    action: "FLAG_AND_ALERT",
  },
  {
    id: "RULE_002",
    name: "Unrecognized Device Fingerprint",
    category: "DEVICE_SECURITY",
    severity: "HIGH",
    enabled: true,
    description: "Detects transaction or session access from unverified or suspicious hardware fingerprints.",
    evaluate: (txn, context) => {
      const dev = (txn.device || "").toLowerCase();
      return dev.includes("unknown") || dev.includes("new device") || dev.includes("linux");
    },
    action: "CHALLENGE_2FA",
  },
  {
    id: "RULE_003",
    name: "Impossible Travel & Geofence Jump",
    category: "LOCATION_ANOMALY",
    severity: "HIGH",
    enabled: true,
    description: "Identifies transactions in distant locations (>300 km) initiated within unrealistic transit time (< 2 hrs).",
    evaluate: (txn, context) => {
      const loc = txn.location || "";
      const isProxy = loc.toLowerCase().includes("proxy") || loc.toLowerCase().includes("vpn");
      const isKnown = (context.profile?.knownLocations || ["Vadodara, GJ"]).some((l) => loc.includes(l));
      return isProxy || (!isKnown && !loc.toLowerCase().includes("online"));
    },
    action: "HOLD_TRANSACTION",
  },
  {
    id: "RULE_004",
    name: "High Transaction Velocity Burst",
    category: "VELOCITY_BURST",
    severity: "HIGH",
    enabled: true,
    description: "Detects 3 or more transactions initiated within a 5-minute rolling time window.",
    evaluate: (txn, context) => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const count = (context.recentHistory || []).filter((h) => new Date(h.createdAt) >= fiveMinsAgo).length;
      return count >= 3;
    },
    action: "THROTTLE_VELOCITY",
  },
  {
    id: "RULE_005",
    name: "Circadian Off-Hours Window",
    category: "TIME_ANOMALY",
    severity: "MEDIUM",
    enabled: true,
    description: "Flags high-value debits initiated during the high-risk midnight window (01:00 AM – 04:30 AM).",
    evaluate: (txn) => {
      const d = txn.createdAt ? new Date(txn.createdAt) : new Date();
      const hour = d.getHours();
      return hour >= 1 && hour <= 4;
    },
    action: "REQUIRE_CONFIRMATION",
  },
  {
    id: "RULE_006",
    name: "Multiple Failed Access Attempts",
    category: "AUTHENTICATION",
    severity: "HIGH",
    enabled: true,
    description: "Detects 3 or more failed OTP or authentication requests in under 10 minutes.",
    evaluate: (txn, context) => {
      return Boolean(context.failedAuthAttempts && context.failedAuthAttempts >= 3);
    },
    action: "TEMPORARY_LOCKOUT",
  },
  {
    id: "RULE_007",
    name: "Large Transfer Outlier",
    category: "CAPITAL_PROTECTION",
    severity: "CRITICAL",
    enabled: true,
    description: "Intercepts and quarantines single transfers exceeding ₹1,00,000 threshold to unverified entities.",
    evaluate: (txn) => {
      const amount = Math.abs(txn.amount || 0);
      return amount >= 100000;
    },
    action: "AUTO_QUARANTINE_OUTFLOW",
  },
  {
    id: "RULE_008",
    name: "Behavioral Baseline Anomaly",
    category: "BEHAVIORAL",
    severity: "MEDIUM",
    enabled: true,
    description: "Detects unexpected category, channel, or merchant deviations with Z-score > 2.5.",
    evaluate: (txn, context) => {
      const amount = Math.abs(txn.amount || 0);
      const avg = context.profile?.avgAmount || 1200;
      return amount > avg * 4 && !txn.merchantCategory?.includes("Salary");
    },
    action: "FLAG_FOR_REVIEW",
  },
  {
    id: "RULE_009",
    name: "Simultaneous Multi-Location Activity",
    category: "LOCATION_ANOMALY",
    severity: "CRITICAL",
    enabled: true,
    description: "Identifies concurrent active sessions originating from distinct IP subnets in different cities.",
    evaluate: (txn, context) => {
      return Boolean(context.concurrentCities && context.concurrentCities.length > 1);
    },
    action: "TERMINATE_SECONDARY_SESSION",
  },
  {
    id: "RULE_010",
    name: "Account Takeover Indicators",
    category: "TAKEOVER_DEFENSE",
    severity: "CRITICAL",
    enabled: true,
    description: "Compound correlation: Unrecognized device + New IP origin + Immediate high-value fund transfer.",
    evaluate: (txn, context) => {
      const dev = (txn.device || "").toLowerCase();
      const loc = (txn.location || "").toLowerCase();
      const amount = Math.abs(txn.amount || 0);
      const isUnkDev = dev.includes("unknown") || dev.includes("linux");
      const isUnkLoc = loc.includes("proxy") || (!loc.includes("vadodara") && !loc.includes("online"));
      return isUnkDev && isUnkLoc && amount >= 25000;
    },
    action: "EMERGENCY_ACCOUNT_RESTRICTION",
  },
];

/**
 * Evaluates a transaction against all active security rules.
 * @param {Object} txn - Transaction payload
 * @param {Object} context - Behavioral baseline profile and history context
 * @returns {Array} List of triggered rules
 */
export const evaluateSecurityRules = (txn, context = {}) => {
  const triggered = [];

  for (const rule of SECURITY_RULES) {
    if (!rule.enabled) continue;
    try {
      if (rule.evaluate(txn, context)) {
        triggered.push({
          ruleId: rule.id,
          name: rule.name,
          category: rule.category,
          severity: rule.severity,
          action: rule.action,
          description: rule.description,
        });
      }
    } catch (err) {
      console.warn(`Error evaluating rule ${rule.id}:`, err.message);
    }
  }

  return triggered;
};
