const banks = [
  { name:"State Bank of India", short:"SBI", acc:"****4521", balance:"₹45,230", bg:"linear-gradient(135deg,#1a237e,#283593)", type:"Savings" },
  { name:"HDFC Bank", short:"HDFC", acc:"****8834", balance:"₹1,23,450", bg:"linear-gradient(135deg,#b71c1c,#c62828)", type:"Savings" },
  { name:"ICICI Bank", short:"ICICI", acc:"****2210", balance:"₹67,800", bg:"linear-gradient(135deg,#e65100,#bf360c)", type:"Current" },
  { name:"Axis Bank", short:"AXIS", acc:"****3310", balance:"₹5,750", bg:"linear-gradient(135deg,#4a148c,#6a1b9a)", type:"Savings" },
  { name:"Kotak Mahindra", short:"KOTAK", acc:"****9921", balance:"₹22,100", bg:"linear-gradient(135deg,#004d40,#00695c)", type:"Savings" },
  { name:"Bank of Baroda", short:"BOB", acc:"****7745", balance:"₹11,450", bg:"linear-gradient(135deg,#1b5e20,#2e7d32)", type:"Savings" },
];

export default function LinkedBanks({ phone }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>Linked Banks</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Banks linked to +91 {phone} via UPI / NPCI</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {banks.map((b, i) => (
          <div key={i} style={{ borderRadius: 20, padding: 24, background: b.bg, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{b.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>{b.type} Account</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "white", margin: "16px 0 4px" }}>{b.balance}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{b.acc}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>UPI: {phone}@{b.short.toLowerCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}