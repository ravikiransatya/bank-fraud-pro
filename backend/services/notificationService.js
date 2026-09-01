/**
 * BankGuard AI — In-App Notification Engine
 * Manages operational real-time security alerts and user notifications with unread states.
 */

// In-Memory Notification Store
export const notificationStore = {
  notifications: {}, // Keyed by phone
};

/**
 * Creates and delivers an in-app notification.
 */
export const createNotification = ({
  phone,
  type = "SECURITY_ALERT", // 'SECURITY_ALERT' | 'TRANSACTION_FLAGGED' | 'DEVICE_DETECTED' | 'INCIDENT_UPDATE' | 'SYSTEM_NOTICE'
  severity = "INFO", // 'INFO' | 'WARNING' | 'CRITICAL'
  title,
  message,
  relatedAlertId = null,
  relatedTransactionId = null,
  relatedIncidentId = null,
  link = "alerts",
}) => {
  if (!phone) return null;
  if (!notificationStore.notifications[phone]) {
    notificationStore.notifications[phone] = generateInitialNotifications(phone);
  }

  const notifId = `NOTIF-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();

  const notif = {
    id: notifId,
    notifId,
    phone,
    type,
    severity: severity.toUpperCase(),
    title: title || "Security Notification",
    message: message || "New operational update from security operations center.",
    relatedAlertId,
    relatedTransactionId,
    relatedIncidentId,
    link,
    isRead: false,
    createdAt: now,
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    date: now.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
  };

  notificationStore.notifications[phone].unshift(notif);
  return notif;
};

/**
 * Retrieves notifications for a user.
 */
export const getUserNotifications = (phone, filter = "ALL") => {
  if (!notificationStore.notifications[phone]) {
    notificationStore.notifications[phone] = generateInitialNotifications(phone);
  }

  let list = notificationStore.notifications[phone];

  if (filter === "UNREAD") {
    list = list.filter((n) => !n.isRead);
  } else if (filter === "CRITICAL") {
    list = list.filter((n) => n.severity === "CRITICAL");
  } else if (filter === "SECURITY") {
    list = list.filter((n) => n.type === "SECURITY_ALERT" || n.type === "TRANSACTION_FLAGGED");
  }

  const unreadCount = notificationStore.notifications[phone].filter((n) => !n.isRead).length;

  return {
    notifications: list,
    totalCount: list.length,
    unreadCount,
  };
};

/**
 * Marks a single notification as read.
 */
export const markNotificationRead = (phone, notifId) => {
  if (!notificationStore.notifications[phone]) return false;
  const notif = notificationStore.notifications[phone].find((n) => n.id === notifId || n.notifId === notifId);
  if (notif) {
    notif.isRead = true;
    return true;
  }
  return false;
};

/**
 * Marks all notifications as read.
 */
export const markAllNotificationsRead = (phone) => {
  if (!notificationStore.notifications[phone]) return 0;
  let count = 0;
  notificationStore.notifications[phone].forEach((n) => {
    if (!n.isRead) {
      n.isRead = true;
      count++;
    }
  });
  return count;
};

/**
 * Initial Realistic Notifications
 */
const generateInitialNotifications = (phone) => [
  {
    id: "NOTIF-101",
    notifId: "NOTIF-101",
    phone,
    type: "SECURITY_ALERT",
    severity: "CRITICAL",
    title: "Unauthorized Outflow Quarantined",
    message: "₹1,50,000 transfer attempted to unverified dynamic QR recipient quarantined.",
    relatedAlertId: "ALT-902",
    relatedTransactionId: "TX-1045",
    link: "alerts",
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    time: "02:00 AM",
    date: "Today",
  },
  {
    id: "NOTIF-102",
    notifId: "NOTIF-102",
    phone,
    type: "TRANSACTION_FLAGGED",
    severity: "WARNING",
    title: "Midnight ATM Cash Out Flagged",
    message: "₹10,000 ATM withdrawal requested at 03:15 AM from Mumbai Central.",
    relatedAlertId: "ALT-901",
    relatedTransactionId: "TX-1048",
    link: "alerts",
    isRead: false,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    time: "03:15 AM",
    date: "Today",
  },
  {
    id: "NOTIF-103",
    notifId: "NOTIF-103",
    phone,
    type: "DEVICE_DETECTED",
    severity: "WARNING",
    title: "Unrecognized Device Login",
    message: "Session initiated from Linux Chrome client in Mumbai.",
    link: "devices",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    time: "Yesterday",
    date: "Yesterday",
  },
  {
    id: "NOTIF-104",
    notifId: "NOTIF-104",
    phone,
    type: "SYSTEM_NOTICE",
    severity: "INFO",
    title: "Institutional Perimeter Active",
    message: "Continuous Random Forest ML risk inference running with 3.8 ms latency.",
    link: "dashboard",
    isRead: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    time: "2 days ago",
    date: "30 Aug",
  },
];
