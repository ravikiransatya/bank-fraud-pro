import { useState } from "react";

const alertsData = [
  { level:"critical", title:"High-risk ATM withdrawal blocked", desc:"₹10,000 ATM at 3:15 AM from Mumbai — your usual location is Vadodara.", score:87 },
  { level:"critical", title:"Suspicious UPI payment blocked", desc:"₹1,50,000 to unknown QR at 2:00 AM. Auto-blocked by ML model.", score:96 },
  { level:"warning", title:"Multiple login attempts", desc:"3 failed attempts on HDFC account from different IPs in 10 minutes.", score:65 },
  { level:"warning", title:"New location login", desc:"SBI account accessed from Delhi for the first time.", score:55 },
  { level:"info", title:"Large transaction completed", desc:"₹25,000 IMPS processed. Contact bank if this was not you.", score:22 },
];

const colors = { critical:"#ef4444", warning:"#f59e0b", info:"#3b82f6" };

export default function FraudAlerts() {
  const [dismissed, setDismissed] = useState([]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Fraud Alerts</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, fontSize: 12, color: "#ef4444" }}>
          <div style={{ width: 6, height: 6, background: "#ef4444", borderRadius: "50%", animation: "pulse 1s infinite" }}></div>
          Live Monitoring
        </div>
      </div>

      {alertsData.map((a, i) => !dismissed.includes(i) && (
        <div key={i} style={{ background: `rgba(${a.level==="critical"?"239,68,68":a.level==="warning"?"245,158,11":"59,130,246"},0.06)`, border: `1px solid rgba(${a.level==="critical"?"239,68,68":a.level==="warning"?"245,158,11":"59,130,246"},0.2)`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", padding: "3px 10px", borderRadius: 10, background: `rgba(${a.level==="critical"?"239,68,68":a.level==="warning"?"245,158,11":"59,130,246"},0.15)`, color: colors[a.level] }}>
              {a.level === "critical" ? "🚨" : a.level === "warning" ? "⚠️" : "ℹ️"} {a.level}
            </span>
            <span style={{ fontSize: 11, color: "#64748b" }}>Just now</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0", marginBottom: 6 }}>{a.title}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>{a.desc}</div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${a.score}%`, background: `linear-gradient(90deg,${colors[a.level]},${colors[a.level]}99)`, borderRadius: 3 }}></div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setDismissed([...dismissed, i])} style={{ padding: "8px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 12, cursor: "pointer" }}>🚫 Block & Report</button>
            <button onClick={() => setDismissed([...dismissed, i])} style={{ padding: "8px 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#10b981", fontSize: 12, cursor: "pointer" }}>✅ Mark Safe</button>
          </div>
        </div>
      ))}
    </div>
  );
}