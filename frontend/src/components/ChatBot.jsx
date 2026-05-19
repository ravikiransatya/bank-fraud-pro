import { useState, useRef, useEffect } from "react";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function ChatBot({ phone }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Personal Fraud Analyst 🛡️ I can help you with fraud alerts, transaction queries, and account security. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      {
        role: "system",
        content: "You are a Personal Fraud Analyst...",
      },
      ...messages,
      userMsg,
    ],
  }),
});

const data = await response.json();
const reply = data.choices[0].message.content;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again!" }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: 28, right: 28, width: 56, height: 56,
        borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
        border: "none", cursor: "pointer", fontSize: 24, zIndex: 1000,
        boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        {open ? "✕" : "💬"}
      </button>

      {/* CHAT PANEL */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, width: 340, height: 480,
          background: "#0f172a", border: "1px solid rgba(59,130,246,0.2)",
          borderRadius: 16, display: "flex", flexDirection: "column",
          zIndex: 999, boxShadow: "0 8px 40px rgba(0,0,0,0.6)"
        }}>
          {/* HEADER */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(59,130,246,0.08)", borderRadius: "16px 16px 0 0"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>🛡️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>Personal Fraud Analyst</div>
              <div style={{ fontSize: 11, color: "#22c55e" }}>● Online</div>
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? "linear-gradient(135deg,#3b82f6,#8b5cf6)" : "rgba(255,255,255,0.06)",
                  color: "#f1f5f9", fontSize: 13, lineHeight: 1.5
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "9px 13px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.06)", color: "#64748b", fontSize: 13 }}>
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={{
            padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 8
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask your fraud analyst..."
              style={{
                flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, outline: "none"
              }}
            />
            <button onClick={send} disabled={loading} style={{
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", border: "none",
              borderRadius: 10, padding: "9px 14px", color: "white", cursor: "pointer", fontSize: 16
            }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}