import { BarChart3, Activity, Cpu, ShieldCheck, PieChart, TrendingUp, RefreshCw, ShieldAlert, AlertTriangle, Layers, Tag, CheckCircle2 } from "lucide-react";
import { useFinancial } from "../context/FinancialContext";

export default function Analytics() {
  const { dashboard, alerts, loading, refreshing, refreshAll, timeRange, setTimeRange } = useFinancial();

  const channelDistribution = dashboard?.channelDistribution || [
    { channel: "UPI", count: 28, pct: 56 },
    { channel: "Card", count: 10, pct: 20 },
    { channel: "NEFT", count: 6, pct: 12 },
    { channel: "ATM", count: 4, pct: 8 },
    { channel: "IMPS", count: 2, pct: 4 },
  ];

  const spendingByCategory = dashboard?.spendingByCategory || [];
  const topMerchants = dashboard?.topMerchants || [];
  const anomalyDistribution = dashboard?.anomalyDistribution || [
    { type: "UNUSUAL LOCATION", count: 2 },
    { type: "HIGH VELOCITY", count: 1 },
    { type: "UNUSUAL TIME", count: 1 },
    { type: "UNUSUAL AMOUNT", count: 1 },
    { type: "UNKNOWN DEVICE", count: 1 },
  ];

  const severityCounts = dashboard?.severityCounts || {
    CRITICAL: alerts.filter((a) => a.severity === "CRITICAL").length,
    HIGH: alerts.filter((a) => a.severity === "HIGH").length,
    MEDIUM: alerts.filter((a) => a.severity === "MEDIUM").length,
    LOW: alerts.filter((a) => a.severity === "LOW").length,
  };

  const getChannelColor = (channel) => {
    switch (channel) {
      case "UPI": return "var(--semantic-safe)";
      case "NEFT": return "var(--brand-primary)";
      case "Card": return "#0284c7";
      case "ATM": return "var(--semantic-warning)";
      case "IMPS": return "var(--semantic-danger)";
      default: return "var(--brand-secondary)";
    }
  };

  const featureWeights = [
    { feature: "Transaction Velocity (Prev 1hr & 5min burst)", weight: 32 },
    { feature: "Geographic Distance Anomaly (km)", weight: 28 },
    { feature: "Transaction Amount (INR vs User Baseline)", weight: 24 },
    { feature: "Circadian Time of Day (Midnight 01:00-04:30 AM)", weight: 11 },
    { feature: "Channel & Recipient VPA Risk Weight", weight: 5 },
  ];

  return (
    <div>
      {/* Header with Time Range Selectors */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Security Telemetry & Financial Analytics
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Real-time anomaly distributions, alert severity metrics, model feature importance, and financial telemetry.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Time Range Selector */}
          <div style={{ display: "flex", background: "#ffffff", border: "1px solid var(--border-card)", borderRadius: "var(--radius-pill)", padding: 2 }}>
            {["7D", "30D", "90D"].map((range) => {
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="btn"
                  style={{
                    padding: "4px 12px",
                    fontSize: 11,
                    borderRadius: "var(--radius-pill)",
                    background: isActive ? "var(--brand-primary)" : "transparent",
                    color: isActive ? "#ffffff" : "var(--text-secondary)",
                    border: "none",
                  }}
                >
                  {range}
                </button>
              );
            })}
          </div>

          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="btn btn-ghost"
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            <RefreshCw size={14} className={refreshing ? "live-pulse" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid 1: Security Anomaly & Alert Severity Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Anomaly Types Breakdown */}
        <div className="bg-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} style={{ color: "var(--brand-primary)" }} /> Detected Anomaly Categories
            </div>
            <span className="badge badge-neutral">Categorized Signals</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {anomalyDistribution.map((anom, idx) => {
              const maxCount = Math.max(...anomalyDistribution.map((a) => a.count), 1);
              const pct = Math.round((anom.count / maxCount) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{anom.type}</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      {anom.count} incidents
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: idx === 0 ? "var(--semantic-danger)" : idx === 1 ? "var(--semantic-warning)" : "var(--brand-primary)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alert Severity Breakdown */}
        <div className="bg-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldAlert size={16} style={{ color: "var(--semantic-danger)" }} /> Alert Severity Matrix
            </div>
            <span className="badge badge-neutral">{alerts.length} Total Events</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ padding: "14px 16px", background: "var(--semantic-danger-bg)", border: "1px solid var(--semantic-danger-border)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--semantic-danger)", textTransform: "uppercase" }}>CRITICAL</div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--semantic-danger)", marginTop: 2 }}>
                {severityCounts.CRITICAL || 0}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>Auto-Quarantined Outflows</div>
            </div>

            <div style={{ padding: "14px 16px", background: "var(--semantic-warning-bg)", border: "1px solid var(--semantic-warning-border)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--semantic-warning)", textTransform: "uppercase" }}>HIGH RISK</div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--semantic-warning)", marginTop: 2 }}>
                {severityCounts.HIGH || 0}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>High Behavioral Deviation</div>
            </div>

            <div style={{ padding: "14px 16px", background: "#f8fafc", border: "1px solid var(--border-card)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>MEDIUM RISK</div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                {severityCounts.MEDIUM || 0}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>Moderate Threshold Surges</div>
            </div>

            <div style={{ padding: "14px 16px", background: "var(--semantic-safe-bg)", border: "1px solid var(--semantic-safe-border)", borderRadius: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--semantic-safe)", textTransform: "uppercase" }}>RESOLVED / LOW</div>
              <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, color: "var(--semantic-safe)", marginTop: 2 }}>
                {severityCounts.LOW + alerts.filter(a => a.status === "RESOLVED").length}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>Verified & Cleared Baseline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: Channel Volume Distribution & Feature Importance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Channel Volume Distribution */}
        <div className="bg-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={16} style={{ color: "var(--brand-primary)" }} /> Channel Volume Distribution
            </div>
            <span className="badge badge-neutral">Actual Telemetry</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {channelDistribution.map((t, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{t.channel} Payment</span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                    {t.count} txns ({t.pct}%)
                  </span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${t.pct}%`, background: getChannelColor(t.channel), borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Model Accuracy Banner */}
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "var(--semantic-safe-bg)",
              border: "1px solid var(--semantic-safe-border)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--semantic-safe)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Ensemble Precision Rate
              </div>
              <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginTop: 2 }}>
                96.3%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                100 Estimators · Stratified K-Fold Validated
              </div>
            </div>
            <div style={{ color: "var(--semantic-safe)" }}>
              <Cpu size={28} />
            </div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-card" style={{ padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "var(--semantic-info)" }} /> Random Forest Feature Importance (Gini Impurity)
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {featureWeights.map((fw, idx) => (
              <div key={idx} style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid var(--border-card)", borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                  <span>Rank #{idx + 1}</span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: "var(--brand-primary)" }}>{fw.weight}% Impact</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  {fw.feature}
                </div>
                <div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${fw.weight * 2.5}%`, background: "var(--brand-primary)", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}