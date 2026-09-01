import { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  MapPin,
  Smartphone,
  CreditCard,
  Building2,
  HelpCircle,
  TrendingUp,
  FileText,
  UserCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import API from "../services/api";
import { useFinancial } from "../context/FinancialContext";

export default function AlertDetailDrawer({ alertId, onClose }) {
  const { phone, refreshAll } = useFinancial();
  const [alertData, setAlertData] = useState(null);
  const [txnData, setTxnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!alertId || !phone) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/fraud/alerts/${alertId}/investigate?phone=${phone}`);
        if (res.data) {
          setAlertData(res.data.alert);
          setTxnData(res.data.transaction);
        }
      } catch (err) {
        console.error("Failed to load investigation details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [alertId, phone]);

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      await API.patch(`/fraud/alerts/${alertId}`, {
        phone,
        action,
      });
      await refreshAll();
      onClose();
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!alertId) return null;

  const isCritical = alertData?.severity === "CRITICAL";
  const isHigh = alertData?.severity === "HIGH";
  const isMedium = alertData?.severity === "MEDIUM";
  const isBlocked = alertData?.status === "BLOCKED";
  const isResolved = alertData?.status === "RESOLVED";
  const isInvestigating = alertData?.status === "INVESTIGATING";

  const score = alertData?.riskScore || alertData?.score || 50;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 1100,
      }}
      onClick={onClose}
    >
      <div
        className="bg-card"
        style={{
          width: "100%",
          maxWidth: 580,
          height: "100%",
          overflowY: "auto",
          boxShadow: "var(--shadow-modal)",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isCritical || isBlocked
              ? "var(--semantic-danger-bg)"
              : isHigh || isMedium
              ? "var(--semantic-warning-bg)"
              : "var(--semantic-safe-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isCritical || isBlocked ? (
              <ShieldAlert size={22} style={{ color: "var(--semantic-danger)" }} />
            ) : isHigh || isMedium ? (
              <AlertTriangle size={22} style={{ color: "var(--semantic-warning)" }} />
            ) : (
              <ShieldCheck size={22} style={{ color: "var(--semantic-safe)" }} />
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                Security Investigation: {alertId}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                Status: <strong style={{ color: "var(--text-primary)" }}>{alertData?.status || "NEW"}</strong> · Detected: {alertData?.time || "Recently"}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="bg-card skeleton" style={{ height: 100 }} />
            <div className="bg-card skeleton" style={{ height: 160 }} />
            <div className="bg-card skeleton" style={{ height: 140 }} />
          </div>
        ) : alertData ? (
          <div style={{ padding: "22px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title & Description */}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                {alertData.title}
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
                {alertData.description || alertData.desc}
              </p>
            </div>

            {/* Risk Probability Meter */}
            <div className="bg-card" style={{ padding: "16px 18px", background: "#f8fafc", border: "1px solid var(--border-card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Random Forest Threat Assessment
                </span>
                <span className={`badge badge-${isCritical || isBlocked ? "danger" : isHigh || isMedium ? "warning" : "safe"}`}>
                  {alertData.severity || "MEDIUM"} · {score}%
                </span>
              </div>
              <div style={{ height: 7, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${score}%`,
                    background: isCritical || isBlocked
                      ? "var(--semantic-danger)"
                      : isHigh || isMedium
                      ? "var(--semantic-warning)"
                      : "var(--semantic-safe)",
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* EXPLAINABLE AI FACTOR BREAKDOWN */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
                Why This Was Flagged (Explainable Factor Breakdown)
              </div>

              {alertData.scoreBreakdown && alertData.scoreBreakdown.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {alertData.scoreBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        background: item.impact === "SAFE" ? "var(--semantic-safe-bg)" : "#ffffff",
                        border: item.impact === "SAFE" ? "1px solid var(--semantic-safe-border)" : "1px solid var(--border-card)",
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                          {item.factor}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.4 }}>
                          {item.reason}
                        </div>
                      </div>
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: item.impact === "SAFE" ? "var(--semantic-safe)" : "var(--semantic-danger)",
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: item.impact === "SAFE" ? "rgba(4, 120, 87, 0.1)" : "rgba(220, 38, 38, 0.1)",
                        }}
                      >
                        {item.points}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)" }}>
                  {alertData.indicators && alertData.indicators.length > 0 ? (
                    alertData.indicators.map((ind, i) => <div key={i}>• {ind}</div>)
                  ) : (
                    "Behavioral anomaly identified by model heuristics."
                  )}
                </div>
              )}
            </div>

            {/* Related Transaction Metadata */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
                Transaction & Environment Metadata
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  padding: "14px 16px",
                  background: "#f8fafc",
                  border: "1px solid var(--border-card)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>TRANSACTION ID</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1, fontFamily: "var(--font-mono)" }}>
                    {alertData.transactionId || "N/A"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>AMOUNT (INR)</div>
                  <div className="tabular-nums" style={{ fontWeight: 700, color: "var(--text-primary)", marginTop: 1 }}>
                    ₹{(alertData.amount || (txnData ? Math.abs(txnData.amount) : 0)).toLocaleString("en-IN")}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>ACCOUNT</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>
                    {alertData.account || (txnData ? txnData.bankName : "Linked Account")}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>PAYMENT CHANNEL</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>
                    {txnData ? txnData.type : "UPI"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>LOCATION ORIGIN</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>
                    {txnData ? txnData.location : "Detected from IP"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "var(--text-muted)", fontSize: 10.5, fontWeight: 600 }}>DEVICE HARDWARE</div>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginTop: 1 }}>
                    {txnData?.device || "Primary Mobile Fingerprint"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Action Footer */}
        <div
          style={{
            padding: "16px 24px",
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
            {!isResolved && !isBlocked && (
              <>
                <button
                  onClick={() => handleAction("safe")}
                  disabled={actionLoading}
                  className="btn btn-secondary"
                  style={{ fontSize: 12 }}
                >
                  <CheckCircle2 size={13} style={{ color: "var(--semantic-safe)" }} /> Mark as Legitimate
                </button>
                <button
                  onClick={() => handleAction("investigate")}
                  disabled={actionLoading}
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                >
                  <UserCheck size={13} /> Investigate
                </button>
              </>
            )}

            {!isBlocked && (
              <button
                onClick={() => handleAction("quarantine")}
                disabled={actionLoading}
                className="btn btn-danger"
                style={{ fontSize: 12 }}
              >
                <Ban size={13} /> Quarantine & Block
              </button>
            )}
          </div>

          <button
            onClick={() => handleAction("dismiss")}
            disabled={actionLoading}
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
