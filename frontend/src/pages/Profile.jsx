import { useState, useEffect } from "react";
import {
  UserCheck,
  ShieldCheck,
  Lock,
  Smartphone,
  LogOut,
  CheckCircle2,
  Key,
  Clock,
  Shield,
  Landmark,
  FileText,
  Filter,
  RefreshCw,
  Activity,
  AlertTriangle,
  ShieldAlert
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import API from "../services/api";

export default function Profile({ onLogout }) {
  const { phone, accounts, dashboard, sseConnected, refreshAll } = useFinancial();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  const loginTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const loginDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const maskedPhone = phone
    ? phone.length === 10
      ? `${phone.slice(0, 5)}•••••`
      : phone
    : "••••••••••";

  const fetchAuditLogs = async () => {
    if (!phone) return;
    setLoadingAudit(true);
    try {
      const res = await API.get(`/security-ops/feed?phone=${phone}&severity=${severityFilter}&limit=25`);
      if (res.data?.events) {
        setAuditLogs(res.data.events);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [phone, severityFilter]);

  const handleSignOut = () => {
    localStorage.removeItem("bankguard_token");
    localStorage.removeItem("bankguard_device_fingerprint");
    if (onLogout) onLogout();
  };

  const getSeverityBadge = (sev = "LOW") => {
    switch (sev.toUpperCase()) {
      case "CRITICAL": return "badge-danger";
      case "HIGH": return "badge-warning";
      case "MEDIUM": return "badge-neutral";
      default: return "badge-safe";
    }
  };

  return (
    <div style={{ maxWidth: 840 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
          Security Profile & Regulatory Audit Trail
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
          Identity verification details, active authentication credentials, and immutable security event ledger.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-card" style={{ padding: 24, marginBottom: 20 }}>
        {/* User Identity Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "var(--brand-primary-light)",
              border: "2px solid var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--brand-primary)",
              fontWeight: 800,
              fontSize: 18,
            }}
          >
            {phone ? phone.slice(0, 1) : "U"}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              +91 {maskedPhone}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className="badge badge-safe">
                <CheckCircle2 size={11} /> KYC & Telecom Verified
              </span>
              <span className="badge badge-neutral">
                {accounts.length} Banks Linked
              </span>
              {sseConnected && (
                <span className="badge badge-safe" style={{ fontSize: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--semantic-safe)" }} className="live-pulse" /> Live SSE Active
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Authentication Matrix */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
            Authentication & Verification Matrix
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: Smartphone, label: "2Factor Carrier SMS OTP", status: "Active & Enforced", type: "safe" },
              { icon: Lock, label: "JWT Session Signing (HMAC-SHA256)", status: "Active (7-Day Validity)", type: "safe" },
              { icon: Shield, label: "Random Forest ML Risk Engine", status: "Enabled (Live)", type: "safe" },
              { icon: Landmark, label: "Total Monitored Capital", status: `₹${(dashboard?.totalBalance || 0).toLocaleString("en-IN")}`, type: "neutral" },
              { icon: Clock, label: "Current Session Authenticated", status: `${loginDate} at ${loginTime}`, type: "neutral" },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    border: "1px solid var(--border-card)",
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "var(--brand-primary)" }}><Icon size={16} /></div>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span className={`badge badge-${item.type}`}>{item.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Immutable Security Audit Trail Section */}
      <div className="bg-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={17} style={{ color: "var(--brand-primary)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              Immutable Security Audit Trail
            </span>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            {["ALL", "CRITICAL", "HIGH", "LOW"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className="btn"
                style={{
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-pill)",
                  background: severityFilter === sev ? "var(--brand-primary)" : "#f1f5f9",
                  color: severityFilter === sev ? "#ffffff" : "var(--text-secondary)",
                  border: "none",
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {loadingAudit ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="bg-card skeleton" style={{ height: 48 }} />
            <div className="bg-card skeleton" style={{ height: 48 }} />
          </div>
        ) : auditLogs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {auditLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  border: "1px solid var(--border-card)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                      {log.title}
                    </span>
                    <span className={`badge ${getSeverityBadge(log.severity)}`} style={{ fontSize: 9.5 }}>
                      {log.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>
                    {log.description}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="tabular-nums" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)" }}>
                    {log.time}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                    {log.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            No audit records matching filter.
          </div>
        )}
      </div>

      {/* Logout Action */}
      <div className="bg-card" style={{ padding: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Active Authentication Session
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 1 }}>
            Invalidates current local session token and terminates active browser identity.
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="btn btn-danger"
          style={{ padding: "8px 16px", fontSize: 12 }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </div>
  );
}