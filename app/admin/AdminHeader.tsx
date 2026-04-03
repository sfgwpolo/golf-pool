"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "../../lib/http";
import ThemeToggle from "../components/ThemeToggle";

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
    <div className="flex justify-between gap-3 items-center flex-wrap mb-4 pb-3 border-b border-gray-300 dark:border-gray-600">
      <div className="flex gap-3 flex-wrap items-center">
        <a href="/admin" className="hover:underline">Admin Home</a>
        <a href="/admin/organizations" className="hover:underline">Organizations & Admins</a>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        {me && (
          <div className="text-xs opacity-80">
            Signed in as <strong>{me.email}</strong> ({me.role})
          </div>
        )}
        <button
          onClick={logout}
          className="px-2.5 py-1.5 border border-gray-400 dark:border-gray-500 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Logout
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}