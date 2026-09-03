import { useState, useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
  Info,
  Smartphone,
  CheckCheck,
  ArrowRight
} from "lucide-react";
import API from "../services/api";

export default function NotificationCenter({ phone, onNavigate, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const popoverRef = useRef(null);

  const fetchNotifications = async () => {
    if (!phone) return;
    try {
      const res = await API.get(`/notifications?phone=${phone}&filter=${filter}`);
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [phone, filter]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.patch(`/notifications/${id}/read`, { phone });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.post(`/notifications/read-all`, { phone });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n.id, { stopPropagation: () => {} });
    }
    if (onNavigate && n.link) {
      onNavigate(n.link);
      onClose();
    }
  };

  const getIcon = (type, severity) => {
    if (severity === "CRITICAL") return <ShieldAlert size={16} style={{ color: "var(--semantic-danger)" }} />;
    if (type === "DEVICE_DETECTED") return <Smartphone size={16} style={{ color: "var(--semantic-warning)" }} />;
    if (severity === "WARNING") return <AlertTriangle size={16} style={{ color: "var(--semantic-warning)" }} />;
    return <Info size={16} style={{ color: "var(--semantic-info)" }} />;
  };

  return (
    <div
      ref={popoverRef}
      className="bg-card"
      style={{
        position: "absolute",
        top: 44,
        right: 0,
        width: 360,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: "80vh",
        boxShadow: "var(--shadow-modal)",
        borderRadius: 12,
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid var(--border-card)",
      }}
    >
      {/* Popover Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>
            Security Notifications
          </div>
          {unreadCount > 0 && (
            <span className="badge badge-danger" style={{ fontSize: 10, padding: "1px 6px" }}>
              {unreadCount} New
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: "3px 6px", color: "var(--brand-primary)" }}
              title="Mark all as read"
            >
              <CheckCheck size={13} /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 26, height: 26, padding: 0 }}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          padding: "8px 12px",
          display: "flex",
          gap: 6,
          borderBottom: "1px solid var(--border-subtle)",
          background: "#f8fafc",
        }}
      >
        {[
          { key: "ALL", label: "All" },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "CRITICAL", label: "Critical" },
          { key: "SECURITY", label: "Security" },
        ].map((t) => {
          const isActive = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="btn"
              style={{
                padding: "3px 8px",
                fontSize: 11,
                borderRadius: "var(--radius-pill)",
                background: isActive ? "var(--brand-primary)" : "transparent",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                border: "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div style={{ overflowY: "auto", flex: 1, maxHeight: 380 }}>
        {loading ? (
          <div style={{ padding: 16 }}>
            <div className="bg-card skeleton" style={{ height: 60, marginBottom: 8 }} />
            <div className="bg-card skeleton" style={{ height: 60 }} />
          </div>
        ) : notifications.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: n.isRead ? "#ffffff" : "var(--brand-primary-light)",
                  cursor: "pointer",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (n.isRead) e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  if (n.isRead) e.currentTarget.style.background = "#ffffff";
                }}
              >
                <div style={{ marginTop: 2 }}>{getIcon(n.type, n.severity)}</div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontSize: 12.5, fontWeight: n.isRead ? 600 : 700, color: "var(--text-primary)" }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{n.time || n.date}</span>
                  </div>

                  <p style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.4, margin: 0 }}>
                    {n.message}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 10.5, color: "var(--brand-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                      Inspect Details <ArrowRight size={10} />
                    </span>

                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        className="btn btn-ghost"
                        style={{ fontSize: 10, padding: "2px 4px", color: "var(--text-muted)" }}
                        title="Mark read"
                      >
                        <CheckCircle2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
            No notifications in this filter view.
          </div>
        )}
      </div>
    </div>
  );
}
