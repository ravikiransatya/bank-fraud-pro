/**
 * BankGuard AI — Client-Side Device Identification & Telemetry Utility
 * Safely collects realistically accessible browser metadata and generates a persistent device fingerprint.
 */

// Generate random UUID v4 if not available
function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Simple deterministic hash
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "dev_" + Math.abs(hash).toString(16);
}

/**
 * Detects operating system and version
 */
export function detectOS() {
  const ua = navigator.userAgent || "";
  if (/Windows NT 10.0/i.test(ua)) return { os: "Windows", version: "11/10" };
  if (/Windows NT 6.3/i.test(ua)) return { os: "Windows", version: "8.1" };
  if (/Windows NT 6.1/i.test(ua)) return { os: "Windows", version: "7" };
  if (/Mac OS X 10[._](\d+)/i.test(ua)) return { os: "macOS", version: "Sonoma/Ventura" };
  if (/Android (\d+(\.\d+)?)/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    return { os: "Android", version: match ? match[1] : "14" };
  }
  if (/iPhone|iPad|iPod/i.test(ua)) return { os: "iOS", version: "17/18" };
  if (/Linux/i.test(ua)) return { os: "Linux", version: "x86_64" };
  return { os: "Unknown OS", version: "1.0" };
}

/**
 * Detects browser brand and version
 */
export function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (/Edg\/(\d+)/i.test(ua)) {
    const match = ua.match(/Edg\/(\d+)/i);
    return { browser: "Microsoft Edge", version: match ? match[1] : "120" };
  }
  if (/Chrome\/(\d+)/i.test(ua) && !/Edg/i.test(ua)) {
    const match = ua.match(/Chrome\/(\d+)/i);
    return { browser: "Google Chrome", version: match ? match[1] : "128" };
  }
  if (/Firefox\/(\d+)/i.test(ua)) {
    const match = ua.match(/Firefox\/(\d+)/i);
    return { browser: "Mozilla Firefox", version: match ? match[1] : "128" };
  }
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    return { browser: "Apple Safari", version: "17" };
  }
  return { browser: "Web Browser", version: "1.0" };
}

/**
 * Detects device category
 */
export function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  if (/Mobile|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

/**
 * Collects complete client device metadata payload
 */
export function getClientDeviceMetadata() {
  // Persistent hardware token stored in localStorage for stable recognition across sessions
  let deviceUUID = localStorage.getItem("bankguard_device_uuid");
  if (!deviceUUID) {
    deviceUUID = generateUUID();
    localStorage.setItem("bankguard_device_uuid", deviceUUID);
  }

  const { os, version: osVersion } = detectOS();
  const { browser, version: browserVersion } = detectBrowser();
  const deviceType = detectDeviceType();

  const screenResolution = typeof window !== "undefined" && window.screen
    ? `${window.screen.width}x${window.screen.height}`
    : "1920x1080";

  const timezone = typeof Intl !== "undefined" && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "Asia/Kolkata";

  const language = typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  // Compute stable fingerprint
  const rawFingerprintString = `${deviceUUID}_${os}_${browser}_${screenResolution}_${timezone}`;
  const deviceFingerprint = hashString(rawFingerprintString);

  // Friendly human name
  const deviceName = `${os} ${deviceType} (${browser})`;

  return {
    deviceFingerprint,
    deviceUUID,
    deviceName,
    deviceType,
    operatingSystem: os,
    osVersion,
    browser,
    browserVersion,
    screenResolution,
    timezone,
    language,
    userAgent,
    location: "Vadodara, Gujarat",
    country: "India",
    city: "Vadodara",
  };
}
