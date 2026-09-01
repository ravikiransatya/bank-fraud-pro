/**
 * BankGuard AI — Security Incident Correlation & Lifecycle Service
 * Groups correlated alerts and anomalies into unified incidents with chronological investigation timelines.
 */

import { emitSecurityEvent, EVENT_TYPES } from "./eventBus.js";

// In-Memory Incidents Store
export const incidentStore = {
  incidents: {}, // Keyed by phone
};

/**
 * Correlates an alert or anomaly into an existing or new Security Incident.
 */
export const correlateIncident = ({
  phone,
  title,
  severity = "HIGH",
  relatedAlertIds = [],
  relatedTransactionIds = [],
  triggeredRules = [],
  device = "Primary Mobile",
  location = "Vadodara, GJ",
  summary,
}) => {
  if (!phone) return null;
  if (!incidentStore.incidents[phone]) {
    incidentStore.incidents[phone] = generateInitialIncidents(phone);
  }

  // Check if an open incident of similar type already exists
  const existingOpen = incidentStore.incidents[phone].find(
    (inc) => inc.status === "OPEN" || inc.status === "INVESTIGATING"
  );

  const now = new Date();

  if (existingOpen && severity === "CRITICAL") {
    // Append to existing critical incident
    existingOpen.relatedAlertIds = Array.from(new Set([...existingOpen.relatedAlertIds, ...relatedAlertIds]));
    existingOpen.relatedTransactionIds = Array.from(new Set([...existingOpen.relatedTransactionIds, ...relatedTransactionIds]));
    existingOpen.triggeredRules = Array.from(new Set([...existingOpen.triggeredRules, ...triggeredRules]));
    existingOpen.updatedAt = now;
    existingOpen.timeline.push({
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      timestamp: now,
      event: `Compound threat escalation: ${title}`,
      severity,
      actor: "SYSTEM_CORRELATOR",
    });
    return existingOpen;
  }

  // Create new Incident
  const incidentId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
  const newIncident = {
    id: incidentId,
    incidentId,
    phone,
    title: title || "Suspicious Behavioral Sequence Flagged",
    summary: summary || "Multiple anomalous transactions and security alerts correlated within proximity window.",
    severity: severity.toUpperCase(),
    status: severity === "CRITICAL" ? "OPEN" : "INVESTIGATING",
    riskScore: severity === "CRITICAL" ? 96 : severity === "HIGH" ? 78 : 55,
    relatedAlertIds,
    relatedTransactionIds,
    triggeredRules,
    device,
    location,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: now,
        event: "Incident initiated by Automated Correlation Engine",
        severity: "INFO",
        actor: "SYSTEM",
      },
      {
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: now,
        event: `${title} intercepted`,
        severity,
        actor: "SECURITY_PERIMETER",
      },
    ],
  };

  incidentStore.incidents[phone].unshift(newIncident);

  emitSecurityEvent({
    phone,
    eventType: EVENT_TYPES.INCIDENT_CREATED,
    severity,
    title: `Security Incident Created: ${incidentId}`,
    description: `${newIncident.title} (Severity: ${severity}).`,
    incidentId,
    actor: "INCIDENT_CORRELATOR",
  });

  return newIncident;
};

/**
 * Retrieves all incidents for a user.
 */
export const getIncidents = (phone, status = "ALL") => {
  if (!incidentStore.incidents[phone]) {
    incidentStore.incidents[phone] = generateInitialIncidents(phone);
  }

  let list = incidentStore.incidents[phone];
  if (status !== "ALL") {
    list = list.filter((i) => i.status === status.toUpperCase());
  }

  return list;
};

/**
 * Updates incident lifecycle status and records audit timeline entries.
 */
export const updateIncidentAction = (phone, incidentId, action, actor = "USER") => {
  if (!incidentStore.incidents[phone]) {
    incidentStore.incidents[phone] = generateInitialIncidents(phone);
  }

  const inc = incidentStore.incidents[phone].find((i) => i.incidentId === incidentId || i.id === incidentId);
  if (!inc) return null;

  const now = new Date();
  let newStatus = inc.status;
  let eventText = "";

  switch (action.toUpperCase()) {
    case "CONTAIN":
    case "RESTRICT":
      newStatus = "CONTAINED";
      eventText = "Account and recipient channels placed on emergency containment hold.";
      break;
    case "INVESTIGATE":
      newStatus = "INVESTIGATING";
      eventText = "Assigned to active fraud investigation desk.";
      break;
    case "RESOLVE":
      newStatus = "RESOLVED";
      eventText = "Incident resolved and cleared by user.";
      break;
    case "DISMISS":
      newStatus = "DISMISSED";
      eventText = "Incident dismissed as expected user activity.";
      break;
  }

  inc.status = newStatus;
  inc.updatedAt = now;
  inc.timeline.push({
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    timestamp: now,
    event: eventText,
    severity: newStatus === "CONTAINED" ? "HIGH" : "SAFE",
    actor,
  });

  emitSecurityEvent({
    phone,
    eventType: newStatus === "RESOLVED" ? EVENT_TYPES.INCIDENT_RESOLVED : EVENT_TYPES.SECURITY_ACTION_TAKEN,
    severity: "MEDIUM",
    title: `Incident ${incidentId} Updated to ${newStatus}`,
    description: eventText,
    incidentId,
    actor,
  });

  return inc;
};

/**
 * Initial Realistic Seed Incidents for a user.
 */
const generateInitialIncidents = (phone) => [
  {
    id: "INC-1042",
    incidentId: "INC-1042",
    phone,
    title: "High-Risk Midnight Outflow & Anonymized Proxy Anomaly",
    summary: "₹1,50,000 transfer attempted to an unverified dynamic QR recipient at 02:00 AM via Proxy IP. Automatic circuit breaker triggered.",
    severity: "CRITICAL",
    status: "OPEN",
    riskScore: 96,
    relatedAlertIds: ["ALT-902"],
    relatedTransactionIds: ["TX-1045"],
    triggeredRules: ["RULE_003 (Impossible Travel/Proxy)", "RULE_005 (Midnight Window)", "RULE_007 (Large Transfer)"],
    device: "Unknown Linux / Chrome Client",
    location: "Proxy / VPN Node (Mumbai-Delhi Route)",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000),
    timeline: [
      { time: "01:58 AM", timestamp: new Date(Date.now() - 47 * 60 * 1000), event: "Session initiated from unrecognized Linux Chrome device", severity: "HIGH", actor: "DEVICE_GUARD" },
      { time: "02:00 AM", timestamp: new Date(Date.now() - 45 * 60 * 1000), event: "₹1,50,000 transfer initiated to dynamic QR VPA", severity: "CRITICAL", actor: "USER_SESSION" },
      { time: "02:00 AM", timestamp: new Date(Date.now() - 45 * 60 * 1000), event: "Random Forest Risk Engine generated 100% Risk Score", severity: "CRITICAL", actor: "RISK_ENGINE" },
      { time: "02:00 AM", timestamp: new Date(Date.now() - 45 * 60 * 1000), event: "Transaction quarantined & Alert ALT-902 published", severity: "CRITICAL", actor: "CIRCUIT_BREAKER" },
      { time: "02:05 AM", timestamp: new Date(Date.now() - 40 * 60 * 1000), event: "Security Incident INC-1042 correlated and opened", severity: "INFO", actor: "INCIDENT_CORRELATOR" },
    ],
  },
  {
    id: "INC-1038",
    incidentId: "INC-1038",
    phone,
    title: "Off-Hours Physical ATM Geolocation Jump",
    summary: "₹10,000 ATM withdrawal requested at 03:15 AM from Mumbai Central ATM. Distance deviation from Vadodara resident baseline: 412 km.",
    severity: "HIGH",
    status: "INVESTIGATING",
    riskScore: 87,
    relatedAlertIds: ["ALT-901"],
    relatedTransactionIds: ["TX-1048"],
    triggeredRules: ["RULE_003 (Geolocation Distance Jump)", "RULE_005 (Midnight ATM Window)"],
    device: "Physical ATM Terminal · Mumbai Central",
    location: "Mumbai Central, MH",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    timeline: [
      { time: "03:15 AM", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), event: "Card inserted at Mumbai Central ATM", severity: "INFO", actor: "ATM_CONTROLLER" },
      { time: "03:15 AM", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), event: "Geolocation jump (412 km in 2 hours) flagged", severity: "HIGH", actor: "GEOFENCE_ENGINE" },
      { time: "03:16 AM", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), event: "Security Alert ALT-901 generated and assigned to investigation", severity: "HIGH", actor: "SECURITY_DESK" },
    ],
  },
];
