import { useState } from "react";

export default function OTPLogin({ onLogin }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const sendOTP = () => {
    if (phone.length !== 10) { setError("Enter valid 10-digit number"); return; }
    setError("");
    setStep("otp");
  };

  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`).focus();
  };

  const verifyOTP = () => {
    const entered = otp.join("");
    if (entered === "123456") {
      onLogin(phone);
    } else {
      setError("Wrong OTP! Use 123456 for demo");
    }
  };

  const card = { background: "rgba(15,23,42,0.9)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 24, padding: "48px 40px", width: 420, backdropFilter: "blur(20px)" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0e1a,#0f1729)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={card}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>BankGuard AI</div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Fraud Detection System</div>
          </div>
        </div>

        {step === "phone" ? (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Welcome back</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 28 }}>Enter your registered mobile number</div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Mobile Number</div>
              <div style={{ display: "flex" }}>
                <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRight: "none", borderRadius: "10px 0 0 10px", padding: "14px", fontSize: 14, color: "#94a3b8" }}>🇮🇳 +91</div>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} placeholder="9876543210"
                  style={{ flex: 1, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0 10px 10px 0", padding: "14px 16px", color: "#f1f5f9", fontSize: 15, outline: "none" }} />
              </div>
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>⚠️ {error}</div>}
            <button onClick={sendOTP} style={{ width: "100%", padding: 15, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", border: "none", borderRadius: 10, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Send OTP →
            </button>
            <div style={{ marginTop: 16, padding: 14, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, fontSize: 12, color: "#64748b", textAlign: "center" }}>
              Demo: Any 10-digit number · OTP is <strong style={{ color: "#3b82f6" }}>123456</strong>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>Enter OTP</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 28 }}>OTP sent to +91 {phone.slice(0, 5)}xxxxx</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="text" value={digit} onChange={e => handleOtpChange(e.target.value, i)} maxLength={1}
                  style={{ width: 52, height: 56, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, textAlign: "center", color: "#f1f5f9", fontSize: 22, fontWeight: 700, outline: "none" }} />
              ))}
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>⚠️ {error}</div>}
            <button onClick={verifyOTP} style={{ width: "100%", padding: 15, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", border: "none", borderRadius: 10, color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Verify & Login →
            </button>
            <div onClick={() => setStep("phone")} style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b", cursor: "pointer" }}>← Change number</div>
          </>
        )}

        {/* Bank pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 28, justifyContent: "center", flexWrap: "wrap" }}>
          {["SBI", "HDFC", "ICICI", "Axis", "BOB", "Kotak", "PNB"].map(b => (
            <span key={b} style={{ padding: "5px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, fontSize: 11, color: "#64748b" }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}