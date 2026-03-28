'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function login() {
    setMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(data?.error || `Login failed (${res.status})`);

      router.push(next);
      router.refresh();
    } catch (e: unknown) {
      const errorMsg = typeof e === "object" && e !== null && "message" in e ? (e as { message?: string }).message : undefined;
      setMsg(errorMsg || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif", maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Login</h1>

      <div style={{ marginTop: 12 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        />

        <button
          onClick={login}
          disabled={loading || !email.trim() || password.length < 6}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            cursor: loading || !email.trim() || password.length < 6 ? "not-allowed" : "pointer",
            opacity: loading || !email.trim() || password.length < 6 ? 0.5 : 1,
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {msg && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            <strong>{msg}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
