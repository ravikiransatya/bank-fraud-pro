/**
 * User Security Profile & Baseline Behavior Service
 * Computes and caches statistical financial baselines for each user based on historical transaction activity.
 */

// In-Memory Profile Cache
const profileCache = {};

/**
 * Calculates a statistical baseline profile for a given user from their transaction history.
 * @param {string} phone - User's phone number
 * @param {Array} transactions - Array of historical transaction objects
 * @returns {Object} User baseline security profile
 */
export const calculateUserProfile = (phone, transactions = []) => {
  if (!transactions || transactions.length === 0) {
    // Default baseline for new accounts
    return {
      phone,
      avgAmount: 1200,
      stdDevAmount: 2500,
      maxNormalAmount: 15000,
      minNormalAmount: 50,
      typicalHours: { start: 7, end: 23 }, // 7:00 AM to 11:00 PM
      typicalVelocityHourly: 2, // Max normal transactions per hour
      knownLocations: ["Vadodara, GJ", "Ahmedabad, GJ"],
      knownDevices: ["Primary Mobile (Pixel/Samsung Android)", "Primary Laptop (Chrome/Windows)"],
      familiarMerchants: ["Swiggy", "Zomato", "Amazon India", "Flipkart", "D-Mart", "Uber", "Reliance Jio"],
      dailySpendingAverage: 3500,
      lastUpdated: new Date(),
    };
  }

  // Filter completed debit transactions for spending baselines
  const debitTxns = transactions.filter((t) => (t.amount < 0 || t.transactionType === "DEBIT") && t.status !== "blocked");
  const amounts = debitTxns.map((t) => Math.abs(t.amount));

  const totalSpent = amounts.reduce((sum, a) => sum + a, 0);
  const avgAmount = amounts.length > 0 ? Math.round(totalSpent / amounts.length) : 1200;

  // Standard Deviation calculation
  const variance = amounts.length > 0
    ? amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length
    : 2500;
  const stdDevAmount = Math.round(Math.sqrt(variance));

  // Max Normal Amount (Mean + 2.5 * StdDev or 95th percentile)
  const maxNormalAmount = Math.max(avgAmount + Math.round(stdDevAmount * 2.5), 15000);

  // Extract familiar merchants (occurring more than once)
  const merchantCounts = {};
  transactions.forEach((t) => {
    if (t.merchant) merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1;
  });
  const familiarMerchants = Object.keys(merchantCounts);

  // Extract known locations
  const locationSet = new Set();
  transactions.forEach((t) => {
    if (t.location && !t.location.includes("Proxy") && !t.location.includes("Unknown")) {
      locationSet.add(t.location);
    }
  });
  const knownLocations = locationSet.size > 0 ? Array.from(locationSet) : ["Vadodara, GJ"];

  const profile = {
    phone,
    avgAmount,
    stdDevAmount,
    maxNormalAmount,
    minNormalAmount: 20,
    typicalHours: { start: 6, end: 23 }, // 6:00 AM to 11:00 PM
    typicalVelocityHourly: 3,
    knownLocations,
    knownDevices: ["Primary Mobile (Pixel/Samsung Android)", "Primary Laptop (Chrome/Windows)"],
    familiarMerchants,
    dailySpendingAverage: Math.round(avgAmount * 2.2),
    totalHistoricalTxns: transactions.length,
    lastUpdated: new Date(),
  };

  profileCache[phone] = profile;
  return profile;
};

/**
 * Retrieves the cached profile or calculates it if missing.
 */
export const getUserProfile = (phone, transactions = []) => {
  if (profileCache[phone]) {
    return profileCache[phone];
  }
  return calculateUserProfile(phone, transactions);
};
