import { useState } from "react";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        sessionStorage.setItem("qoyod_auth", "1");
        onLogin();
      } else {
        setError("كلمة المرور غير صحيحة");
      }
    } catch {
      setError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#021544,#01355a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
        direction: "rtl",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "rgba(7,22,48,0.92)",
          border: "1px solid rgba(23,163,164,0.35)",
          borderRadius: 18,
          padding: "48px 40px",
          width: 360,
          maxWidth: "100%",
          boxShadow: "0 8px 48px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#17a3a3",
              letterSpacing: -1,
            }}
          >
            قيود
          </span>
          <span
            style={{
              fontSize: 14,
              color: "rgba(221,238,244,0.6)",
              display: "block",
              marginTop: 4,
            }}
          >
            Creative OS — للفريق الداخلي
          </span>
        </div>
        <div
          style={{
            width: 48,
            height: 3,
            background: "linear-gradient(90deg,#17a3a3,#60a5fa)",
            borderRadius: 2,
            margin: "16px auto 28px",
          }}
        />
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: "right" }}>
            <label
              style={{
                display: "block",
                color: "rgba(221,238,244,0.7)",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              كلمة مرور الفريق
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(7,22,48,0.7)",
                border: "1px solid rgba(1,53,90,0.6)",
                borderRadius: 8,
                color: "#ddeef4",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                direction: "ltr",
              }}
            />
          </div>
          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 7,
                padding: "8px 12px",
                color: "#f87171",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%",
              padding: "11px 0",
              background: loading || !password ? "rgba(23,163,164,0.4)" : "#17a3a3",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading || !password ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? "جارٍ التحقق..." : "دخول"}
          </button>
        </form>
        <p
          style={{
            marginTop: 20,
            color: "rgba(221,238,244,0.35)",
            fontSize: 11,
          }}
        >
          للاستخدام الداخلي فقط — Qoyod Marketing Team
        </p>
      </div>
    </div>
  );
}
