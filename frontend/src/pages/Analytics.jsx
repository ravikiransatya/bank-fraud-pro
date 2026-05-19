export default function Analytics() {
  const fraudTypes = [
    { name:"Phishing Attack", count:"4 incidents", pct:33, color:"#f59e0b" },
    { name:"Card Skimming", count:"3 incidents", pct:25, color:"#ef4444" },
    { name:"Duplicate Transaction", count:"2 incidents", pct:17, color:"#3b82f6" },
    { name:"Unusual Location", count:"2 incidents", pct:17, color:"#ec4899" },
    { name:"SIM Swap Fraud", count:"1 incident", pct:8, color:"#8b5cf6" },
  ];

  const txnTypes = [
    { label:"UPI", pct:65, color:"#10b981" },
    { label:"NEFT", pct:15, color:"#3b82f6" },
    { label:"Card", pct:12, color:"#8b5cf6" },
    { label:"ATM", pct:5, color:"#f59e0b" },
    { label:"IMPS", pct:3, color:"#ec4899" },
  ];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 }}>Fraud Analytics</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 16 }}>Transaction Types</div>
          {txnTypes.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", width: 40 }}>{t.label}</div>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${t.pct}%`, background: t.color, borderRadius: 4 }}></div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", width: 30, textAlign: "right" }}>{t.pct}%</div>
            </div>
          ))}
          <div style={{ marginTop: 20, padding: 16, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>ML Model Accuracy</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#10b981" }}>96.3%</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Random Forest · 100 estimators · 50,000 transactions</div>
          </div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", marginBottom: 16 }}>Fraud Types Detected</div>
          {fraudTypes.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(10,14,26,0.5)", borderRadius: 10, marginBottom: 10, borderLeft: `3px solid ${f.color}` }}>
              <div>
                <div style={{ fontSize: 13, color: "#e2e8f0" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{f.count}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: f.color }}>{f.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}