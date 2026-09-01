import { useState } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MapPin,
  Smartphone,
  Ban,
  CheckCircle2,
  UserCheck,
  Zap,
  Layers,
  ArrowRight
} from "lucide-react";
import API from "../services/api";

export default function IncidentDetailModal({ incident, phone, onActionComplete, onClose }) {
  const [loadingAction, setLoadingAction] = useState(false);

  if (!incident) return null;

  const handleAction = async (action) => {
    setLoadingAction(true);
    try {
      await API.patch(`/incidents/${incident.incidentId || incident.id}/action`, {
        phone,
        action,
      });
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      alert("Incident action failed: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const isCritical = incident.severity === "CRITICAL";
  const isHigh = incident.severity === "HIGH";
  const isContained = incident.status === "CONTAINED";
  const isResolved = incident.status === "RESOLVED";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1150,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="bg-card"
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          borderRadius: 14,
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isCritical
              ? "var(--semantic-danger-bg)"
              : isHigh
              ? "var(--semantic-warning-bg)"
              : "var(--semantic-safe-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isCritical ? (
              <ShieldAlert size={22} style={{ color: "var(--semantic-danger)" }} />
            ) : isHigh ? (
              <AlertTriangle size={22} style={{ color: "var(--semantic-warning)" }} />
            ) : (
              <ShieldCheck size={22} style={{ color: "var(--semantic-safe)" }} />
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                Security Incident: {incident.incidentId || incident.id}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Severity: <strong style={{ color: "var(--text-primary)" }}>{incident.severity}</strong> · Status: <strong style={{ color: "var(--text-primary)" }}>{incident.status}</strong>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ width: 30, height: 30, padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Summary */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {incident.title}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
              {incident.summary}
            </p>
          </div>

          {/* Triggered Rules */}
          {incident.triggeredRules && incident.triggeredRules.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
                Triggered Security Rules
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {incident.triggeredRules.map((rule, idx) => (
                  <span key={idx} className="badge badge-danger" style={{ fontSize: 11 }}>
                    • {rule}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chronological Timeline */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
              Chronological Security Timeline
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 8, borderLeft: "2px solid var(--border-card)" }}>
              {(incident.timeline || []).map((step, idx) => (
                <div key={idx} style={{ position: "relative", paddingLeft: 14 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: -13,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: step.severity === "CRITICAL"
                        ? "var(--semantic-danger)"
                        : step.severity === "HIGH"
                        ? "var(--semantic-warning)"
                        : "var(--brand-primary)",
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                      {step.time}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      [{step.actor || "SYSTEM"}]
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>
                    {step.event}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Associated Footprint Details */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "12px 14px",
              background: "#f8fafc",
              border: "1px solid var(--border-card)",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Hardware Origin</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>{incident.device || "Unknown Client"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Geo-Location Routing</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>{incident.location || "Detected IP Node"}</div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border-card)",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {!isResolved && (
              <>
                <button
                  onClick={() => handleAction("RESOLVE")}
                  disabled={loadingAction}
                  className="btn btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  <CheckCircle2 size={13} style={{ color: "var(--semantic-safe)" }} /> Resolve Incident
                </button>
                <button
                  onClick={() => handleAction("INVESTIGATE")}
                  disabled={loadingAction}
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  <UserCheck size={13} /> Assign to Desk
                </button>
              </>
            )}

            {!isContained && (
              <button
                onClick={() => handleAction("CONTAIN")}
                disabled={loadingAction}
                className="btn btn-danger"
                style={{ fontSize: 12 }}
              >
                <Ban size={13} /> Contain & Restrict
              </button>
            )}
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ fontSize: 12 }}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
