/**
 * BankGuard AI — Security Operations 18-Scenario Test Suite
 * Validates real-time event bus, incident correlation, rule engine, device trust, account scoring, and notifications.
 */

import { emitSecurityEvent, getSecurityEvents, EVENT_TYPES } from "../services/eventBus.js";
import { evaluateSecurityRules, SECURITY_RULES } from "../services/ruleEngine.js";
import { correlateIncident, getIncidents, updateIncidentAction } from "../services/incidentService.js";
import { getUserDevices, updateDeviceTrust, removeUserDevice } from "../services/deviceService.js";
import { calculateAccountSecurityScore } from "../services/accountSecurityService.js";
import { createNotification, getUserNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notificationService.js";
import { analyzeTransaction } from "../services/riskEngine.js";

const TEST_PHONE = "9347496531";

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`✅ [PASS] Scenario: ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] Scenario: ${name} — ${details}`);
    failed++;
  }
}

async function runSecurityOpsSuite() {
  console.log("\n=======================================================");
  console.log("⚡ RUNNING PHASE 4 SECURITY OPERATIONS 18-SCENARIO SUITE");
  console.log("=======================================================\n");

  // 1. New device detection
  const devCheck = analyzeTransaction({
    phone: TEST_PHONE,
    amount: 2500,
    device: "Unknown Linux Workstation x86",
    location: "Vadodara, GJ",
  }, []);
  assert(devCheck.alertTypes.includes("UNKNOWN_DEVICE"), "1. New unknown device detection");

  // 2. Known device transaction
  const knownDevCheck = analyzeTransaction({
    phone: TEST_PHONE,
    amount: 250,
    device: "Primary Mobile",
    location: "Vadodara, GJ",
  }, []);
  assert(knownDevCheck.riskLevel === "LOW" && !knownDevCheck.alertTypes.includes("UNKNOWN_DEVICE"), "2. Known device transaction baseline");

  // 3. Unknown location detection
  const unkLocCheck = analyzeTransaction({
    phone: TEST_PHONE,
    amount: 1500,
    location: "Kolkata, WB",
  }, []);
  assert(unkLocCheck.alertTypes.includes("UNUSUAL_LOCATION"), "3. Unknown location detection");

  // 4. Impossible travel anomaly
  const triggeredRules4 = evaluateSecurityRules({
    amount: 45000,
    location: "Proxy / VPN Node",
    device: "Unknown Client",
  }, { profile: { knownLocations: ["Vadodara, GJ"] } });
  assert(triggeredRules4.some((r) => r.ruleId === "RULE_003"), "4. Impossible travel / proxy anomaly rule trigger");

  // 5. High transaction velocity burst
  const burstHistory = [
    { createdAt: new Date(Date.now() - 1 * 60 * 1000) },
    { createdAt: new Date(Date.now() - 2 * 60 * 1000) },
    { createdAt: new Date(Date.now() - 3 * 60 * 1000) },
  ];
  const triggeredRules5 = evaluateSecurityRules({ amount: 500 }, { recentHistory: burstHistory });
  assert(triggeredRules5.some((r) => r.ruleId === "RULE_004"), "5. High transaction velocity burst rule trigger");

  // 6. Large transaction outlier
  const triggeredRules6 = evaluateSecurityRules({ amount: 150000 });
  assert(triggeredRules6.some((r) => r.ruleId === "RULE_007"), "6. Large transfer outlier rule trigger (>= ₹1,00,000)");

  // 7. Multiple compound risk factors
  const compoundTxn = analyzeTransaction({
    phone: TEST_PHONE,
    amount: 150000,
    device: "Unknown Linux Device",
    location: "Proxy / VPN Node",
    createdAt: new Date("2026-09-01T02:00:00"),
  }, burstHistory);
  assert(compoundTxn.riskLevel === "CRITICAL" && compoundTxn.status === "blocked", "7. Multiple simultaneous compound risk factors -> Auto-Block");

  // 8. Account restriction
  const scoreRestricted = await calculateAccountSecurityScore({
    phone: TEST_PHONE,
    accounts: [{ isFrozen: true, status: "FROZEN" }],
    transactions: [],
    alerts: [],
  });
  assert(scoreRestricted.securityStatus === "FROZEN", "8. Account restriction / freeze status evaluation");

  // 9. Account unrestriction
  const scoreNormal = await calculateAccountSecurityScore({
    phone: TEST_PHONE,
    accounts: [{ isFrozen: false, status: "ACTIVE" }],
    transactions: [],
    alerts: [],
  });
  assert(scoreNormal.securityStatus === "PROTECTED" || scoreNormal.securityStatus === "MONITORING", "9. Account unrestriction & nominal status");

  // 10. Notification creation
  const notif = createNotification({
    phone: TEST_PHONE,
    type: "SECURITY_ALERT",
    severity: "CRITICAL",
    title: "Test Critical Notification",
    message: "Testing in-app notification engine",
  });
  assert(notif && notif.notifId.startsWith("NOTIF-"), "10. In-app notification creation");

  // 11. Notification read state
  const readResult = markNotificationRead(TEST_PHONE, notif.id);
  assert(readResult === true, "11. Notification read state lifecycle transition");

  // 12. Incident creation
  const inc = correlateIncident({
    phone: TEST_PHONE,
    title: "Simulated Test Incident",
    severity: "HIGH",
    relatedAlertIds: ["ALT-901"],
  });
  assert(inc && inc.incidentId.startsWith("INC-"), "12. Incident creation & ID formatting");

  // 13. Incident grouping
  const incCorrelated = correlateIncident({
    phone: TEST_PHONE,
    title: "Simulated Escalation",
    severity: "CRITICAL",
    relatedAlertIds: ["ALT-902"],
  });
  assert(incCorrelated.timeline.length >= 2, "13. Incident correlation & timeline appending");

  // 14. Incident resolution
  const incResolved = updateIncidentAction(TEST_PHONE, inc.incidentId, "RESOLVE");
  assert(incResolved.status === "RESOLVED", "14. Incident resolution lifecycle action");

  // 15. Audit event creation
  const event = emitSecurityEvent({
    phone: TEST_PHONE,
    eventType: EVENT_TYPES.TRANSACTION_ANALYZED,
    severity: "LOW",
    title: "Test Event",
    description: "Test event emitted",
  });
  const events = getSecurityEvents(TEST_PHONE);
  assert(events.length > 0 && event.eventId.startsWith("EVT-"), "15. Security event bus publication & retrieval");

  // 16. Account risk score calculation
  const scoreReport = await calculateAccountSecurityScore({
    phone: TEST_PHONE,
    accounts: [{ isFrozen: false }],
    transactions: [],
    alerts: [{ severity: "CRITICAL", status: "OPEN" }],
  });
  assert(scoreReport.accountSecurityScore < 100 && scoreReport.deductions.length > 0, "16. Account risk score multi-factor calculation");

  // 17. Security rule configuration
  assert(SECURITY_RULES.length === 10, "17. 10 modular institutional security rules defined");

  // 18. Normal transaction baseline preservation
  const s18 = analyzeTransaction({
    phone: TEST_PHONE,
    amount: 350,
    merchant: "Swiggy",
    type: "UPI",
    location: "Vadodara, GJ",
    device: "Primary Mobile",
    createdAt: new Date("2026-09-01T14:30:00"),
  }, []);
  assert(s18.riskLevel === "LOW" && s18.status === "completed" && s18.riskScore < 30, "18. Normal transaction baseline preservation");

  console.log("\n=======================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

runSecurityOpsSuite();
