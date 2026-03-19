"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "../../lib/http";

type MeResponse = {
  me: {
    id: string;
    email: string;
    role: "SUPER_ADMIN" | "ORG_ADMIN";
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
  }[];
};

export default function AdminHeader() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse["me"] | null>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const data = await fetchJson<MeResponse>("/api/admin/me", {
          cache: "no-store",
        });
        setMe(data.me);
      } catch {
        setMe(null);
      }
    }

    loadMe();
  }, []);

  async function logout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: "1px solid #ddd",
      }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a href="/admin">Admin Home</a>
        {me?.role === "SUPER_ADMIN" && (
          <a href="/admin/organizations">Organizations & Admins</a>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {me && (
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Signed in as <strong>{me.email}</strong> ({me.role})
          </div>
        )}
        <button
          onClick={logout}
          style={{
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
