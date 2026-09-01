import { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, RefreshCw, Smartphone, Globe, Lock, Activity } from "lucide-react";
import API from "../services/api";

export default function LiveSecurityFeed({ phone }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async (silent = false) => {
    if (!phone) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await API.get(`/security-ops/feed?phone=${phone}&limit=30`);
      if (res.data?.events) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error("Failed to load security feed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // 15s live polling interval for real-time operations
    const interval = setInterval(() => fetchEvents(true), 15000);
    return () => clearInterval(interval);
  }, [phone]);

  const getSeverityBadge = (sev) => {
    switch (sev?.toUpperCase()) {
      case "CRITICAL": return "badge-danger";
      case "HIGH": return "badge-warning";
      case "MEDIUM": return "badge-neutral";
      default: return "badge-safe";
    }
  };

  return (
    <div className="bg-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={16} style={{ color: "var(--brand-primary)" }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
            Live Security Monitor Stream
          </span>
          <span className="badge badge-safe" style={{ fontSize: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--semantic-safe)" }} className="live-pulse" />
            Live
          </span>
        </div>

        <button
          onClick={() => fetchEvents(false)}
          disabled={refreshing}
          className="btn btn-ghost"
          style={{ padding: "4px 8px", fontSize: 11 }}
        >
          <RefreshCw size={12} className={refreshing ? "live-pulse" : ""} /> Sync
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="bg-card skeleton" style={{ height: 45 }} />
          <div className="bg-card skeleton" style={{ height: 45 }} />
          <div className="bg-card skeleton" style={{ height: 45 }} />
        </div>
      ) : events.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
          {events.map((evt) => (
            <div
              key={evt.id}
              style={{
                padding: "9px 12px",
                background: "#f8fafc",
                border: "1px solid var(--border-card)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="tabular-nums" style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, minWidth: 60 }}>
                  {evt.time}
                </span>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 1 }}>
                    {evt.description}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`badge ${getSeverityBadge(evt.severity)}`} style={{ fontSize: 10 }}>
                  {evt.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          No security events recorded in current window.
        </div>
      )}
    </div>
  );
}
