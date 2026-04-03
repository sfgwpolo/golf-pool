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
          data?.error || `Failed to load leaderboard (${res.status})`
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
  }, [poolId]);

  function medalForIndex(idx: number) {
    if (idx === 0) return "🥇";
    if (idx === 1) return "🥈";
    if (idx === 2) return "🥉";
    return "";
  }

  function backgroundForIndex(idx: number) {
    if (idx === 0) return "bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20";
    if (idx === 1) return "bg-gray-50 dark:bg-gray-800";
    if (idx === 2) return "bg-orange-50 dark:bg-orange-900 dark:bg-opacity-20";
    return "bg-white dark:bg-gray-900";
  }

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-3xl font-bold">
        {pool?.name || "Leaderboard"}
      </h1>

      <div className="mt-1.5 opacity-80 text-sm">
        Pool ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{poolId}</code>
      </div>

      {pool && (
        <div className="mt-1.5 opacity-80 text-sm">
          Starts: {new Date(pool.startsAt).toLocaleString()} • Entries close:{" "}
          {new Date(pool.entriesCloseAt).toLocaleString()}
        </div>
      )}

      {pool && (
        <div className="mt-1.5 opacity-80 text-sm">
          Status: {getPoolStatus(pool)}
        </div>
      )}

      <div className="mt-2.5 flex gap-2.5 items-center flex-wrap">
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>

        {generatedAt && (
          <div className="text-xs opacity-70">
            Last updated: {new Date(generatedAt).toLocaleTimeString()} (auto every 60s)
          </div>
        )}
      </div>

      {err && (
        <div className="mt-3 text-red-600 dark:text-red-400">
          <strong>Error:</strong> {err}
        </div>
      )}

      <div className="mt-4.5">
        {rows.length === 0 ? (
          <div className="opacity-70">No entries yet.</div>
        ) : (
          rows.map((r, idx) => {
            const isExpanded = !!expanded[r.id];

            return (
              <div
                key={r.id}
                className={`mt-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg ${backgroundForIndex(idx)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                }
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="flex-1">
                    <div className="text-lg font-bold">
                      {medalForIndex(idx)} {idx + 1}. {r.entryName}{" "}
                      {r.isPaid ? (
                        <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">
                          ✓ Paid
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          Unpaid
                        </span>
                      )}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      Submitted: {new Date(r.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      Click to {isExpanded ? "collapse" : "expand"} pick details
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs opacity-70">Score</div>
                    <div className="text-2xl font-bold">{r.score}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-300 dark:border-gray-600">
                          <th className="text-left p-2">Rank</th>
                          <th className="text-left p-2">Golfer</th>
                          <th className="text-right p-2">Position Pts</th>
                          <th className="text-right p-2">Weight</th>
                          <th className="text-right p-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.picks.map((p) => (
                          <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="p-2">{p.rank}</td>
                            <td className="p-2">{p.golferName}</td>
                            <td className="text-right p-2">{p.positionPoints}</td>
                            <td className="text-right p-2">{p.weight}</td>
                            <td className="text-right p-2 font-semibold">{p.totalPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}