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

  const [newPoolOrgId, setNewPoolOrgId] = useState("");
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolYear, setNewPoolYear] = useState(
    String(new Date().getFullYear())
  );
  const [newTournamentKey, setNewTournamentKey] = useState("");
  const [newStartsAt, setNewStartsAt] = useState("");
  const [newEntriesCloseAt, setNewEntriesCloseAt] = useState("");
  const [newEndedAt, setNewEndedAt] = useState("");
  const [newRulesText, setNewRulesText] = useState("");
  const [newEntryCost, setNewEntryCost] = useState("");
  const [newPayoutText, setNewPayoutText] = useState("");

  async function createPool() {
    setMsg("");
    try {
      const res = await fetch("/api/admin/pools/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: newPoolOrgId,
          name: newPoolName,
          year: Number(newPoolYear),
          tournamentKey: newTournamentKey,
          startsAt: newStartsAt,
          entriesCloseAt: newEntriesCloseAt,
          endedAt: newEndedAt || null,
          rulesText: newRulesText,
          entryCost: newEntryCost,
          payoutText: newPayoutText,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setMsg("Pool created.");
      setNewPoolName("");
      setNewTournamentKey("");
      setNewStartsAt("");
      setNewEntriesCloseAt("");
      setNewEndedAt("");
      setNewRulesText("");
      setNewEntryCost("");
      setNewPayoutText("");

      await load();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      const meRes = await fetch("/api/admin/me", { cache: "no-store" });
      const meData = await meRes.json();
      if (!meRes.ok) throw new Error(meData?.error || "Not logged in");

      setMe(meData.me);
      setOrgs(meData.organizations || []);

      const orgList: Org[] = meData.organizations || [];
      const results = await Promise.all(
        orgList.map(async (o) => {
          const res = await fetch(`/api/admin/organizations/${o.id}/pools`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (!res.ok)
            throw new Error(
              data?.error || `Failed to load pools for ${o.name}`
            );
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
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl font-bold">Admin Home</h1>

      <div className="flex justify-between gap-3 items-center flex-wrap mt-4">
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {msg && (
        <div className="mt-3 text-red-600 dark:text-red-400 font-semibold">
          {msg}
        </div>
      )}

      <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="text-lg font-bold">Create pool</div>

        <select
          value={newPoolOrgId}
          onChange={(e) => setNewPoolOrgId(e.target.value)}
          className="w-full p-2 mt-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        >
          <option value="">Select organization…</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </option>
          ))}
        </select>

        <input
          value={newPoolName}
          onChange={(e) => setNewPoolName(e.target.value)}
          placeholder="Pool name"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newPoolYear}
          onChange={(e) => setNewPoolYear(e.target.value)}
          placeholder="Year"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newTournamentKey}
          onChange={(e) => setNewTournamentKey(e.target.value)}
          placeholder="Tournament key (e.g. current)"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <div className="mt-2 text-xs opacity-80">Starts at</div>
        <input
          type="datetime-local"
          value={newStartsAt}
          onChange={(e) => setNewStartsAt(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <div className="mt-2 text-xs opacity-80">Entries close at</div>
        <input
          type="datetime-local"
          value={newEntriesCloseAt}
          onChange={(e) => setNewEntriesCloseAt(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <div className="mt-2 text-xs opacity-80">Ended at (optional)</div>
        <input
          type="datetime-local"
          value={newEndedAt}
          onChange={(e) => setNewEndedAt(e.target.value)}
          className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <textarea
          value={newRulesText}
          onChange={(e) => setNewRulesText(e.target.value)}
          placeholder="Rules text"
          rows={4}
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newEntryCost}
          onChange={(e) => setNewEntryCost(e.target.value)}
          placeholder="Entry cost"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <input
          value={newPayoutText}
          onChange={(e) => setNewPayoutText(e.target.value)}
          placeholder="Payout text"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
        />

        <button
          onClick={createPool}
          disabled={
            !newPoolOrgId ||
            !newPoolName.trim() ||
            !newPoolYear.trim() ||
            !newTournamentKey.trim() ||
            !newStartsAt ||
            !newEntriesCloseAt
          }
          className="mt-2.5 px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Create pool
        </button>
      </div>

      <div className="mt-4">
        {orgs.length === 0 ? (
          <div className="opacity-70">No organizations available.</div>
        ) : (
          orgs.map((o) => (
            <div
              key={o.id}
              className="mt-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="text-lg font-bold">
                {o.name}{" "}
                <span className="opacity-60 text-xs">({o.slug})</span>
              </div>

              <div className="mt-2 font-bold">Pools</div>

              {(poolsByOrg[o.id] || []).length === 0 ? (
                <div className="mt-1.5 opacity-70">No pools yet.</div>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {(poolsByOrg[o.id] || []).map((p) => (
                    <li key={p.id} className="text-sm">
                      <a
                        href={`/admin/pools/${p.id}`}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {p.year} — {p.name}
                      </a>{" "}
                      <span className="opacity-75 text-xs">
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