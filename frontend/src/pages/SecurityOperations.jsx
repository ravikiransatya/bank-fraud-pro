import { useState, useEffect } from "react";
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  PlayCircle,
  Clock,
  Layers,
  Zap,
  Globe,
  Smartphone,
  Eye,
  SlidersHorizontal
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import LiveSecurityFeed from "../components/LiveSecurityFeed";
import IncidentDetailModal from "../components/IncidentDetailModal";
import API from "../services/api";

export default function SecurityOperations() {
  const { phone, refreshAll, refreshing } = useFinancial();
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(null);

  const fetchIncidents = async () => {
    if (!phone) return;
    try {
      const res = await API.get(`/incidents?phone=${phone}`);
      if (res.data?.incidents) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [phone]);

  const runSimulation = async (scenario) => {
    setSimulating(scenario);
    try {
      await API.post("/security-ops/simulate", { phone, scenario });
      await refreshAll();
      await fetchIncidents();
    } catch (err) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Security Operations Center (SOC)
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Real-time event bus streaming, incident correlation workflows, and automated perimeter defenses.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => {
              fetchIncidents();
              refreshAll();
            }}
            disabled={refreshing}
            className="btn btn-ghost"
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            <RefreshCw size={14} className={refreshing ? "live-pulse" : ""} /> Refresh SOC
          </button>
        </div>
      </div>

      {/* Real-time Simulations Controls Bar */}
      <div
        className="bg-card"
        style={{
          padding: "16px 20px",
          marginBottom: 20,
          borderLeft: "4px solid var(--brand-primary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircle size={17} style={{ color: "var(--brand-primary)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              Operational Event & Threat Simulator
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            Publish controlled real-time security events directly into the event stream
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => runSimulation("unknown_device")}
            disabled={simulating !== null}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            📱 {simulating === "unknown_device" ? "Publishing..." : "Simulate Unknown Device Login"}
          </button>

          <button
            onClick={() => runSimulation("impossible_travel")}
            disabled={simulating !== null}
            className="btn btn-danger"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            🌐 {simulating === "impossible_travel" ? "Publishing..." : "Simulate Impossible Travel (Hyderabad → Delhi)"}
          </button>

          <button
            onClick={() => runSimulation("velocity_burst")}
            disabled={simulating !== null}
            className="btn btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
          >
            ⚡ {simulating === "velocity_burst" ? "Publishing..." : "Simulate Velocity Spike (5 txns / 90s)"}
          </button>
        </div>
      </div>

      {/* Grid: Live Feed (Left) & Active Incidents (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Left Column: Real-time Live Security Monitor */}
        <div>
          <LiveSecurityFeed phone={phone} />
        </div>

        {/* Right Column: Correlated Incidents Matrix */}
        <div className="bg-card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} style={{ color: "var(--semantic-danger)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
                Correlated Security Incidents ({incidents.length})
              </span>
            </div>
            <span className="badge badge-neutral">Grouped Anomalies</span>
          </div>

          {loading ? (
            <div className="bg-card skeleton" style={{ height: 200 }} />
          ) : incidents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {incidents.map((inc) => {
                const isCrit = inc.severity === "CRITICAL";
                const isContained = inc.status === "CONTAINED";
                return (
                  <div
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    style={{
                      padding: "12px 14px",
                      background: "#f8fafc",
                      border: "1px solid var(--border-card)",
                      borderRadius: 8,
                      borderLeft: `3px solid ${isCrit ? "var(--semantic-danger)" : "var(--semantic-warning)"}`,
                      cursor: "pointer",
                      transition: "box-shadow 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "var(--shadow-card)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span className={`badge ${isCrit ? "badge-danger" : "badge-warning"}`} style={{ fontSize: 10 }}>
                        {inc.incidentId} · {inc.severity}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{inc.status}</span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                      {inc.title}
                    </div>

                    <p style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.4, margin: "4px 0 8px" }}>
                      {inc.summary}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                      <span style={{ color: "var(--text-muted)" }}>
                        {inc.timeline?.length || 0} timeline events
                      </span>
                      <span style={{ color: "var(--brand-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                        Investigate <Eye size={12} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
              No active correlated incidents.
            </div>
          )}
        </div>
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          phone={phone}
          onActionComplete={fetchIncidents}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}
