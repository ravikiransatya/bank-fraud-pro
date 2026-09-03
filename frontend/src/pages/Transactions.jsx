import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CreditCard,
  Building2,
  Smartphone,
  Landmark,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus
} from "lucide-react";
import { useFinancial } from "../context/FinancialContext";
import TransactionModal from "../components/TransactionModal";

export default function Transactions() {
  const { transactions, loading, refreshing, refreshAll, executeNewTransaction } = useFinancial();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [bankFilter, setBankFilter] = useState("All");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const types = ["All", "UPI", "ATM", "Card", "NEFT", "IMPS"];
  const banks = ["All", "SBI", "HDFC", "ICICI", "AXIS", "KOTAK", "BOB"];

  // Filter transactions dynamically
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.merchant.toLowerCase().includes(q) ||
        (t.bank && t.bank.toLowerCase().includes(q)) ||
        (t.bankName && t.bankName.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q));

      const matchesType = filterType === "All" || t.type === filterType;

      const score = t.score !== undefined ? t.score : t.fraud_score;
      const matchesRisk =
        riskFilter === "All" ||
        (riskFilter === "Safe" && score < 40 && t.status !== "blocked") ||
        (riskFilter === "Flagged" && score >= 40 && score < 70) ||
        (riskFilter === "HighRisk" && (score >= 70 || t.status === "blocked"));

      const bName = t.bank || t.bankName;
      const matchesBank = bankFilter === "All" || bName?.toUpperCase() === bankFilter;

      return matchesSearch && matchesType && matchesRisk && matchesBank;
    });
  }, [transactions, search, filterType, riskFilter, bankFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getRiskBadge = (score, status) => {
    if (status === "blocked" || score >= 70) {
      return (
        <span className="badge badge-danger">
          <ShieldAlert size={11} />
          High Risk · {score}%
        </span>
      );
    }
    if (status === "flagged" || score >= 40) {
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={11} />
          Medium · {score}%
        </span>
      );
    }
    return (
      <span className="badge badge-safe">
        <ShieldCheck size={11} />
        Safe · {score}%
      </span>
    );
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "UPI": return Smartphone;
      case "ATM": return Landmark;
      case "Card": return CreditCard;
      case "NEFT":
      case "IMPS": return Building2;
      default: return Zap;
    }
  };

  // Quick Simulation Helper to test dynamic balance reduction & ledger update
  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      await executeNewTransaction({
        bankName: "SBI",
        merchant: "Swiggy Quick Food Pay",
        amount: 350,
        type: "UPI",
        merchantCategory: "Food",
        location: "Vadodara, GJ",
      });
    } catch (err) {
      alert("Failed to process transaction: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
            Financial Audit Ledger
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
            Complete historical screening of digital & physical transactions across all connected accounts ({filtered.length} total entries).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleSimulatePayment}
            disabled={simulating}
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
            title="Simulate a real-time ₹350 UPI payment"
          >
            <Plus size={14} />
            {simulating ? "Processing..." : "Simulate ₹350 UPI"}
          </button>
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

      {/* Filter & Search Bar */}
      <div
        className="bg-card"
        style={{
          padding: "12px 14px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "1 1 200px", minWidth: 160, position: "relative" }}>
          <Search size={15} style={{ color: "var(--text-muted)", position: "absolute", left: 10 }} />
          <input
            type="text"
            className="bg-input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search merchant, bank, location..."
            style={{ paddingLeft: 32, fontSize: 12.5 }}
          />
        </div>

        {/* Channel Pills */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {types.map((t) => {
            const isActive = filterType === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setFilterType(t);
                  setCurrentPage(1);
                }}
                className="btn"
                style={{
                  padding: "4px 10px",
                  fontSize: 11.5,
                  borderRadius: "var(--radius-pill)",
                  background: isActive ? "var(--brand-primary-light)" : "#ffffff",
                  color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                  border: isActive ? "1px solid var(--brand-primary)" : "1px solid var(--border-card)",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Dropdowns Container */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Bank Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-input"
              style={{ width: "auto", padding: "4px 8px", fontSize: 11.5 }}
            >
              {banks.map((b) => (
                <option key={b} value={b}>{b === "All" ? "All Banks" : b}</option>
              ))}
            </select>
          </div>

          {/* Risk Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-input"
              style={{ width: "auto", padding: "4px 8px", fontSize: 11.5 }}
            >
              <option value="All">All Risk</option>
              <option value="Safe">Safe (&lt; 40%)</option>
              <option value="Flagged">Flagged (40–69%)</option>
              <option value="HighRisk">High Risk (≥ 70%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="bg-card skeleton" style={{ height: 320 }} />
      ) : paginatedList.length > 0 ? (
        <div className="table-container">
          <table className="bg-table">
            <thead>
              <tr>
                <th>Ref ID</th>
                <th>Merchant / Entity</th>
                <th>Channel</th>
                <th>Bank Account</th>
                <th>Location / IP</th>
                <th>Timestamp</th>
                <th>Amount (INR)</th>
                <th>Risk Score</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((t) => {
                const isCredit = t.amount > 0 || t.transactionType === "CREDIT";
                const Icon = getChannelIcon(t.type);
                const score = t.score !== undefined ? t.score : t.fraud_score;
                return (
                  <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => setSelectedTxn(t)}>
                    <td>
                      <span className="tabular-nums" style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)" }}>
                        {t.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "var(--radius-sm)",
                            background: "#f1f5f9",
                            border: "1px solid var(--border-card)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-secondary)",
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{t.merchant}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.merchantCategory}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{t.type}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.bank || t.bankName}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.location}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{t.time}</span>
                    </td>
                    <td>
                      <span
                        className="tabular-nums"
                        style={{
                          fontWeight: 700,
                          color: isCredit ? "var(--semantic-safe)" : "var(--text-primary)",
                        }}
                      >
                        {isCredit ? "+" : "-"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>{getRiskBadge(score, t.status)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(t);
                        }}
                        className="btn btn-ghost"
                        style={{ padding: "4px 8px", fontSize: 11 }}
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--border-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <div>
              Showing <strong style={{ color: "var(--text-primary)" }}>{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {Math.min(currentPage * pageSize, filtered.length)}
              </strong>{" "}
              of <strong style={{ color: "var(--text-primary)" }}>{filtered.length}</strong> transactions
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setCurrentPage(1);
                  }}
                  className="bg-input"
                  style={{ width: "auto", padding: "3px 8px", fontSize: 11 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px" }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px" }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div
          className="bg-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--text-muted)" }}>
            <Search size={20} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            No Transactions Found
          </div>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 360, margin: "6px auto 16px" }}>
            No ledger entries matched your current search filters or risk thresholds.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setFilterType("All");
              setRiskFilter("All");
              setBankFilter("All");
              setCurrentPage(1);
            }}
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Transaction Modal */}
      {selectedTxn && (
        <TransactionModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
}