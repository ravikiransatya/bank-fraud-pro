import { useState } from "react";

const allTxns = [
  { id:1, type:"UPI", icon:"📱", amount:-500, merchant:"Swiggy Food Order", time:"Today 2:30 PM", bank:"SBI", score:5, status:"success" },
  { id:2, type:"ATM", icon:"🏧", amount:-10000, merchant:"SBI ATM Alkapuri", time:"Today 3:15 AM", bank:"HDFC", score:87, status:"flagged" },
  { id:3, type:"NEFT", icon:"🏦", amount:50000, merchant:"Salary · TCS Ltd", time:"Yesterday 11:00 AM", bank:"ICICI", score:4, status:"success" },
  { id:4, type:"Card", icon:"💳", amount:-2500, merchant:"Amazon India", time:"Yesterday 7:45 PM", bank:"SBI", score:8, status:"success" },
  { id:5, type:"UPI", icon:"📱", amount:-150000, merchant:"Unknown QR Code", time:"Jan 13 2:00 AM", bank:"HDFC", score:96, status:"blocked" },
  { id:6, type:"IMPS", icon:"⚡", amount:-25000, merchant:"IMPS Transfer", time:"Jan 12 5:30 PM", bank:"ICICI", score:22, status:"success" },
  { id:7, type:"Card", icon:"💳", amount:-3200, merchant:"Flipkart Electronics", time:"Jan 12 3:10 PM", bank:"SBI", score:11, status:"success" },
  { id:8, type:"UPI", icon:"📱", amount:-200, merchant:"Ola Auto Vadodara", time:"Jan 11 9:20 AM", bank:"SBI", score:2, status:"success" },
  { id:9, type:"ATM", icon:"🏧", amount:-20000, merchant:"HDFC ATM Mumbai", time:"Jan 10 11:55 PM", bank:"HDFC", score:72, status:"flagged" },
  { id:10, type:"NEFT", icon:"🏦", amount:-75000, merchant:"Home Loan EMI SBI", time:"Jan 1 9:00 AM", bank:"SBI", score:6, status:"success" },
];

export default function Transactions() {
  const [filter, setFilter] = useState("All");
  const types = ["All", "UPI", "ATM", "Card", "NEFT", "IMPS"];
  const filtered = filter === "All" ? allTxns : allTxns.filter(t => t.type === filter);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>All Transactions</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Digital · Physical · UPI · ATM · NEFT · IMPS · Card</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "7px 16px", borderRadius: 20, border: "none", background: filter === t ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)", color: filter === t ? "#3b82f6" : "#64748b", cursor: "pointer", fontSize: 13 }}>{t}</button>
        ))}
      </div>
      {filtered.map(t => {
        const scoreColor = t.score >= 70 ? "#ef4444" : t.score >= 40 ? "#f59e0b" : "#10b981";
        const badgeText = t.status === "blocked" ? "⛔ Blocked" : t.score >= 70 ? `🔴 ${t.score}%` : t.score >= 40 ? `🟡 ${t.score}%` : "🟢 Safe";
        return (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{t.merchant}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{t.type} · {t.bank}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.amount < 0 ? "#ef4444" : "#10b981" }}>{t.amount < 0 ? "-" : "+"}₹{Math.abs(t.amount).toLocaleString("en-IN")}</div>
              <div style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, marginTop: 4, background: `${scoreColor}22`, color: scoreColor, display: "inline-block" }}>{badgeText}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}