import { useState, useEffect, useCallback } from "react";
import {
  Smartphone,
  Laptop,
  Tablet,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Clock,
  Trash2,
  CheckCircle2,
  Ban,
  Radio,
  Globe,
  Monitor,
  AlertCircle
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import { getClientDeviceMetadata } from "../utils/deviceFingerprint";
import API from "../services/api";

export default function DeviceManagement() {
  const { phone } = useFinancial();
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({ total: 0, trusted: 0, suspicious: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Obtain client fingerprint
  const clientMeta = getClientDeviceMetadata();

  const fetchDevices = useCallback(async (silent = false) => {
    if (!phone) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await API.get(`/devices?phone=${phone}&currentFingerprint=${clientMeta.deviceFingerprint}`);
      if (res.data && res.data.success) {
        setDevices(res.data.devices || []);
        setStats({
          total: res.data.totalCount || 0,
          trusted: res.data.trustedCount || 0,
          suspicious: res.data.suspiciousCount || 0,
          revoked: res.data.revokedCount || 0,
        });
      }
    } catch (err) {
      console.error("Failed to load devices:", err);
      if (!silent) setError("Unable to load device information. Please check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phone, clientMeta.deviceFingerprint]);

  // Periodic heartbeat & initial load
  useEffect(() => {
    // 1. Initial fetch & register current device
    const registerAndFetch = async () => {
      if (phone) {
        try {
          await API.post("/devices/register", {
            phone,
            clientMetadata: clientMeta,
          });
        } catch (regErr) {
          console.warn("Device registration heartbeat notice:", regErr);
        }
      }
      fetchDevices();
    };

    registerAndFetch();

    // 2. Periodic polling interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchDevices(true);
    }, 30000);

    // 3. Tab visibility auto-refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchDevices(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [phone, fetchDevices]);

  // Action Handlers
  const handleTrustChange = async (deviceId, newTrust) => {
    setActionLoadingId(deviceId);
    try {
      await API.patch(`/devices/${deviceId}/trust`, {
        phone,
        trustStatus: newTrust,
      });
      await fetchDevices(true);
    } catch (err) {
      alert("Failed to update trust status: " + (err.message || err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFlagDevice = async (deviceId) => {
    setActionLoadingId(deviceId);
    try {
      await API.patch(`/devices/${deviceId}/flag`, { phone });
      await fetchDevices(true);
    } catch (err) {
      alert("Failed to flag device: " + (err.message || err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to revoke authorization for this device? Sessions from this device will be blocked.")) return;
    setActionLoadingId(deviceId);
    try {
      await API.post(`/devices/${deviceId}/revoke`, { phone });
      await fetchDevices(true);
    } catch (err) {
      alert("Failed to revoke device: " + (err.message || err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm("Permanently delete this device record from your account history?")) return;
    setActionLoadingId(deviceId);
    try {
      await API.delete(`/devices/${deviceId}?phone=${phone}`);
      await fetchDevices(true);
    } catch (err) {
      alert("Failed to remove device: " + (err.message || err));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getDeviceIcon = (deviceType = "", platform = "") => {
    const p = platform.toLowerCase();
    const t = deviceType.toLowerCase();
    if (t === "mobile" || p.includes("android") || p.includes("ios") || p.includes("phone")) {
      return Smartphone;
    }
    if (t === "tablet" || p.includes("ipad")) {
      return Tablet;
    }
    return Laptop;
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Recently";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "Active Now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min(s) ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr(s) ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Device Trust & Hardware Management
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Manage authorized login sessions, hardware fingerprints, and dynamic device risk assessments.
          </p>
        </div>

        <button
          onClick={() => fetchDevices(false)}
          disabled={loading || refreshing}
          className="btn btn-ghost"
          style={{ padding: "6px 10px", fontSize: 12 }}
        >
          <RefreshCw size={14} className={refreshing ? "live-pulse" : ""} /> Refresh Devices
        </button>
      </div>

      {/* Summary KPI Cards Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Recognized", value: stats.total, color: "var(--text-primary)", badge: "Registered" },
          { label: "Trusted Devices", value: stats.trusted, color: "var(--semantic-safe)", badge: "Authorized" },
          { label: "Suspicious / Review", value: stats.suspicious, color: "var(--semantic-warning)", badge: "Flagged" },
          { label: "Revoked Sessions", value: stats.revoked, color: "var(--semantic-danger)", badge: "Blocked" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {kpi.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
              <span className="tabular-nums" style={{ fontSize: 22, fontWeight: 800, color: kpi.color, fontFamily: "var(--font-heading)" }}>
                {kpi.value}
              </span>
              <span className="badge badge-neutral" style={{ fontSize: 9.5 }}>{kpi.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--semantic-danger-bg)",
            border: "1px solid var(--semantic-danger-border)",
            borderRadius: 8,
            color: "var(--semantic-danger)",
            fontSize: 12.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchDevices(false)} className="btn btn-ghost" style={{ padding: "2px 8px", fontSize: 11 }}>
            Retry
          </button>
        </div>
      )}

      {/* Dynamic Grid of Devices */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14, marginBottom: 20 }}>
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-card skeleton" style={{ height: 210, borderRadius: 12 }} />
          ))
        ) : devices.length > 0 ? (
          devices.map((dev) => {
            const Icon = getDeviceIcon(dev.deviceType, dev.operatingSystem);
            const isTrusted = dev.trustStatus === "TRUSTED" && !dev.isRevoked;
            const isSuspicious = dev.trustStatus === "SUSPICIOUS" && !dev.isRevoked;
            const isRevoked = dev.trustStatus === "REVOKED" || dev.isRevoked;
            const isCurrent = Boolean(dev.isCurrentDevice);
            const risk = dev.riskScore || 5;

            return (
              <div
                key={dev.id || dev._id}
                className="bg-card"
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 220,
                  borderRadius: 12,
                  borderTop: `4px solid ${
                    isRevoked
                      ? "var(--semantic-danger)"
                      : isSuspicious
                      ? "var(--semantic-warning)"
                      : "var(--semantic-safe)"
                  }`,
                  boxShadow: isCurrent ? "var(--shadow-card)" : "var(--shadow-sm)",
                  background: isCurrent ? "#ffffff" : "#ffffff",
                }}
              >
                <div>
                  {/* Top Bar: Icon, Device Name, and Badges */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 8,
                          background: isRevoked
                            ? "var(--semantic-danger-bg)"
                            : isSuspicious
                            ? "var(--semantic-warning-bg)"
                            : "var(--semantic-safe-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isRevoked
                            ? "var(--semantic-danger)"
                            : isSuspicious
                            ? "var(--semantic-warning)"
                            : "var(--semantic-safe)",
                        }}
                      >
                        <Icon size={19} />
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                            {dev.deviceName || `${dev.operatingSystem} (${dev.browser})`}
                          </span>
                        </div>

                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                          {dev.browser} {dev.browserVersion !== "Latest" ? `v${dev.browserVersion}` : ""} · {dev.operatingSystem} {dev.osVersion || ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span
                        className={`badge badge-${isRevoked ? "danger" : isSuspicious ? "warning" : "safe"}`}
                        style={{ fontSize: 10 }}
                      >
                        {isRevoked ? "REVOKED" : isSuspicious ? "SUSPICIOUS" : "TRUSTED"}
                      </span>

                      {isCurrent && (
                        <span
                          className="badge"
                          style={{
                            background: "var(--brand-primary-light)",
                            color: "var(--brand-primary)",
                            border: "1px solid var(--brand-primary)",
                            fontSize: 9.5,
                            fontWeight: 700,
                          }}
                        >
                          CURRENT DEVICE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "12px 0 14px", fontSize: 12, color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span>
                        {dev.location || "Vadodara, Gujarat"} · <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{dev.ipAddress || "127.0.0.1"}</span>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Monitor size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span>
                        {dev.screenResolution || "1920x1080"} · {dev.timezone || "Asia/Kolkata"} · {dev.language || "en-US"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      <span>
                        Last Active: <strong>{isCurrent ? "Active Now" : formatRelativeTime(dev.lastSeenAt)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Risk Assessment:{" "}
                    <strong
                      className="tabular-nums"
                      style={{
                        color: risk > 50 ? "var(--semantic-danger)" : risk > 25 ? "var(--semantic-warning)" : "var(--semantic-safe)",
                      }}
                    >
                      {risk}%
                    </strong>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    {/* Trust Action */}
                    {!isTrusted && (
                      <button
                        onClick={() => handleTrustChange(dev.id || dev._id, "TRUSTED")}
                        disabled={actionLoadingId === (dev.id || dev._id)}
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: "4px 8px" }}
                        title="Authorize device as trusted"
                      >
                        <CheckCircle2 size={12} style={{ color: "var(--semantic-safe)" }} /> Trust
                      </button>
                    )}

                    {/* Flag Action */}
                    {isTrusted && (
                      <button
                        onClick={() => handleFlagDevice(dev.id || dev._id)}
                        disabled={actionLoadingId === (dev.id || dev._id)}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "4px 8px", color: "var(--semantic-warning)" }}
                        title="Flag device as suspicious"
                      >
                        <AlertTriangle size={12} /> Flag
                      </button>
                    )}

                    {/* Revoke Action */}
                    {!isRevoked && (
                      <button
                        onClick={() => handleRevokeDevice(dev.id || dev._id)}
                        disabled={actionLoadingId === (dev.id || dev._id)}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "4px 8px", color: "var(--semantic-danger)" }}
                        title="Revoke device access immediately"
                      >
                        <Ban size={12} /> Revoke
                      </button>
                    )}

                    {/* Delete Action (allowed if not the current session) */}
                    {!isCurrent && (
                      <button
                        onClick={() => handleRemoveDevice(dev.id || dev._id)}
                        disabled={actionLoadingId === (dev.id || dev._id)}
                        className="btn btn-ghost"
                        style={{ fontSize: 11, padding: "4px 8px", color: "var(--text-muted)" }}
                        title="Permanently remove device record"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ gridColumn: "1 / -1", padding: 36, textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ fontSize: 13, marginBottom: 8 }}>No recognized devices yet.</p>
            <button onClick={() => fetchDevices(false)} className="btn btn-secondary" style={{ fontSize: 12 }}>
              Register Current Browser Session
            </button>
          </div>
        )}
      </div>

      {/* Security Operations Policy Note */}
      <div className="bg-card" style={{ padding: "14px 18px", borderLeft: "3px solid var(--brand-primary)", display: "flex", alignItems: "center", gap: 12 }}>
        <ShieldCheck size={20} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Device trust is continuously monitored in real-time. Unrecognized, suspicious, or revoked devices attempting transactions are automatically intercepted and quarantined by the BankGuard AI circuit breaker.
        </div>
      </div>
    </div>
  );
}
