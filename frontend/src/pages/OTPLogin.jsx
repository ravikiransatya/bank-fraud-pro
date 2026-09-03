import { useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, Smartphone, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import API from "../services/api";
import { getClientDeviceMetadata } from "../utils/deviceFingerprint";

export default function OTPLogin({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(0);

  const otpInputsRef = useRef([]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Request SMS OTP via Backend -> 2Factor Direct SMS Gateway
  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/auth/send-otp", {
        phone: cleanPhone,
      });

      if (response.data && response.data.success) {
        setStep("otp");
        setSuccessMsg("SMS OTP dispatched successfully to your mobile number.");
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => {
          if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
        }, 100);
      } else {
        setError(response.data.message || "Failed to deliver SMS OTP. Please try again.");
      }
    } catch (err) {
      const msg = err.message || "Unable to contact authentication server. Please verify your connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP box typing
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next box
    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle Backspace navigation
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle paste for full 6 digits
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  // Verify OTP with Backend -> 2Factor API & Establish Session
  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const clientMetadata = getClientDeviceMetadata();
      const response = await API.post("/auth/verify-otp", {
        phone: phone.trim().replace(/\D/g, ""),
        otp: fullOtp,
        clientMetadata,
      });

      if (response.data && response.data.success) {
        if (response.data.token) {
          localStorage.setItem("bankguard_token", response.data.token);
        }
        if (clientMetadata.deviceFingerprint) {
          localStorage.setItem("bankguard_device_fingerprint", clientMetadata.deviceFingerprint);
        }
        onLogin(phone.trim().replace(/\D/g, ""));
      } else {
        setError(response.data.message || "Invalid or expired verification code.");
      }
    } catch (err) {
      const msg = err.message || "Verification failed. Please check the code and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-base)",
        padding: "16px 12px",
      }}
    >
      <div
        className="bg-card"
        style={{
          width: "100%",
          maxWidth: 960,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-modal)",
          overflow: "hidden",
        }}
      >
        {/* LEFT COLUMN: Security Value Proposition (Desktop) */}
        <div
          style={{
            padding: "40px 36px",
            background: "#f8fafc",
            borderRight: "1px solid var(--border-card)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          className="hidden-mobile"
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--brand-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(4, 120, 87, 0.25)",
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)", letterSpacing: -0.3 }}>
                  BankGuard <span style={{ color: "var(--brand-primary)" }}>AI</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Financial Security Platform
                </div>
              </div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)", lineHeight: 1.3, marginBottom: 12 }}>
              Enterprise Defense for Connected Financial Accounts
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 24 }}>
              Continuous real-time fraud monitoring, transaction screening, and machine learning anomaly detection.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Carrier SMS Authentication", desc: "Cryptographic single-use token dispatched directly to your registered SIM." },
                { title: "Random Forest Anomaly Detection", desc: "Sub-5ms evaluation of transaction velocity, geolocation, and amount baselines." },
                { title: "Centralized Multi-Bank Ledger", desc: "Real-time institutional monitoring across SBI, HDFC, ICICI, Axis, and Kotak." },
              ].map((feature, i) => (
                <div key={i} style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "var(--brand-primary-light)",
                      color: "var(--brand-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <CheckCircle2 size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{feature.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-card)", paddingTop: 16, marginTop: 28, display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 11 }}>
            <Lock size={12} style={{ color: "var(--brand-primary)" }} />
            <span>256-Bit TLS & Carrier-Enforced Authentication</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Portal */}
        <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Mobile Branding Header */}
          <div className="mobile-only" style={{ alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
                BankGuard <span style={{ color: "var(--brand-primary)" }}>AI</span>
              </div>
              <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                Financial Security
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>
              {step === "phone" ? "Sign In to BankGuard" : "Verify Carrier SMS OTP"}
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
              {step === "phone"
                ? "Enter your 10-digit registered Indian mobile number."
                : `Enter the 6-digit code sent via SMS to +91 ${phone}`}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--semantic-danger-bg)",
                border: "1px solid var(--semantic-danger-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--semantic-danger)",
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--semantic-safe-bg)",
                border: "1px solid var(--semantic-safe-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--semantic-safe)",
                fontSize: 12.5,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: MOBILE NUMBER INPUT */}
          {step === "phone" ? (
            <form onSubmit={handleSendOTP}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Registered Mobile Number
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--border-card)",
                      borderRadius: "var(--radius-md)",
                      padding: "0 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      userSelect: "none",
                    }}
                  >
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    autoFocus
                    className="bg-input tabular-nums"
                    style={{ fontSize: 15, letterSpacing: 1 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.trim().length !== 10}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px 0", fontSize: 13.5 }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="live-pulse" /> Dispatching SMS OTP...
                  </>
                ) : (
                  <>
                    Request SMS OTP <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION */
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                  6-Digit SMS Verification Code
                </label>

                {/* 6 Box Inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }} onPaste={handleOtpPaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="bg-input tabular-nums"
                      style={{
                        height: 46,
                        textAlign: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        padding: 0,
                        minWidth: 0,
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="btn btn-primary"
                style={{ width: "100%", padding: "12px 0", fontSize: 13.5, marginBottom: 14 }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="live-pulse" /> Verifying Session...
                  </>
                ) : (
                  <>
                    <Lock size={15} /> Authenticate & Authorize
                  </>
                )}
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="btn btn-ghost"
                  style={{ padding: "4px 8px", fontSize: 12 }}
                >
                  ← Change Number
                </button>

                {countdown > 0 ? (
                  <span style={{ color: "var(--text-muted)" }}>Resend in <strong style={{ color: "var(--text-primary)" }}>{countdown}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="btn btn-ghost"
                    style={{ padding: "4px 8px", fontSize: 12, color: "var(--brand-primary)", fontWeight: 600 }}
                  >
                    Resend SMS OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}