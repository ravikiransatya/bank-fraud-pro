import { X, ShieldAlert, ShieldCheck, AlertTriangle, Building2, MapPin, Clock, Smartphone, Hash, ArrowUpRight, Ban, CheckCircle2 } from "lucide-react";
import { useFinancial } from "../context/FinancialContext";

export default function TransactionModal({ transaction, onClose }) {
  const { resolveAlert } = useFinancial();
  if (!transaction) return null;

  const score = transaction.score !== undefined ? transaction.score : transaction.fraud_score || 0;
  const isHighRisk = score >= 70 || transaction.status === "blocked" || transaction.riskLevel === "HIGH" || transaction.riskLevel === "CRITICAL";
  const isMediumRisk = (score >= 40 || transaction.riskLevel === "MEDIUM" || transaction.status === "flagged") && !isHighRisk;
  const isCredit = transaction.amount > 0 || transaction.transactionType === "CREDIT";

  const handleQuarantine = async () => {
    if (transaction.referenceId || transaction.id) {
      await resolveAlert(transaction.referenceId || transaction.id, "quarantine");
    }
    onClose();
  };

  const handleVerify = async () => {
    if (transaction.referenceId || transaction.id) {
      await resolveAlert(transaction.referenceId || transaction.id, "safe");
    }
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="bg-card"
        style={{
          width: "100%",
          maxWidth: 520,
          borderRadius: 14,
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Banner */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-card)",
            background: isHighRisk
              ? "var(--semantic-danger-bg)"
              : isMediumRisk
              ? "var(--semantic-warning-bg)"
              : "var(--semantic-safe-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isHighRisk ? (
              <ShieldAlert size={18} style={{ color: "var(--semantic-danger)" }} />
            ) : isMediumRisk ? (
              <AlertTriangle size={18} style={{ color: "var(--semantic-warning)" }} />
            ) : (
              <ShieldCheck size={18} style={{ color: "var(--semantic-safe)" }} />
            )}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isHighRisk
                    ? "var(--semantic-danger)"
                    : isMediumRisk
                    ? "var(--semantic-warning)"
                    : "var(--semantic-safe)",
                }}
              >
                {isHighRisk ? "High Risk Threat Detected" : isMediumRisk ? "Suspicious Activity Flagged" : "Normal Verified Transaction"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Random Forest Risk Assessment: {score}%
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 22px" }}>
          {/* Main Transaction Highlight */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                {transaction.merchant}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Reference: <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{transaction.referenceId || transaction.id}</span>
              </div>
            </div>

            <div
              className="tabular-nums"
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: isCredit ? "var(--semantic-safe)" : "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {isCredit ? "+" : "-"}₹{Math.abs(transaction.amount).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              padding: "14px 16px",
              background: "#f8fafc",
              border: "1px solid var(--border-card)",
              borderRadius: "var(--radius-md)",
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Payment Channel</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.type}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Bank Account</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.bank || transaction.bankName}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Location / Routing</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.location || "Online"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Timestamp</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.time}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Category</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.merchantCategory || "General"}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Status</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>{transaction.status?.toUpperCase()}</div>
            </div>
          </div>

          {/* AI Risk Rationale */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
              ML Anomaly Rationale
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "#ffffff",
                border: "1px solid var(--border-card)",
                borderRadius: "var(--radius-md)",
                fontSize: 12.5,
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {transaction.risk_reason || "Transaction matches historical user baseline. No velocity or geographic anomalies detected."}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--border-subtle)", paddingTop: 14 }}>
            {isHighRisk ? (
              <button onClick={handleQuarantine} className="btn btn-danger" style={{ fontSize: 12 }}>
                <Ban size={13} /> Quarantine & Freeze Merchant
              </button>
            ) : (
              <button onClick={handleVerify} className="btn btn-secondary" style={{ fontSize: 12 }}>
                <CheckCircle2 size={13} style={{ color: "var(--semantic-safe)" }} /> Mark as Verified
              </button>
            )}
            <button onClick={onClose} className="btn btn-primary" style={{ fontSize: 12 }}>
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
