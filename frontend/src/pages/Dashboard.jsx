import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  TrendingUp,
  Receipt,
  ArrowRight,
  Eye,
  RefreshCw,
  Plus,
  PlayCircle
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import TransactionModal from "../components/TransactionModal";

export default function Dashboard({ onNavigate }) {
  const {
    phone,
    dashboard,
    accounts,
    loading,
    refreshing,
    refreshAll,
    isFrozen,
    toggleAccountFreeze,
    executeNewTransaction,
  } = useFinancial();

  const [selectedTxn, setSelectedTxn] = useState(null);
  const [freezing, setFreezing] = useState(false);
  const [simulatingScenario, setSimulatingScenario] = useState(null);

  const handleToggleFreeze = async () => {
    setFreezing(true);
    try {
      await toggleAccountFreeze(!isFrozen);
    } catch (err) {
      alert("Failed to update freeze status: " + err.message);
    } finally {
      setFreezing(false);
    }
  };

  const runTestScenario = async (name, payload) => {
    setSimulatingScenario(name);
    try {
      await executeNewTransaction(payload);
    } catch (err) {
      alert(`Scenario ${name} error: ` + err.message);
    } finally {
      setSimulatingScenario(null);
    }
  };

  const getRiskBadge = (score, status) => {
    if (status === "blocked" || score >= 80) {
      return (
        <span className="badge badge-danger">
          <ShieldAlert size={11} />
          High Risk · {score}%
        </span>
      );
    }
    if (status === "flagged" || score >= 30) {
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={11} />
          Medium · {score}%
        </span>
      );
    }
    return (
      <span className="badge badge-safe">
        <ShieldCheck size={11} />
        Safe · {score}%
      </span>
    );
  };

  const maskedPhone = phone
    ? phone.length === 10
      ? `${phone.slice(0, 5)}•••••`
      : phone
    : "••••••••••";

  const advisory = dashboard?.advisory || {
    title: "Institutional Security Advisory",
    headline: "All Connected Accounts Within Baseline",
    detail: "Zero unauthorized breaches reported. Continuous Random Forest inference active.",
    recommendedAction: "System Healthy",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 1. TOP BANNER: GREETING & EMERGENCY ACTION CONTROLS */}
      <div
        className="bg-card"
        style={{
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, color: "var(--brand-primary)", textTransform: "uppercase" }}>
              Financial Security Overview
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>•</span>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
              Updated {dashboard?.lastUpdated ? "Just now" : "loading..."}
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Good afternoon, +91 {maskedPhone}
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 2 }}>
            Real-time monitoring and threat protection active across your {dashboard?.monitoredAccounts || accounts.length || 6} linked financial institutions.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%", maxWidth: "max-content" }}>
          {/* Emergency Account Freeze Button */}
          <button
            onClick={handleToggleFreeze}
            disabled={freezing}
            className={`btn ${isFrozen ? "btn-danger" : "btn-secondary"}`}
            style={{ fontSize: 12, flex: "1 1 auto" }}
          >
            {isFrozen ? <Unlock size={14} /> : <Lock size={14} />}
            {freezing ? "Updating..." : isFrozen ? "Unfreeze Accounts" : "Freeze Accounts"}
          </button>

          {/* Quick Threat Radar Action */}
          <button
            onClick={() => onNavigate && onNavigate("alerts")}
            className="btn btn-primary"
            style={{ fontSize: 12, flex: "1 1 auto" }}
          >
            <ShieldAlert size={14} /> Review Threat Radar
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC KPI CARDS (SINGLE SOURCE OF TRUTH DERIVED METRICS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card skeleton" style={{ height: 110, padding: 20 }} />
          ))
        ) : (
          [
            {
              label: "Total Monitored Balance",
              value: `₹${(dashboard?.totalBalance || 0).toLocaleString("en-IN")}`,
              meta: isFrozen ? "Accounts Frozen" : "+4.2% this month",
              sub: `Across ${dashboard?.monitoredAccounts || accounts.length} linked accounts`,
              badge: isFrozen ? "Frozen" : "Active",
              badgeType: isFrozen ? "danger" : "safe",
            },
            {
              label: "Safe Transactions",
              value: `${dashboard?.safeCount || 0}`,
              meta: `${dashboard?.safePercentage || 99.3}% Normal Rate`,
              sub: "Verified payment baseline",
              badge: "Normal",
              badgeType: "safe",
            },
            {
              label: "Threats Quarantined",
              value: `${dashboard?.threatCount || 0}`,
              meta: "Anomalies Blocked",
              sub: "Automated ML quarantine",
              badge: "Active Defense",
              badgeType: "danger",
            },
            {
              label: "Capital Protected",
              value: `₹${(dashboard?.capitalProtected || 0).toLocaleString("en-IN")}`,
              meta: "Zero Capital Loss",
              sub: "Prevented unauthorized outflow",
              badge: "Shielded",
              badgeType: "info",
            },
          ].map((kpi, idx) => (
            <div key={idx} className="bg-card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {kpi.label}
                </span>
                <span className={`badge badge-${kpi.badgeType}`}>{kpi.badge}</span>
              </div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                {kpi.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginTop: 8 }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{kpi.meta}</span>
                <span style={{ color: "var(--text-muted)" }}>{kpi.sub}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. INTERACTIVE RISK ENGINE TEST SCENARIOS BAR */}
      <div
        className="bg-card"
        style={{
          padding: "16px 20px",
          borderLeft: "4px solid var(--brand-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircle size={17} style={{ color: "var(--brand-primary)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              Test & Simulate Risk Engine Scenarios
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            Trigger real-time transaction evaluations against behavioral profile
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => runTestScenario("normal", {
              bankName: "SBI",
              merchant: "Swiggy Quick Food Pay",
              amount: 350,
              type: "UPI",
              location: "Vadodara, GJ",
              merchantCategory: "Food",
            })}
            disabled={simulatingScenario !== null}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            🥪 {simulatingScenario === "normal" ? "Testing..." : "Normal ₹350 Swiggy (LOW)"}
          </button>

          <button
            onClick={() => runTestScenario("large", {
              bankName: "HDFC",
              merchant: "Direct Real Estate Token",
              amount: 85000,
              type: "NEFT",
              location: "Vadodara, GJ",
              merchantCategory: "Bills",
            })}
            disabled={simulatingScenario !== null}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            💳 {simulatingScenario === "large" ? "Testing..." : "Large Outlier ₹85,000 (HIGH)"}
          </button>

          <button
            onClick={() => runTestScenario("atm", {
              bankName: "HDFC",
              merchant: "HDFC ATM · Mumbai Central",
              amount: 10000,
              type: "ATM",
              location: "Mumbai Central, MH",
              merchantCategory: "Cash",
            })}
            disabled={simulatingScenario !== null}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            🏧 {simulatingScenario === "atm" ? "Testing..." : "Midnight ATM Cash (HIGH)"}
          </button>

          <button
            onClick={() => runTestScenario("proxy", {
              bankName: "ICICI",
              merchant: "Unknown Dynamic QR Recipient",
              amount: 150000,
              type: "UPI",
              location: "Proxy / VPN Node",
              device: "Unknown Linux Device",
              merchantCategory: "Transfer",
            })}
            disabled={simulatingScenario !== null}
            className="btn btn-danger"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            ⚠️ {simulatingScenario === "proxy" ? "Testing..." : "Proxy QR ₹1.5L (CRITICAL - Auto Block)"}
          </button>
        </div>
      </div>

      {/* 4. MAIN WORKSPACE: RECENT ACTIVITY & THREAT RADAR */}
      <div className="dashboard-main-grid">
        {/* Left Column: Recent Statement Activity */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              Recent Monitored Payments
            </div>
            <button
              onClick={() => onNavigate && onNavigate("transactions")}
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: "4px 8px", color: "var(--brand-primary)" }}
            >
              Full Statement Ledger →
            </button>
          </div>

          <div className="table-container">
            <table className="bg-table">
              <thead>
                <tr>
                  <th>Merchant / Entity</th>
                  <th>Payment Type</th>
                  <th>Timestamp</th>
                  <th>Amount</th>
                  <th>Risk Score</th>
                  <th>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentTransactions?.length > 0 ? (
                  dashboard.recentTransactions.map((t, idx) => {
                    const isCredit = t.amount > 0 || t.transactionType === "CREDIT";
                    return (
                      <tr key={t.id || idx} style={{ cursor: "pointer" }} onClick={() => setSelectedTxn(t)}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.merchant}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.bank || "Linked Bank"}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">{t.type}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.time}</div>
                        </td>
                        <td>
                          <div
                            className="tabular-nums"
                            style={{
                              fontWeight: 700,
                              color: isCredit ? "var(--semantic-safe)" : "var(--text-primary)",
                            }}
                          >
                            {isCredit ? "+" : "-"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                          </div>
                        </td>
                        <td>{getRiskBadge(t.score || t.fraud_score, t.status)}</td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxn(t);
                            }}
                            className="btn btn-ghost"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                          >
                            <Eye size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
                      No recent payment activity recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Security Telemetry & Dynamic AI Advisory */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Security Status Box */}
          <div className="bg-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>
              Institutional Security Health
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: dashboard?.threatCount > 0 ? "var(--semantic-danger-bg)" : "var(--semantic-safe-bg)",
                  border: dashboard?.threatCount > 0 ? "1px solid var(--semantic-danger-border)" : "1px solid var(--semantic-safe-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: dashboard?.threatCount > 0 ? "var(--semantic-danger)" : "var(--semantic-safe)",
                }}
              >
                {dashboard?.threatCount > 0 ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {dashboard?.threatCount > 0 ? "Active Defense Engaged" : "Institutional Shield Active"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {dashboard?.threatCount ? `${dashboard.threatCount} anomalies actively tracked` : "Zero unauthorized breaches reported"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Carrier 2FA Status</span>
                <span style={{ color: "var(--semantic-safe)", fontWeight: 600 }}>● Operational</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>ML Inference Latency</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>3.8 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>High-Risk Threshold</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>≥ 70% Probability</span>
              </div>
            </div>
          </div>

          {/* Dynamic AI Fraud Analyst Advisory Card */}
          <div className="bg-card" style={{ padding: 20, borderLeft: "3px solid var(--brand-primary)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              AI Fraud Analyst Advisory
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              {advisory.detail || advisory.message}
            </p>
            <button
              onClick={() => onNavigate && onNavigate(advisory.actionLink || "alerts")}
              className="btn btn-secondary"
              style={{ width: "100%", fontSize: 12, padding: "6px 0" }}
            >
              {advisory.recommendedAction || "Inspect Flagged Threats"} →
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <TransactionModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
}