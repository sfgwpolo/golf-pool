"use client";

import { useEffect, useMemo, useState } from "react";

type EntryPick = {
  id: string;
  rank: number;
  golferId: string;
  golferName: string;
};

type EntryRow = {
  id: string;
  entryName: string;
  email: string;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: string | null;
  paidMethod: string | null;
  paidNote: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  picks: EntryPick[];
};

type PoolInfo = {
  id: string;
  name: string;
  startsAt: string;
  entriesCloseAt: string;
};

export default function AdminPoolClient({ poolId }: { poolId: string }) {
  const [adminToken, setAdminToken] = useState<string>("");
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    const stored = sessionStorage.getItem("ADMIN_TOKEN") || "";
    setAdminToken(stored);
  }, []);

  async function fetchEntries(token: string) {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pools/${poolId}/entries`, {
        headers: { "x-admin-token": token },
        cache: "no-store",
      });

      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch {}
      if (!res.ok) throw new Error(data?.error || text || "Failed to load entries");

      setPool(data.pool);
      setEntries(data.entries);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  async function saveTokenAndLoad() {
    sessionStorage.setItem("ADMIN_TOKEN", adminToken);
    await fetchEntries(adminToken);
  }

  async function togglePaid(entryId: string, isPaid: boolean) {
    setErr("");
    try {
      const res = await fetch(`/api/admin/entries/${entryId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(
          isPaid
            ? { isPaid: true, paidAmount: 25, paidMethod: "Venmo" } // change defaults anytime
            : { isPaid: false }
        ),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update payment");

      // refresh list
      await fetchEntries(adminToken);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    }
  }

  async function purgeUnpaid() {
    setErr("");
    try {
      const res = await fetch(`/api/admin/pools/${poolId}/purge-unpaid`, {
        method: "POST",
        headers: { "x-admin-token": adminToken },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to purge unpaid");

      alert(`Purged ${data.purged} unpaid entries.`);
      await fetchEntries(adminToken);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    }
  }

  const entriesCloseAt = pool ? new Date(pool.entriesCloseAt) : null;
  const canPurge = entriesCloseAt ? now >= entriesCloseAt : false;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin: Pool</h1>
      <div style={{ marginTop: 8, opacity: 0.8 }}>
        Pool ID: <code>{poolId}</code>
      </div>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Admin Token (prototype)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Paste ADMIN_TOKEN from .env"
            style={{ minWidth: 320, padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
          />
          <button
            onClick={saveTokenAndLoad}
            style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
          >
            Load entries
          </button>
          <button
            onClick={() => fetchEntries(adminToken)}
            style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
          >
            Refresh
          </button>
          <button
            onClick={purgeUnpaid}
            disabled={!canPurge}
            title={!canPurge ? "Disabled until entriesCloseAt" : "Soft-delete unpaid entries"}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: canPurge ? "pointer" : "not-allowed",
              opacity: canPurge ? 1 : 0.5,
            }}
          >
            Purge unpaid (after lock)
          </button>
        </div>

        {pool && (
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
            <div>
              <strong>{pool.name}</strong>
            </div>
            <div>entriesCloseAt: {new Date(pool.entriesCloseAt).toLocaleString()}</div>
            <div>startsAt: {new Date(pool.startsAt).toLocaleString()}</div>
          </div>
        )}

        {err && (
          <div style={{ marginTop: 10, color: "crimson" }}>
            <strong>Error:</strong> {err}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div>Loading…</div>
        ) : entries.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No entries loaded yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  {["Paid", "Entry", "Email", "Picks (1–10)", "Created", "Deleted?"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: 8,
                        borderBottom: "1px solid #ddd",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ opacity: e.isDeleted ? 0.45 : 1 }}>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      <input
                        type="checkbox"
                        checked={e.isPaid}
                        disabled={e.isDeleted}
                        onChange={(ev) => togglePaid(e.id, ev.target.checked)}
                      />
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {e.isPaid ? "Paid" : "Unpaid"}
                      </div>
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      <div style={{ fontWeight: 600 }}>{e.entryName}</div>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>
                        <code>{e.id}</code>
                      </div>
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{e.email}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee", minWidth: 360 }}>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {e.picks.map((p) => (
                          <li key={p.id} style={{ fontSize: 13 }}>
                            {p.golferName} <span style={{ opacity: 0.6 }}>({p.golferId})</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      {e.isDeleted ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
              Tip: the “Paid” checkbox currently defaults paidAmount=25 and paidMethod=Venmo when turning on.
              We’ll make those editable next.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
