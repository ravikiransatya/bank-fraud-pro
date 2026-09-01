import { useState } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Receipt,
  Landmark,
  ShieldAlert,
  BarChart3,
  UserCheck,
  LogOut,
  Bell,
  Menu,
  X,
  Lock,
  ChevronRight,
  RefreshCw,
  Activity,
  Smartphone,
  Shield
} from "lucide-react";
import { FinancialProvider, useFinancial } from "./context/FinancialContext";
import OTPLogin from "./pages/OTPLogin";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import FraudAlerts from "./pages/FraudAlerts";
import Analytics from "./pages/Analytics";
import LinkedBanks from "./pages/LinkedBanks";
import Profile from "./pages/Profile";
import SecurityOperations from "./pages/SecurityOperations";
import DeviceManagement from "./pages/DeviceManagement";
import AccountSecurityCenter from "./pages/AccountSecurityCenter";
import NotificationCenter from "./components/NotificationCenter";
import ChatBot from "./components/ChatBot";

function AppShell({ user, setUser }) {
  const [page, setPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { dashboard, alerts, refreshing, lastUpdated, formatRelativeTime, refreshAll } = useFinancial();

  const navigationSections = [
    {
      heading: "Overview",
      items: [
        { key: "dashboard", label: "Security Dashboard", icon: LayoutDashboard },
        { key: "operations", label: "Security Operations", icon: Activity },
      ],
    },
    {
      heading: "Financial Ledger",
      items: [
        { key: "transactions", label: "Transactions", icon: Receipt },
        { key: "banks", label: "Linked Accounts", icon: Landmark },
      ],
    },
    {
      heading: "Threat Intelligence",
      items: [
        {
          key: "alerts",
          label: "Fraud Alerts",
          icon: ShieldAlert,
          badge: alerts.filter((a) => a.status !== "RESOLVED" && a.status !== "DISMISSED").length || null,
        },
        { key: "analytics", label: "Security Analytics", icon: BarChart3 },
      ],
    },
    {
      heading: "Account Protection",
      items: [
        { key: "devices", label: "Device Trust", icon: Smartphone },
        { key: "security-center", label: "Account Security Center", icon: Shield },
      ],
    },
    {
      heading: "Identity",
      items: [
        { key: "profile", label: "Security Profile", icon: UserCheck },
      ],
    },
  ];

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={setPage} />;
      case "operations": return <SecurityOperations />;
      case "transactions": return <Transactions />;
      case "banks": return <LinkedBanks />;
      case "alerts": return <FraudAlerts />;
      case "analytics": return <Analytics />;
      case "devices": return <DeviceManagement />;
      case "security-center": return <AccountSecurityCenter />;
      case "profile": return <Profile onLogout={() => setUser(null)} />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  const getPageTitle = () => {
    switch (page) {
      case "dashboard": return "Financial Security Overview";
      case "operations": return "Live Security Operations (SOC)";
      case "transactions": return "Transactions & Audit Ledger";
      case "banks": return "Connected Banking Institutions";
      case "alerts": return "Threat Detection & Fraud Alerts";
      case "analytics": return "Machine Learning Risk Analytics";
      case "devices": return "Device Trust & Hardware Management";
      case "security-center": return "Account Security Center & Compliance";
      case "profile": return "Account Security & Credentials";
      default: return "Financial Security Platform";
    }
  };

  const activeAlertCount = alerts.filter(
    (a) => a.status !== "RESOLVED" && a.status !== "DISMISSED"
  ).length;

  const systemStatus = dashboard?.systemStatus || "PROTECTED";

  const getStatusBadge = () => {
    if (systemStatus === "CRITICAL") {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: "var(--semantic-danger-bg)",
            border: "1px solid var(--semantic-danger-border)",
            borderRadius: "var(--radius-pill)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--semantic-danger)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--semantic-danger)" }} className="live-pulse" />
          CRITICAL THREATS
        </div>
      );
    }
    if (systemStatus === "ATTENTION REQUIRED") {
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: "var(--semantic-warning-bg)",
            border: "1px solid var(--semantic-warning-border)",
            borderRadius: "var(--radius-pill)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--semantic-warning)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--semantic-warning)" }} className="live-pulse" />
          ATTENTION REQUIRED
        </div>
      );
    }
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "3px 10px",
          background: "var(--semantic-safe-bg)",
          border: "1px solid var(--semantic-safe-border)",
          borderRadius: "var(--radius-pill)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--semantic-safe)",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--semantic-safe)" }} />
        SYSTEM PROTECTED
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-app)" }}>
      {/* 1. INSTITUTIONAL SIDEBAR */}
      <aside
        style={{
          width: 260,
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-sidebar)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 100,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid var(--border-sidebar)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "var(--radius-md)",
              background: "var(--brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <ShieldCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: -0.3,
                color: "var(--text-primary)",
                lineHeight: 1.1,
              }}
            >
              BankGuard <span style={{ color: "var(--brand-primary)" }}>AI</span>
            </div>
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              Financial Security
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.9,
                  color: "var(--text-muted)",
                  padding: "0 10px",
                  marginBottom: 6,
                }}
              >
                {section.heading}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = page === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setPage(item.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-md)",
                        border: isActive ? "1px solid var(--brand-primary)" : "1px solid transparent",
                        background: isActive ? "var(--brand-primary-light)" : "transparent",
                        color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                        fontWeight: isActive ? 600 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "#f1f5f9";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span
                          className="badge badge-danger"
                          style={{
                            fontSize: 10,
                            padding: "1px 6px",
                            borderRadius: "var(--radius-pill)",
                          }}
                        >
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <ChevronRight size={13} style={{ opacity: 0.7 }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Institutional Profile Card Footer */}
        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--border-sidebar)",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--brand-primary-light)",
                border: "1px solid var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 12,
                color: "var(--brand-primary)",
              }}
            >
              +91
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                +91 {user?.slice(0, 5)}•••••
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                <Lock size={10} style={{ color: "var(--semantic-safe)" }} /> 2FA Verified
              </div>
            </div>
          </div>

          <button
            onClick={() => setUser(null)}
            className="btn btn-ghost"
            style={{ width: 28, height: 28, padding: 0 }}
            title="Secure Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOP INSTITUTIONAL HEADER BAR */}
        <header
          style={{
            height: 60,
            background: "var(--bg-card)",
            borderBottom: "1px solid var(--border-card)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            position: "sticky",
            top: 0,
            zIndex: 90,
          }}
        >
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              {getPageTitle()}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              Last synced: {formatRelativeTime(lastUpdated)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            {/* Real-time System Security Status Badge */}
            {getStatusBadge()}

            {/* Manual Sync / Refresh */}
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="btn btn-ghost"
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: "var(--radius-md)",
              }}
              title="Synchronize real-time state"
            >
              <RefreshCw size={15} className={refreshing ? "live-pulse" : ""} />
            </button>

            {/* Notification Center Popover Trigger */}
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="btn btn-ghost"
              style={{
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: "var(--radius-md)",
                position: "relative",
              }}
              title="Security notifications"
            >
              <Bell size={16} />
              {activeAlertCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--semantic-danger)",
                  }}
                />
              )}
            </button>

            {/* In-App Notification Center Popover */}
            {notificationsOpen && (
              <NotificationCenter
                phone={user}
                onNavigate={setPage}
                onClose={() => setNotificationsOpen(false)}
              />
            )}
          </div>
        </header>

        {/* CONTENT VIEWPORT */}
        <main style={{ flex: 1, padding: "24px 28px", maxWidth: 1240, width: "100%", margin: "0 auto" }}>
          {renderPage()}
        </main>
      </div>

      {/* AI Financial Security Analyst Widget */}
      <ChatBot phone={user} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <OTPLogin onLogin={setUser} />;

  return (
    <FinancialProvider phone={user}>
      <AppShell user={user} setUser={setUser} />
    </FinancialProvider>
  );
}