/**
 * BankGuard AI — Device Trust & Hardware Management Verification Suite
 * Tests real login-aware device registration, multi-user isolation, duplicate prevention,
 * dynamic risk scoring, and trust/flag/revoke lifecycles.
 */

import {
  registerOrUpdateDevice,
  getUserDevices,
  updateDeviceTrust,
  revokeUserDevice,
  removeUserDevice,
  calculateDeviceRisk,
} from "../services/deviceService.js";

const USER_A_PHONE = "9347496531";
const USER_B_PHONE = "9876543210";

let passed = 0;
let failed = 0;

function assert(condition, name, details = "") {
  if (condition) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${name} — ${details}`);
    failed++;
  }
}

async function runDeviceTrustTests() {
  console.log("\n=======================================================");
  console.log("⚡ RUNNING DEVICE TRUST & HARDWARE MANAGEMENT TEST SUITE");
  console.log("=======================================================\n");

  // TEST 1: Register User A's device
  const deviceA = await registerOrUpdateDevice({
    phone: USER_A_PHONE,
    clientMetadata: {
      deviceFingerprint: "fingerprint_user_a_chrome",
      deviceName: "Windows 11 PC (Google Chrome)",
      deviceType: "Desktop",
      operatingSystem: "Windows",
      osVersion: "11",
      browser: "Google Chrome",
      browserVersion: "128.0",
      screenResolution: "1920x1080",
      timezone: "Asia/Kolkata",
      language: "en-US",
    },
    ipAddress: "152.58.12.94",
    isLogin: true,
  });

  assert(
    deviceA && deviceA.phone === USER_A_PHONE && deviceA.deviceFingerprint === "fingerprint_user_a_chrome",
    "Test 1: User A device successfully registered upon login"
  );

  // TEST 2: Register User B from another device
  const deviceB = await registerOrUpdateDevice({
    phone: USER_B_PHONE,
    clientMetadata: {
      deviceFingerprint: "fingerprint_user_b_safari",
      deviceName: "MacBook Pro (Apple Safari)",
      deviceType: "Desktop",
      operatingSystem: "macOS",
      osVersion: "Sonoma",
      browser: "Apple Safari",
      browserVersion: "17.4",
      screenResolution: "2560x1600",
      timezone: "Asia/Kolkata",
      language: "en-GB",
    },
    ipAddress: "103.212.14.81",
    isLogin: true,
  });

  assert(
    deviceB && deviceB.phone === USER_B_PHONE,
    "Test 2a: User B device successfully registered"
  );

  // TEST 2b: Verify Multi-User Isolation (User B sees ONLY User B devices, User A sees ONLY User A devices)
  const userADevices = await getUserDevices(USER_A_PHONE, "fingerprint_user_a_chrome");
  const userBDevices = await getUserDevices(USER_B_PHONE, "fingerprint_user_b_safari");

  const userAHasB = userADevices.some((d) => d.phone === USER_B_PHONE || d.deviceFingerprint === "fingerprint_user_b_safari");
  const userBHasA = userBDevices.some((d) => d.phone === USER_A_PHONE || d.deviceFingerprint === "fingerprint_user_a_chrome");

  assert(
    !userAHasB && !userBHasA,
    "Test 2b: Strict User Scoping Isolation — User A and User B device records are 100% isolated"
  );

  // TEST 3: Login again as User A from same browser -> Duplicate prevention
  const countBefore = userADevices.length;
  const initialLastSeen = deviceA.lastSeenAt;

  // Small delay to verify timestamp update
  await new Promise((r) => setTimeout(r, 10));

  const deviceARepeat = await registerOrUpdateDevice({
    phone: USER_A_PHONE,
    clientMetadata: {
      deviceFingerprint: "fingerprint_user_a_chrome",
      deviceName: "Windows 11 PC (Google Chrome)",
    },
    ipAddress: "152.58.12.95",
    isLogin: true,
  });

  const userADevicesAfter = await getUserDevices(USER_A_PHONE, "fingerprint_user_a_chrome");
  assert(
    userADevicesAfter.length === countBefore,
    "Test 3: Duplicate device prevention on repeat login from same browser fingerprint"
  );

  // TEST 4: CURRENT DEVICE Identification
  const currentDev = userADevicesAfter.find((d) => d.deviceFingerprint === "fingerprint_user_a_chrome");
  assert(
    currentDev && currentDev.isCurrentDevice === true,
    "Test 4: Current active browser session is dynamically identified as CURRENT DEVICE"
  );

  // TEST 5: Trust Action
  const updatedTrust = await updateDeviceTrust(USER_A_PHONE, currentDev.id || currentDev._id, "TRUSTED");
  assert(
    updatedTrust && updatedTrust.trustStatus === "TRUSTED" && updatedTrust.riskScore <= 10,
    "Test 5: Device Trust action persists with low risk score"
  );

  // TEST 6: Flag as Suspicious Action
  const flaggedDev = await updateDeviceTrust(USER_A_PHONE, currentDev.id || currentDev._id, "SUSPICIOUS");
  assert(
    flaggedDev && flaggedDev.trustStatus === "SUSPICIOUS" && flaggedDev.riskScore >= 60,
    "Test 6: Flag as Suspicious action persists with elevated risk score (>60%)"
  );

  // TEST 7: Revoke Device Action
  const revokedDev = await revokeUserDevice(USER_A_PHONE, currentDev.id || currentDev._id);
  assert(
    revokedDev && revokedDev.trustStatus === "REVOKED" && revokedDev.isRevoked === true && revokedDev.riskScore === 100,
    "Test 7: Revoke Device action sets trustStatus=REVOKED, isRevoked=true, and 100% risk"
  );

  // TEST 8: Dynamic Risk Engine Calculation
  const headlessRisk = calculateDeviceRisk({
    trustStatus: "TRUSTED",
    userAgent: "Mozilla/5.0 HeadlessChrome/120.0",
    operatingSystem: "Linux",
  });
  assert(headlessRisk >= 50, "Test 8: Dynamic Risk Engine penalizes Headless/Bot User-Agent");

  console.log("\n=======================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) process.exit(1);
}

runDeviceTrustTests();
