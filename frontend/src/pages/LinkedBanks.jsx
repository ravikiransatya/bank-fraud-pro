import { Landmark, ShieldCheck, CreditCard, Lock, CheckCircle2, RefreshCw } from "lucide-react";
import { useFinancial } from "../context/FinancialContext";

export default function LinkedBanks() {
  const { phone, accounts, loading, refreshing, refreshAll, isFrozen } = useFinancial();

  const totalBalance = accounts
    .filter((a) => !a.isFrozen)
    .reduce((sum, b) => sum + (b.rawBalance || 0), 0)
    .toLocaleString("en-IN");

  const getBankColor = (short) => {
    switch (short) {
      case "SBI": return "#0284c7";
      case "HDFC": return "#dc2626";
      case "ICICI": return "#ea580c";
      case "AXIS": return "#c026d3";
      case "KOTAK": return "#059669";
      case "BOB": return "#d97706";
      default: return "var(--brand-primary)";
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Connected Banking Institutions
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Centralized multi-institution ledger linked via NPCI Account Aggregator / UPI to <strong style={{ color: "var(--text-primary)" }}>+91 {phone}</strong>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="bg-card" style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Balance:</span>
            <span className="tabular-nums" style={{ fontSize: 15, fontWeight: 800, color: isFrozen ? "var(--semantic-danger)" : "var(--text-primary)" }}>
              {isFrozen ? "FROZEN" : `₹${totalBalance}`}
            </span>
          </div>

          <button
            onClick={refreshAll}
            disabled={refreshing}
            className="btn btn-ghost"
            style={{ padding: "6px 10px", fontSize: 12 }}
          >
            <RefreshCw size={14} className={refreshing ? "live-pulse" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid of Bank Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card skeleton" style={{ height: 180 }} />
          ))
        ) : accounts.length > 0 ? (
          accounts.map((b, i) => {
            const accentColor = getBankColor(b.shortName || b.name);
            const accountFrozen = b.isFrozen || isFrozen;
            return (
              <div
                key={b.id || i}
                className="bg-card"
                style={{
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 180,
                  borderTop: `4px solid ${accentColor}`,
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--shadow-card)";
                }}
              >
                {/* Top Bar: Bank Logo & Type */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: "#f1f5f9",
                          border: "1px solid var(--border-card)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 11,
                          color: accentColor,
                        }}
                      >
                        {b.shortName || b.logo || "BNK"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                          {b.name || b.bankName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {b.type} · IFSC {b.ifsc}
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${accountFrozen ? "danger" : "safe"}`} style={{ fontSize: 10 }}>
                      {accountFrozen ? "● Frozen" : "● Active"}
                    </span>
                  </div>

                  {/* Masked Account Number */}
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: 2, margin: "12px 0 6px", fontFamily: "var(--font-mono)" }}>
                    {b.accountNo}
                  </div>
                </div>

                {/* Bottom Bar: Available Balance & UPI ID */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: 12, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                      Available Balance
                    </div>
                    <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: accountFrozen ? "var(--semantic-danger)" : "var(--text-primary)", fontFamily: "var(--font-heading)", marginTop: 2 }}>
                      {accountFrozen ? "LOCKED" : b.balance || `₹${(b.rawBalance || 0).toLocaleString("en-IN")}`}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      {b.txnCount ? `${b.txnCount} Transactions` : "UPI Handle"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      {b.upiId || `${phone}@${(b.shortName || "bank").toLowerCase()}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card" style={{ padding: "36px 20px", textAlign: "center", gridColumn: "1 / -1", color: "var(--text-muted)" }}>
            No linked bank accounts found for this phone number.
          </div>
        )}
      </div>

      {/* Security Assurance Disclaimer */}
      <div
        className="bg-card"
        style={{
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderLeft: "3px solid var(--brand-primary)",
        }}
      >
        <div style={{ color: "var(--brand-primary)" }}>
          <ShieldCheck size={20} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          All {accounts.length} connected institutional accounts are continuously screened for automated transaction velocity bursts, unusual international IP routing, and ATM withdrawal location anomalies.
        </div>
      </div>
    </div>
  );
}