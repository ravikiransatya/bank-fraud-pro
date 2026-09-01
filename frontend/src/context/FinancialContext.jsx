import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";

const FinancialContext = createContext(null);

export function FinancialProvider({ phone, children }) {
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeRange, setTimeRange] = useState("30D"); // '7D' | '30D' | '90D'
  const [isFrozen, setIsFrozen] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);

  // Convert timeRange string to days
  const getDaysCount = (range) => {
    switch (range) {
      case "7D": return 7;
      case "90D": return 90;
      case "30D":
      default: return 30;
    }
  };

  // Main single-source fetcher
  const loadData = useCallback(async (isSilent = false) => {
    if (!phone) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const days = getDaysCount(timeRange);

      const [dashRes, accRes, txRes, altRes] = await Promise.all([
        API.get(`/analytics/dashboard?phone=${phone}&days=${days}`),
        API.get(`/banks/linked?phone=${phone}`),
        API.get(`/transactions?phone=${phone}&limit=50`),
        API.get(`/fraud/alerts?phone=${phone}`),
      ]);

      if (dashRes.data) {
        setDashboard(dashRes.data);
        setLastUpdated(new Date());
      }
      if (accRes.data?.accounts) {
        setAccounts(accRes.data.accounts);
        const anyFrozen = accRes.data.accounts.some((a) => a.isFrozen);
        setIsFrozen(anyFrozen);
      }
      if (txRes.data?.transactions) {
        setTransactions(txRes.data.transactions);
      }
      if (altRes.data?.alerts) {
        setAlerts(altRes.data.alerts);
      }
    } catch (err) {
      console.error("Failed to load financial datasets:", err);
      setError(err.message || "Unable to sync with live banking intelligence network.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phone, timeRange]);

  // Initial load + reload when phone or timeRange changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Real-Time Server-Sent Events (SSE) Stream Listener
  useEffect(() => {
    if (!phone) return;

    let eventSource = null;
    let reconnectTimeout = null;

    const connectSSE = () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const streamBase = apiBase.replace(/\/api\/?$/, "");
        const streamUrl = `${streamBase}/api/events/stream?phone=${encodeURIComponent(phone)}`;
        eventSource = new EventSource(streamUrl);

        eventSource.onopen = () => {
          setSseConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type !== "CONNECTED") {
              // Real-time security event received -> Immediately synchronize single source of truth!
              loadData(true);
            }
          } catch (parseErr) {
            // Ignore keepalive comments
          }
        };

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource.close();
          // Exponential backoff reconnect
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.warn("SSE connection notice:", err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [phone, loadData]);

  // 2. Safe Controlled 30-second Auto-Refresh with window focus revalidation
  useEffect(() => {
    if (!phone) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    const onFocus = () => {
      loadData(true);
    };

    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [phone, loadData]);

  // Manual Refresh
  const refreshAll = async () => {
    await loadData(true);
  };

  // Resolve / Quarantine Fraud Alert
  const resolveAlert = async (id, action) => {
    try {
      const newStatus = action === "quarantine" ? "BLOCKED" : "RESOLVED";
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );

      await API.patch(`/fraud/alerts/${id}`, {
        phone,
        action,
      });

      loadData(true);
      return { success: true };
    } catch (err) {
      console.error("Resolve alert error:", err);
      loadData(true);
      return { success: false, error: err.message };
    }
  };

  // Toggle Emergency Account Freeze
  const toggleAccountFreeze = async () => {
    try {
      const nextState = !isFrozen;
      setIsFrozen(nextState);

      await API.post("/banks/freeze", {
        phone,
        freeze: nextState,
      });

      loadData(true);
      return { success: true, frozen: nextState };
    } catch (err) {
      console.error("Toggle freeze error:", err);
      setIsFrozen(!isFrozen);
      return { success: false, error: err.message };
    }
  };

  // Simulate/Execute New Transaction
  const executeNewTransaction = async (txnData) => {
    try {
      const res = await API.post("/transactions", {
        phone,
        ...txnData,
      });

      await loadData(true);
      return res.data;
    } catch (err) {
      console.error("Execute transaction error:", err);
      throw err;
    }
  };

  // Relative Time Helper
  const formatRelativeTime = (date) => {
    if (!date) return "Just now";
    const now = new Date();
    const diffSecs = Math.floor((now - new Date(date)) / 1000);

    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <FinancialContext.Provider
      value={{
        phone,
        dashboard,
        accounts,
        transactions,
        alerts,
        loading,
        refreshing,
        error,
        lastUpdated,
        timeRange,
        setTimeRange,
        isFrozen,
        sseConnected,
        refreshAll,
        resolveAlert,
        toggleAccountFreeze,
        executeNewTransaction,
        formatRelativeTime,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error("useFinancial must be used within a FinancialProvider");
  }
  return context;
}
