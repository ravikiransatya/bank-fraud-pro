const transactions = [
  { id:1, type:"UPI", icon:"📱", iconClass:"upi", amount:-500, merchant:"Swiggy Food Order", time:"Today 2:30 PM", bank:"SBI", fraud_score:5, status:"success" },
  { id:2, type:"ATM", icon:"🏧", iconClass:"atm", amount:-10000, merchant:"SBI ATM · Alkapuri", time:"Today 3:15 AM", bank:"HDFC", fraud_score:87, status:"flagged" },
  { id:3, type:"NEFT", icon:"🏦", iconClass:"neft", amount:50000, merchant:"Salary Credit · TCS Ltd", time:"Yesterday 11:00 AM", bank:"ICICI", fraud_score:4, status:"success" },
  { id:4, type:"Card", icon:"💳", iconClass:"card", amount:-2500, merchant:"Amazon India", time:"Yesterday 7:45 PM", bank:"SBI", fraud_score:8, status:"success" },
  { id:5, type:"UPI", icon:"📱", iconClass:"upi", amount:-150000, merchant:"Unknown · QR Code Pay", time:"Jan 13 2:00 AM", bank:"HDFC", fraud_score:96, status:"blocked" },
];

const getBadge = (score, status) => {
  if (status === "blocked") return { text: "⛔ Blocked", bg: "rgba(239,68,68,0.2)", color: "#ef4444" };
  if (score >= 70) return { text: `🔴 High Risk ${score}%`, bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
  if (score >= 40) return { text: `🟡 Medium ${score}%`, bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  return { text: "🟢 Safe", bg: "rgba(16,185,129,0.12)", color: "#10b981" };
};

export default function Dashboard({ phone }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{greeting}, +91 {phone.slice(0,5)}XXXXX</div>
      <div style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Monitoring all linked accounts · Real-time fraud detection active</div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { icon:"💳", value:"₹2,41,230", label:"Total Balance", change:"↑ Across 3 banks", color:"#3b82f6" },
          { icon:"✅", value:"1,847", label:"Safe Transactions", change:"↑ This month", color:"#10b981" },
          { icon:"🚨", value:"12", label:"Fraud Detected", change:"↑ 3 this week", color:"#ef4444" },
          { icon:"🛡️", value:"₹87,450", label:"Fraud Blocked", change:"↑ Saved this month", color:"#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20, borderTop: `2px solid ${s.color}` }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.color, marginTop: 8 }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 16 }}>Recent Transactions</div>
        {transactions.map(t => {
          const badge = getBadge(t.fraud_score, t.status);
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{t.merchant}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{t.type} · {t.bank} · {t.time}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.amount < 0 ? "#ef4444" : "#10b981" }}>
                  {t.amount < 0 ? "-" : "+"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, marginTop: 4, background: badge.bg, color: badge.color, display: "inline-block" }}>{badge.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}