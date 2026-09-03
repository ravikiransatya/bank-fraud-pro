import { useState, useRef, useEffect } from "react";
import { ShieldCheck, MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import API from "../services/api";

export default function ChatBot({ phone }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello. I am your BankGuard AI Financial Security Analyst. I can investigate flagged charges, explain risk scores, and help secure your accounts. What would you like to examine?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const suggestedQuestions = [
    "Why was the ₹10,000 ATM withdrawal flagged?",
    "What is my current account threat score?",
    "How does the ML Random Forest model work?",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/chat", {
        messages: [
          {
            role: "system",
            content:
              "You are an executive BankGuard AI Financial Security Analyst and Cybercrime Prevention Expert. Provide clear, professional, concise, and structured financial intelligence advice regarding fraud alerts, anomaly detection, chargebacks, and account security. Keep answers direct and authoritative.",
          },
          ...messages,
          userMsg,
        ],
      });

      const data = response.data;
      const reply = data.choices?.[0]?.message?.content || "I have screened your query. No anomalous behavior was detected in this activity.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to reach the AI threat analysis cluster. Please verify your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Emerald) */}
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-primary"
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 74px)",
          right: 16,
          width: 48,
          height: 48,
          borderRadius: "50%",
          padding: 0,
          boxShadow: "0 4px 16px rgba(4, 120, 87, 0.35)",
          zIndex: 900,
        }}
        title="AI Financial Security Analyst"
      >
        {open ? <X size={20} /> : <Bot size={22} />}
      </button>

      {/* Slide-Up Chat Drawer (Clean White) */}
      {open && (
        <div
          className="bg-card"
          style={{
            position: "fixed",
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 70px)",
            right: 16,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100dvh - 100px)",
            height: 480,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            zIndex: 900,
            boxShadow: "var(--shadow-modal)",
            border: "1px solid var(--border-card)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border-card)",
              background: "var(--brand-primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--brand-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  AI Financial Security Analyst
                </div>
                <div style={{ fontSize: 10, color: "var(--brand-primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--brand-primary)" }} /> Groq LLaMA-3 Telemetry
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0 }}>
              <X size={16} />
            </button>
          </div>

          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isUser ? "flex-end" : "flex-start",
                    gap: 8,
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--brand-primary-light)",
                        color: "var(--brand-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={13} />
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "82%",
                      padding: "9px 13px",
                      borderRadius: isUser ? "14px 14px 2px 14px" : "2px 14px 14px 14px",
                      background: isUser ? "var(--brand-primary)" : "#f1f5f9",
                      border: isUser ? "none" : "1px solid var(--border-card)",
                      color: isUser ? "#ffffff" : "var(--text-primary)",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 11, padding: "4px 8px" }}>
                <RefreshCw size={12} className="live-pulse" />
                <span>Analyst screening threat vector...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested Quick Inquiries */}
          {messages.length <= 2 && (
            <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={11} /> Suggested Inquiries
              </div>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => send(q)}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: "5px 9px", textAlign: "left", justifyContent: "flex-start", whiteSpace: "normal" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid var(--border-card)",
              background: "#f8fafc",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              type="text"
              className="bg-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about threats, charges or risk..."
              style={{ fontSize: 12, padding: "7px 11px" }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{ width: 34, height: 34, padding: 0, borderRadius: "var(--radius-md)" }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}