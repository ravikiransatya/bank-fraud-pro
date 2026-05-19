import { useState } from "react";
import OTPLogin from "./pages/OTPLogin";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import FraudAlerts from "./pages/FraudAlerts";
import Analytics from "./pages/Analytics";
import LinkedBanks from "./pages/LinkedBanks";
import Profile from "./pages/Profile";
import ChatBot from "./components/ChatBot";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  if (!user) return <OTPLogin onLogin={setUser} />;

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard phone={user} />;
      case "transactions": return <Transactions phone={user} />;
      case "alerts": return <FraudAlerts phone={user} />;
      case "analytics": return <Analytics />;
      case "banks": return <LinkedBanks phone={user} />;
      case "profile": return <Profile phone={user} onLogout={() => setUser(null)} />;
      default: return <Dashboard phone={user} />;
    }
  };

  return (
    <div style={{ background: "#0a0e1a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "Segoe UI, sans-serif" }}>
      {/* TOP NAV */}
      <nav style={{ background: "rgba(10,14,26,0.95)", borderBottom: "1px solid rgba(59,130,246,0.15)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}>
          <span style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</span>
          BankGuard AI
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["dashboard","Dashboard"],["transactions","Transactions"],["banks","My Banks"],["alerts","Alerts"],["analytics","Analytics"],["profile","Profile"]].map(([key, label]) => (
            <button key={key} onClick={() => setPage(key)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: page === key ? "rgba(59,130,246,0.15)" : "transparent", color: page === key ? "#3b82f6" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: page === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          {user[0]}
        </div>
      </nav>
      <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        {renderPage()}
      </div>
      <ChatBot phone={user} />
    </div>
  );
}

export default App;