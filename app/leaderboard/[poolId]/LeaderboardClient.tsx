"use client";

import { useEffect, useState } from "react";

type Pick = {
  id: string;
  rank: number;
  golferId: string;
  golferName: string;
};

type Row = {
  id: string;
  entryName: string;
  isPaid: boolean;
  createdAt: string;
  picks: Pick[];
  score: number; // placeholder for now
};

type PoolInfo = {
  id: string;
  name: string;
  entriesCloseAt: string;
  startsAt: string;
};

export default function LeaderboardClient({ poolId }: { poolId: string }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/pools/${poolId}/leaderboard`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load leaderboard");

      setPool(data.pool);
      setRows(data.leaderboard);
      setGeneratedAt(data.generatedAt);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(() => load(), 15000); // refresh every 15s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif", maxWidth: 900 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>
        {pool?.name || "Leaderboard"}
      </h1>

      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Pool ID: <code>{poolId}</code>
      </div>

      {pool && (
        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Starts: {new Date(pool.startsAt).toLocaleString()} • Entries close:{" "}
          {new Date(pool.entriesCloseAt).toLocaleString()}
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={load}
          style={{ padding: "8px 12px", cursor: "pointer" }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>

        {generatedAt && (
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Updated: {new Date(generatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {err && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          <strong>Error:</strong> {err}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {rows.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No entries yet.</div>
        ) : (
          rows.map((r, idx) => (
            <div
              key={r.id}
              style={{
                marginTop: 12,
                padding: 12,
                border: "1px solid #ddd",
                borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {idx + 1}. {r.entryName} {r.isPaid ? "✓ Paid" : ""}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Submitted: {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Score (placeholder)</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{r.score}</div>
                </div>
              </div>

              <ol style={{ marginTop: 10, paddingLeft: 20 }}>
                {r.picks.map((p) => (
                  <li key={p.id} style={{ marginTop: 2 }}>
                    <strong>{p.rank}.</strong> {p.golferName}
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
