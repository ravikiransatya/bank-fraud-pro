import { useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldCheck,
  Ban,
  RefreshCw,
  Search,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  UserCheck
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import AlertDetailDrawer from "../components/AlertDetailDrawer";

export default function FraudAlerts() {
  const { alerts, loading, refreshing, refreshAll, resolveAlert } = useFinancial();

  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date"); // 'riskScore' | 'amount' | 'date' | 'severity'
  const [search, setSearch] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleResolveAction = async (id, action) => {
    setActionLoadingId(id);
    await resolveAlert(id, action);
    setActionLoadingId(null);
  };

  // Metrics summary
  const totalActive = alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED").length;
  const criticalCount = alerts.filter((a) => (a.severity === "CRITICAL" || a.level === "critical") && a.status !== "RESOLVED" && a.status !== "DISMISSED").length;
  const investigatingCount = alerts.filter((a) => a.status === "INVESTIGATING").length;
  const blockedCount = alerts.filter((a) => a.status === "BLOCKED").length;
  const resolvedCount = alerts.filter((a) => a.status === "RESOLVED").length;

  // Filter & Sort alerts dynamically
  const filteredAlerts = useMemo(() => {
    let list = alerts.filter((a) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q) ||
        a.account?.toLowerCase().includes(q);

      const aStatus = (a.status || "OPEN").toUpperCase();
      const aSev = (a.severity || a.level || "MEDIUM").toUpperCase();

      const matchesStatus =
        statusFilter === "all"
          ? aStatus !== "RESOLVED" && aStatus !== "DISMISSED"
          : statusFilter === "critical"
          ? aSev === "CRITICAL" && aStatus !== "RESOLVED"
          : statusFilter === "investigating"
          ? aStatus === "INVESTIGATING"
          : statusFilter === "blocked"
          ? aStatus === "BLOCKED"
          : statusFilter === "resolved"
          ? aStatus === "RESOLVED"
          : statusFilter === "dismissed"
          ? aStatus === "DISMISSED"
          : true;

      const matchesSeverity =
        severityFilter === "All" || aSev === severityFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesSeverity;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "riskScore") {
        return (b.riskScore || b.score || 0) - (a.riskScore || a.score || 0);
      }
      if (sortBy === "amount") {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === "severity") {
        const rank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (rank[b.severity?.toUpperCase() || "MEDIUM"] || 2) - (rank[a.severity?.toUpperCase() || "MEDIUM"] || 2);
      }
      // default date
      return new Date(b.detectedAt || 0) - new Date(a.detectedAt || 0);
    });

    return list;
  }, [alerts, search, statusFilter, severityFilter, sortBy]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Threat Intelligence & Fraud Operations
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Real-time multi-factor anomaly telemetry, explainable risk classifications, and automated defense quarantines.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge badge-${criticalCount > 0 ? "danger" : "safe"}`}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: criticalCount > 0 ? "var(--semantic-danger)" : "var(--semantic-safe)" }} className="live-pulse" />
            {criticalCount > 0 ? `${criticalCount} Critical Incursions` : "Perimeter Secured"}
          </span>

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

      {/* Threat Metrics Overview Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          { label: "Active Threats", value: totalActive, badge: "Pending", type: totalActive > 0 ? "warning" : "safe" },
          { label: "Critical Anomalies", value: criticalCount, badge: "P0 Urgent", type: criticalCount > 0 ? "danger" : "neutral" },
          { label: "Under Investigation", value: investigatingCount, badge: "Assigned", type: "info" },
          { label: "Quarantined / Blocked", value: blockedCount, badge: "Shielded", type: "danger" },
          { label: "Resolved Historical", value: resolvedCount, badge: "Cleared", type: "safe" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
              <span>{stat.label}</span>
              <span className={`badge badge-${stat.type}`} style={{ fontSize: 9.5, padding: "1px 5px" }}>{stat.badge}</span>
            </div>
            <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div
        className="bg-card"
        style={{
          padding: "12px 16px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={15} style={{ color: "var(--text-muted)", position: "absolute", left: 10 }} />
          <input
            type="text"
            className="bg-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threats, accounts, or anomaly reasons..."
            style={{ paddingLeft: 32, fontSize: 12.5 }}
          />
        </div>

        {/* Severity Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-input"
            style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Sort By */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-input"
            style={{ width: "auto", padding: "4px 8px", fontSize: 12 }}
          >
            <option value="date">Date Detected</option>
            <option value="riskScore">Risk Score (High to Low)</option>
            <option value="amount">Amount at Risk</option>
            <option value="severity">Severity Rank</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, borderBottom: "1px solid var(--border-card)", paddingBottom: 8, overflowX: "auto" }}>
        {[
          { key: "all", label: `Active (${totalActive})` },
          { key: "critical", label: `Critical (${criticalCount})` },
          { key: "investigating", label: `Investigating (${investigatingCount})` },
          { key: "blocked", label: `Quarantined (${blockedCount})` },
          { key: "resolved", label: `Resolved (${resolvedCount})` },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="btn"
              style={{
                padding: "4px 12px",
                fontSize: 12,
                borderRadius: "var(--radius-pill)",
                background: isActive ? "var(--brand-primary-light)" : "transparent",
                color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                border: isActive ? "1px solid var(--brand-primary)" : "1px solid transparent",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Threats List */}
      {loading ? (
        <div className="bg-card skeleton" style={{ height: 280 }} />
      ) : filteredAlerts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAlerts.map((alert) => {
            const isCritical = alert.level === "critical" || alert.severity === "CRITICAL";
            const isHigh = (alert.level === "warning" || alert.severity === "HIGH") && !isCritical;
            const isMedium = alert.severity === "MEDIUM";
            const isResolved = alert.status === "RESOLVED";
            const isBlocked = alert.status === "BLOCKED";
            const isInvestigating = alert.status === "INVESTIGATING";

            const badgeClass = isBlocked
              ? "badge-danger"
              : isCritical
              ? "badge-danger"
              : isHigh || isMedium
              ? "badge-warning"
              : "badge-safe";

            const leftBorderColor = isBlocked
              ? "var(--semantic-danger)"
              : isCritical
              ? "var(--semantic-danger)"
              : isHigh
              ? "var(--semantic-warning)"
              : "var(--semantic-safe)";

            return (
              <div
                key={alert.id}
                className="bg-card"
                style={{
                  padding: "18px 20px",
                  borderLeft: `4px solid ${leftBorderColor}`,
                  cursor: "pointer",
                  transition: "box-shadow 0.15s ease",
                }}
                onClick={() => setSelectedAlertId(alert.id)}
              >
                {/* Alert Card Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`badge ${badgeClass}`}>
                      {isBlocked ? <Ban size={11} /> : isCritical ? <ShieldAlert size={11} /> : isInvestigating ? <UserCheck size={11} /> : <AlertTriangle size={11} />}
                      {isBlocked ? "QUARANTINED" : isResolved ? "RESOLVED" : isInvestigating ? "INVESTIGATING" : `${(alert.severity || "MEDIUM").toUpperCase()} THREAT`}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
                      {alert.id} · {alert.account}
                    </span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{alert.time}</span>
                </div>

                {/* Title & Description */}
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
                  {alert.title}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                  {alert.description || alert.desc}
                </p>

                {/* Indicators / Explainable Reasons */}
                {alert.indicators && alert.indicators.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {alert.indicators.map((ind, iIdx) => (
                      <span key={iIdx} className="badge badge-neutral" style={{ fontSize: 11 }}>
                        • {ind}
                      </span>
                    ))}
                  </div>
                )}

                {/* Risk Probability Meter */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 5 }}>
                    <span>Random Forest Model Probability</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: isCritical || isBlocked ? "var(--semantic-danger)" : "var(--semantic-warning)" }}>
                      {alert.score || alert.riskScore}% Probability
                    </span>
                  </div>
                  <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${alert.score || alert.riskScore}%`,
                        background: isCritical || isBlocked
                          ? "var(--semantic-danger)"
                          : isHigh || isMedium
                          ? "var(--semantic-warning)"
                          : "var(--semantic-safe)",
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom Bar: Action Buttons & Inspect */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--border-subtle)",
                    paddingTop: 12,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedAlertId(alert.id)}
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: "4px 8px", color: "var(--brand-primary)" }}
                  >
                    <Eye size={13} /> Deep Investigation Breakdown →
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    {!isResolved && !isBlocked && (
                      <>
                        <button
                          onClick={() => handleResolveAction(alert.id, "safe")}
                          disabled={actionLoadingId === alert.id}
                          className="btn btn-secondary"
                          style={{ fontSize: 11.5, padding: "5px 10px" }}
                        >
                          <CheckCircle2 size={12} style={{ color: "var(--semantic-safe)" }} /> Mark Legitimate
                        </button>
                        <button
                          onClick={() => handleResolveAction(alert.id, "investigate")}
                          disabled={actionLoadingId === alert.id}
                          className="btn btn-ghost"
                          style={{ fontSize: 11.5, padding: "5px 10px" }}
                        >
                          <UserCheck size={12} /> Investigate
                        </button>
                      </>
                    )}

                    {!isBlocked && (
                      <button
                        onClick={() => handleResolveAction(alert.id, "quarantine")}
                        disabled={actionLoadingId === alert.id}
                        className="btn btn-danger"
                        style={{ fontSize: 11.5, padding: "5px 10px" }}
                      >
                        <Ban size={12} /> Quarantine & Block
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          className="bg-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--semantic-safe-bg)",
              border: "1px solid var(--semantic-safe-border)",
              color: "var(--semantic-safe)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            Zero Active Threat Incursions
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4, maxWidth: 360, margin: "6px auto 0" }}>
            All flagged anomalies have been investigated and cleared. Your account perimeter is currently secure.
          </p>
        </div>
      )}

      {/* Slide-over Deep Investigation Drawer */}
      {selectedAlertId && (
        <AlertDetailDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
        />
      )}
    </div>
  );
}