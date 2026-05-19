export default function Profile({ phone, onLogout }) {
  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 20 }}>My Profile</div>
      <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>{phone[0]}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>+91 {phone}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>Verified Account · 3 Banks Linked</div>
          </div>
        </div>
        {[["Mobile","+" + "91 " + phone],["UPI ID", phone + "@upi"],["Account Status","Active & Verified"],["Fraud Protection","Enabled"],["Last Login","Today " + new Date().toLocaleTimeString()]].map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{value}</div>
          </div>
        ))}

        {/* LOGOUT BUTTON */}
        <button
          onClick={onLogout}
          style={{ marginTop: 28, width: "100%", padding: "12px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 15, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5 }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}