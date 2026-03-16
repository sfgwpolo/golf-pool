"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Me = { id: string; email: string; role: "SUPER_ADMIN" | "ORG_ADMIN" };
type Org = { id: string; name: string; slug: string };
type Pool = {
  id: string;
  name: string;
  year: number;
  startsAt: string;
  entriesCloseAt: string;
  locked: boolean;
};

export default function AdminHomeClient() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [poolsByOrg, setPoolsByOrg] = useState<Record<string, Pool[]>>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const meRes = await fetch("/api/admin/me", { cache: "no-store" });
      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData?.error || "Not logged in");

      setMe(meData.me);
      setOrgs(meData.organizations || []);

      // Load pools for each org
      const orgList: Org[] = meData.organizations || [];
      const results = await Promise.all(
        orgList.map(async (o) => {
          const res = await fetch(`/api/admin/organizations/${o.id}/pools`, { cache: "no-store" });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || `Failed to load pools for ${o.name}`);
          return [o.id, data.pools || []] as const;
        })
      );

      const map: Record<string, Pool[]> = {};
      for (const [orgId, pools] of results) map[orgId] = pools;
      setPoolsByOrg(map);
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Admin Home</h1>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={load} disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          <strong>{msg}</strong>
        </div>
      )}

      <div style={{ marginTop: 16 }}>

        {orgs.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No organizations available.</div>
        ) : (
          orgs.map((o) => (
            <div
              key={o.id}
              style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}
            >
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {o.name} <span style={{ opacity: 0.6, fontSize: 13 }}>({o.slug})</span>
              </div>

              <div style={{ marginTop: 8, fontWeight: 700 }}>Pools</div>

              {(poolsByOrg[o.id] || []).length === 0 ? (
                <div style={{ marginTop: 6, opacity: 0.7 }}>No pools yet.</div>
              ) : (
                <ul style={{ marginTop: 6 }}>
                  {(poolsByOrg[o.id] || []).map((p) => (
                    <li key={p.id} style={{ marginTop: 6 }}>
                      <a href={`/admin/pools/${p.id}`} style={{ fontWeight: 700 }}>
                        {p.year} — {p.name}
                      </a>{" "}
                      <span style={{ opacity: 0.75 }}>
                        • locked: {p.locked ? "yes" : "no"} • entries close:{" "}
                        {new Date(p.entriesCloseAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
