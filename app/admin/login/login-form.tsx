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
    <div className="p-5 font-sans max-w-md bg-white dark:bg-gray-900 text-black dark:text-white mx-auto">
      <h1 className="text-2xl font-bold">Admin Login</h1>

      <div className="mt-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2.5 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full p-2.5 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <button
          onClick={login}
          disabled={loading || !email.trim() || password.length < 6}
          className="mt-3 px-3.5 py-2.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {msg && (
          <div className="mt-2.5 text-red-600 dark:text-red-400">
            <strong>{msg}</strong>
          </div>
        )}
      </div>
    </div>
  );
}