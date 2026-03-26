"use client";

import { useEffect, useState } from "react";
import { getPoolStatus } from "../../../lib/poolStatus";

type Pick = {
  id: string;
  rank: number;
  golferId: string;
  golferName: string;
  positionPoints: number;
  weight: number;
  totalPoints: number;
};

type Row = {
  id: string;
  entryName: string;
  isPaid: boolean;
  createdAt: string;
  picks: Pick[];
  score: number;
};

type PoolInfo = {
  id: string;
  name: string;
  entriesCloseAt: string;
  startsAt: string;
  locked: boolean;
  endedAt: string | null;
  isArchived: boolean;
};

export default function LeaderboardClient({ poolId }: { poolId: string }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`/api/pools/${poolId}/leaderboard`, {
        cache: "no-store",
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(
          data?.error || `Failed to load leaderboard (${res.status})`,
        );
      }

      setPool(data.pool);
      setRows(data.leaderboard);
      setGeneratedAt(data.generatedAt || data.snapshot?.fetchedAt || "");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const intervalMs = 60_000;

    const tick = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };

    const id = window.setInterval(tick, intervalMs);

    const onVis = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);

  function medalForIndex(idx: number) {
    if (idx === 0) return "🥇";
    if (idx === 1) return "🥈";
    if (idx === 2) return "🥉";
    return "";
  }

  function backgroundForIndex(idx: number) {
    if (idx === 0) return "#fff8dc";
    if (idx === 1) return "#f5f5f5";
    if (idx === 2) return "#fdf2e9";
    return "white";
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 900,
      }}
    >
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

{pool && (
  <div style={{ marginTop: 6, opacity: 0.8 }}>
    Status: {getPoolStatus(pool)}
  </div>
)}
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          onClick={load}
          style={{ padding: "8px 12px", cursor: "pointer" }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>

        {generatedAt && (
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Last updated: {new Date(generatedAt).toLocaleTimeString()} (auto every
            60s)
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
          rows.map((r, idx) => {
            const isExpanded = !!expanded[r.id];

            return (
              <div
                key={r.id}
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: backgroundForIndex(idx),
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "flex-start",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                  }
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {medalForIndex(idx)} {idx + 1}. {r.entryName}{" "}
                      {r.isPaid ? (
                        <span
                          style={{
                            marginLeft: 8,
                            color: "green",
                            fontWeight: 600,
                          }}
                        >
                          ✓ Paid
                        </span>
                      ) : (
                        <span style={{ marginLeft: 8, color: "#999" }}>
                          Unpaid
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Submitted: {new Date(r.createdAt).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      Click to {isExpanded ? "collapse" : "expand"} pick details
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>Score</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{r.score}</div>
                  </div>
                </div>

                {isExpanded ? (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      background: "rgba(255,255,255,0.65)",
                      borderRadius: 8,
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 14,
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "6px 8px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Rank
                          </th>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "6px 8px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Golfer
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "6px 8px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Position Pts
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "6px 8px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Weight
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "6px 8px",
                              borderBottom: "1px solid #ddd",
                            }}
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.picks.map((p) => (
                          <tr key={p.id}>
                            <td
                              style={{
                                padding: "6px 8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {p.rank}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {p.golferName}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "right",
                              }}
                            >
                              {p.positionPoints}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "right",
                              }}
                            >
                              {p.weight}
                            </td>
                            <td
                              style={{
                                padding: "6px 8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "right",
                                fontWeight: 700,
                              }}
                            >
                              {p.totalPoints}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <ol style={{ marginTop: 10, paddingLeft: 20 }}>
                    {r.picks.map((p) => (
                      <li key={p.id} style={{ marginTop: 2 }}>
                        <strong>{p.rank}.</strong> {p.golferName}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}