/**
 * BankGuard AI — Centralized Security Event Bus & Real-Time SSE Broadcaster
 * Dispatches, records, and streams structured security events for real-time operations and compliance auditing.
 */

// In-Memory Security Event Store
export const eventStore = {
  events: {}, // Keyed by phone: Array of Event objects
};

// Active SSE client connections: phone -> Set of Express Response streams
const sseClients = new Map();

/**
 * Standard Security Event Types
 */
export const EVENT_TYPES = {
  TRANSACTION_CREATED: "TRANSACTION_CREATED",
  TRANSACTION_ANALYZED: "TRANSACTION_ANALYZED",
  RISK_DETECTED: "RISK_DETECTED",
  FRAUD_ALERT_CREATED: "FRAUD_ALERT_CREATED",
  HIGH_RISK_TRANSACTION: "HIGH_RISK_TRANSACTION",
  ACCOUNT_SECURITY_WARNING: "ACCOUNT_SECURITY_WARNING",
  UNKNOWN_DEVICE: "UNKNOWN_DEVICE",
  UNKNOWN_LOCATION: "UNKNOWN_LOCATION",
  VELOCITY_ANOMALY: "VELOCITY_ANOMALY",
  ACCOUNT_FROZEN: "ACCOUNT_FROZEN",
  ACCOUNT_UNFROZEN: "ACCOUNT_UNFROZEN",
  ALERT_REVIEWED: "ALERT_REVIEWED",
  ALERT_RESOLVED: "ALERT_RESOLVED",
  INCIDENT_CREATED: "INCIDENT_CREATED",
  INCIDENT_RESOLVED: "INCIDENT_RESOLVED",
  DEVICE_TRUST_UPDATED: "DEVICE_TRUST_UPDATED",
  SECURITY_ACTION_TAKEN: "SECURITY_ACTION_TAKEN",
  METRICS_UPDATED: "METRICS_UPDATED",
};

/**
 * Registers an active Server-Sent Events (SSE) HTTP client connection.
 * @param {String} phone - User phone identifier
 * @param {Object} res - Express response stream
 */
export const subscribeToEvents = (phone, res) => {
  if (!phone || !res) return;

  if (!sseClients.has(phone)) {
    sseClients.set(phone, new Set());
  }

  const clientSet = sseClients.get(phone);
  clientSet.add(res);

  res.on("close", () => {
    const clients = sseClients.get(phone);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(phone);
      }
    }
  });
};

/**
 * Broadcasts an event to all active SSE subscribers for a user account in <10ms.
 * @param {String} phone - User phone identifier
 * @param {Object} event - Event payload object
 */
export const broadcastEvent = (phone, event) => {
  if (!phone || !event) return;

  const clients = sseClients.get(phone);
  if (clients && clients.size > 0) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of clients) {
      try {
        client.write(data);
      } catch (err) {
        console.warn("SSE broadcast write warning:", err.message);
      }
    }
  }
};

/**
 * Emits, stores, and broadcasts a security event into the central real-time stream.
 * @param {Object} eventPayload - Event details
 * @returns {Object} Published Security Event
 */
export const emitSecurityEvent = ({
  phone,
  eventType,
  severity = "LOW", // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title,
  description,
  account = "Linked Account",
  transactionId = null,
  alertId = null,
  incidentId = null,
  source = "SYSTEM_RISK_ENGINE",
  actor = "SYSTEM",
  metadata = {},
}) => {
  if (!phone) return null;

  const eventId = `EVT-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  const event = {
    id: eventId,
    eventId,
    phone,
    eventType,
    severity: severity.toUpperCase(),
    title: title || eventType.replace(/_/g, " "),
    description: description || `Security event ${eventType} triggered by ${actor}.`,
    account,
    transactionId,
    alertId,
    incidentId,
    source,
    actor,
    metadata,
    timestamp: now,
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    date: now.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  };

  if (!eventStore.events[phone]) {
    eventStore.events[phone] = [];
  }

  // Prepend to maintain newest first
  eventStore.events[phone].unshift(event);

  // Keep last 200 events per user to maintain high performance
  if (eventStore.events[phone].length > 200) {
    eventStore.events[phone] = eventStore.events[phone].slice(0, 200);
  }

  // Real-time broadcast to connected frontend SSE subscribers
  broadcastEvent(phone, event);

  return event;
};

/**
 * Retrieves security events for a user with optional filtering.
 */
export const getSecurityEvents = (phone, { limit = 50, severity = "ALL", eventType = "ALL" } = {}) => {
  if (!eventStore.events[phone]) {
    generateInitialEventFeed(phone);
  }

  let list = eventStore.events[phone] || [];

  if (severity !== "ALL") {
    list = list.filter((e) => e.severity === severity.toUpperCase());
  }

  if (eventType !== "ALL") {
    list = list.filter((e) => e.eventType === eventType);
  }

  return list.slice(0, limit);
};

/**
 * Generates an initial seed event stream for a user account.
 */
const generateInitialEventFeed = (phone) => {
  const events = [
    {
      eventType: EVENT_TYPES.TRANSACTION_ANALYZED,
      severity: "LOW",
      title: "Transaction Baseline Verified",
      description: "₹350 Swiggy UPI payment verified against historical baseline. Risk: 2%",
      account: "SBI · •••• 4521",
      transactionId: "TX-1049",
      source: "RISK_ENGINE",
      actor: "SYSTEM",
      offsetMins: 3,
    },
    {
      eventType: EVENT_TYPES.HIGH_RISK_TRANSACTION,
      severity: "HIGH",
      title: "Midnight ATM Cash Withdrawal Flagged",
      description: "₹10,000 withdrawal at 03:15 AM from Mumbai Central ATM flagged for review.",
      account: "HDFC · •••• 8834",
      transactionId: "TX-1048",
      alertId: "ALT-901",
      source: "ANOMALY_DETECTOR",
      actor: "SYSTEM",
      offsetMins: 28,
    },
    {
      eventType: EVENT_TYPES.FRAUD_ALERT_CREATED,
      severity: "CRITICAL",
      title: "Unauthorized Outflow Quarantined",
      description: "₹1,50,000 unverified dynamic QR transfer intercepted via Proxy IP. Risk: 100%",
      account: "HDFC · •••• 8834",
      transactionId: "TX-1045",
      alertId: "ALT-902",
      source: "CIRCUIT_BREAKER",
      actor: "SYSTEM",
      offsetMins: 45,
    },
    {
      eventType: EVENT_TYPES.UNKNOWN_DEVICE,
      severity: "HIGH",
      title: "Unrecognized Device Fingerprint",
      description: "Login session initiated from unrecognized Linux Chrome client.",
      account: "Security Perimeter",
      source: "DEVICE_GUARD",
      actor: "SYSTEM",
      offsetMins: 90,
    },
    {
      eventType: EVENT_TYPES.ALERT_RESOLVED,
      severity: "LOW",
      title: "High-Value IMPS Transfer Cleared",
      description: "₹25,000 IMPS transfer ALT-905 reviewed and confirmed as legitimate.",
      account: "ICICI · •••• 2210",
      alertId: "ALT-905",
      source: "USER_PORTAL",
      actor: "USER",
      offsetMins: 180,
    },
  ];

  eventStore.events[phone] = events.map((e, idx) => {
    const timestamp = new Date(Date.now() - (e.offsetMins || idx * 30) * 60 * 1000);
    return {
      id: `EVT-${10000 + idx}`,
      eventId: `EVT-${10000 + idx}`,
      phone,
      eventType: e.eventType,
      severity: e.severity,
      title: e.title,
      description: e.description,
      account: e.account,
      transactionId: e.transactionId || null,
      alertId: e.alertId || null,
      incidentId: e.incidentId || null,
      source: e.source,
      actor: e.actor,
      timestamp,
      time: timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      date: timestamp.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      metadata: {},
    };
  });
};
