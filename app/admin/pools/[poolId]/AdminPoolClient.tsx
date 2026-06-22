"use client";

import { useEffect, useState } from "react";

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
  orgId: string;
  name: string;
  year: number;
  tournamentKey: string;
  startsAt: string;
  entriesCloseAt: string;
  locked: boolean;
  weightsJson: unknown;
  rulesText?: string | null;
  entryCost?: string | null;
  payoutText?: string | null;
  endedAt?: string | null;
  isArchived?: boolean;
};

type AdminEntriesResponse = {
  pool: PoolInfo;
  entries: EntryRow[];
  now: string;
};

type PurgeInfo = {
  allowed: boolean;
  startsAt: string;
  locked: boolean;
  unpaidCount: number;
};

type Golfer = {
  id: string;
  name: string;
};

function formatDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatJsonForTextarea(value: unknown) {
  if (value === null || value === undefined) return "";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export default function AdminPoolClient({ poolId }: { poolId: string }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [purgeInfo, setPurgeInfo] = useState<PurgeInfo | null>(null);
  const [rulesText, setRulesText] = useState("");
  const [entryCost, setEntryCost] = useState("");
  const [payoutText, setPayoutText] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [isArchived, setIsArchived] = useState(false);
  
  // New state for pool editing
  const [poolName, setPoolName] = useState("");
  const [poolYear, setPoolYear] = useState("");
  const [poolTournamentKey, setPoolTournamentKey] = useState("");
  const [poolStartsAt, setPoolStartsAt] = useState("");
  const [poolEntriesCloseAt, setPoolEntriesCloseAt] = useState("");
  const [poolLocked, setPoolLocked] = useState(false);
  const [poolWeightsJson, setPoolWeightsJson] = useState("");
  const [poolMsg, setPoolMsg] = useState("");
  const [poolLoading, setPoolLoading] = useState(false);
  
  // New state for entry editing
  const [editingEntry, setEditingEntry] = useState<EntryRow | null>(null);
  const [availableGolfers, setAvailableGolfers] = useState<Golfer[]>([]);
  const [entryPicks, setEntryPicks] = useState<EntryPick[]>([]);
  const [entryMsg, setEntryMsg] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
    loadPurgeInfo();
  }, [poolId]);

  function syncDisplayDetailsForm(nextPool: PoolInfo) {
    setRulesText(nextPool.rulesText ?? "");
    setEntryCost(nextPool.entryCost ?? "");
    setPayoutText(nextPool.payoutText ?? "");
    setEndedAt(formatDateTimeLocal(nextPool.endedAt));
    setIsArchived(Boolean(nextPool.isArchived));
  }

  function syncPoolDataForm(nextPool: PoolInfo) {
    setPoolName(nextPool.name);
    setPoolYear(String(nextPool.year));
    setPoolTournamentKey(nextPool.tournamentKey ?? "");
    setPoolStartsAt(formatDateTimeLocal(nextPool.startsAt));
    setPoolEntriesCloseAt(formatDateTimeLocal(nextPool.entriesCloseAt));
    setPoolLocked(Boolean(nextPool.locked));
    setPoolWeightsJson(formatJsonForTextarea(nextPool.weightsJson));
    syncDisplayDetailsForm(nextPool);
    setPoolMsg("");
  }

  function clearDisplayDetailsForm() {
    setRulesText("");
    setEntryCost("");
    setPayoutText("");
    setEndedAt("");
    setIsArchived(false);
    setPoolMsg("Display fields cleared. Save to apply.");
  }

  function getErrorMessageFromJson(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const maybe = data as Record<string, unknown>;
    return typeof maybe.error === "string" ? maybe.error : null;
  }

  async function fetchEntries() {
    setErr("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/pools/${poolId}/entries`, {
        cache: "no-store",
      });

      const text = await res.text();

      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(
          getErrorMessageFromJson(data) || text || "Failed to load entries"
        );
      }

      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response (not JSON object)");
      }

      const obj = data as AdminEntriesResponse;
      if (!obj.pool?.id || !Array.isArray(obj.entries)) {
        throw new Error("Unexpected response shape from server");
      }

      setPool(obj.pool);
      syncPoolDataForm(obj.pool);
      
      setEntries(obj.entries);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function savePoolData() {
    setPoolMsg("");
    setPoolLoading(true);

    try {
      const res = await fetch(`/api/admin/pools/${poolId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: poolName,
          year: poolYear,
          tournamentKey: poolTournamentKey,
          startsAt: poolStartsAt,
          entriesCloseAt: poolEntriesCloseAt,
          locked: poolLocked,
          weightsJson: poolWeightsJson,
          rulesText,
          entryCost,
          payoutText,
          endedAt: endedAt || null,
          isArchived,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      await fetchEntries();
      await loadPurgeInfo();
      setPoolMsg("Pool data saved.");
    } catch (e: unknown) {
      setPoolMsg(
        e instanceof Error ? e.message : "Error saving pool data"
      );
    } finally {
      setPoolLoading(false);
    }
  }

  async function togglePaid(entryId: string, isPaid: boolean) {
    setErr("");
    try {
      const res = await fetch(`/api/admin/entries/${entryId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isPaid
            ? { isPaid: true, paidAmount: 25, paidMethod: "Venmo" }
            : { isPaid: false }
        ),
      });

      const text = await res.text();

      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(
          getErrorMessageFromJson(data) || text || "Failed to update payment"
        );
      }
      await fetchEntries();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function refreshSnapshot() {
    setErr("");
    try {
      const res = await fetch(`/api/admin/pools/${poolId}/refresh-snapshot`, {
        method: "POST",
      });
      const text = await res.text();

      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(
          getErrorMessageFromJson(data) || text || "Failed to refresh snapshot"
        );
      }

      const count =
        data && typeof data === "object" && "count" in data
          ? Number((data as Record<string, unknown>).count)
          : "?";

      alert(`Snapshot saved (${count} golfers).`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function purgeUnpaid() {
    setErr("");
    try {
      const ok = window.confirm(
        "Purge unpaid entries? (This will soft-delete them.)"
      );
      if (!ok) return;

      const res = await fetch(`/api/admin/pools/${poolId}/purge-unpaid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as Record<string, unknown>).error)
            : text || "Failed to purge unpaid";
        throw new Error(msg);
      }

      const purged =
        data && typeof data === "object" && "purged" in data
          ? Number((data as Record<string, unknown>).purged)
          : NaN;

      alert(`Purged ${Number.isFinite(purged) ? purged : "?"} unpaid entries.`);
      await fetchEntries();
      await loadPurgeInfo();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }

  async function loadPurgeInfo() {
    try {
      const res = await fetch(`/api/admin/pools/${poolId}/purge-unpaid-info`, {
        cache: "no-store",
      });

      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        setPurgeInfo(null);
        return;
      }

      setPurgeInfo(data as PurgeInfo);
    } catch {
      setPurgeInfo(null);
    }
  }

  async function resetPasscode() {
    setResetMsg("");
    setResetLoading(true);

    try {
      const res = await fetch(`/api/admin/pools/${poolId}/passcodes/reset`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetEmail.trim(),
          newPasscode: resetCode,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok)
        throw new Error(data?.error || `Request failed (${res.status})`);

      setResetMsg("Code word reset successfully.");
      setResetCode("");
    } catch (e: unknown) {
      setResetMsg(e instanceof Error ? e.message : "Error resetting code word");
    } finally {
      setResetLoading(false);
    }
  }

  async function loadGolfers() {
    try {
      const res = await fetch(`/api/admin/pools/${poolId}/golfers`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setAvailableGolfers(data.golfers || []);
      }
    } catch {
      setAvailableGolfers([]);
    }
  }

  function startEditingEntry(entry: EntryRow) {
    setEditingEntry(entry);
    setEntryPicks([...entry.picks]);
    setEntryMsg("");
    loadGolfers();
  }

  function updatePick(rank: number, golferId: string, golferName: string) {
    setEntryPicks(prev => 
      prev.map(p => p.rank === rank ? { ...p, golferId, golferName } : p)
    );
  }

  async function saveEntryPicks() {
    if (!editingEntry) return;
    
    setEntryMsg("");
    setEntryLoading(true);

    try {
      const res = await fetch(`/api/admin/entries/${editingEntry.id}/picks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          picks: entryPicks.map((p) => ({
            rank: p.rank,
            golferId: p.golferId,
            golferName: p.golferName,
          })),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setEntryMsg("Entry picks updated.");
      setEditingEntry(null);
      await fetchEntries();
    } catch (e: unknown) {
      setEntryMsg(
        e instanceof Error ? e.message : "Error saving entry picks"
      );
    } finally {
      setEntryLoading(false);
    }
  }

  const canPurge =
    !!purgeInfo && purgeInfo.allowed && purgeInfo.unpaidCount > 0;

  return (
    <div className="mt-3 bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl font-bold">Admin: Pool</h1>
      <div className="mt-2 opacity-80 text-sm">
        Pool ID: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{poolId}</code>
      </div>

      <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={async () => {
              await fetchEntries();
              await loadPurgeInfo();
            }}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded"
          >
            Refresh
          </button>

          <button
            onClick={refreshSnapshot}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded"
          >
            Refresh Snapshot
          </button>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={purgeUnpaid}
              disabled={!canPurge}
              title={
                !purgeInfo
                  ? "Loading…"
                  : !purgeInfo.allowed
                    ? `Disabled until tournament starts (${new Date(purgeInfo.startsAt).toLocaleString()}) or the pool is manually locked`
                    : purgeInfo.unpaidCount === 0
                      ? "No unpaid entries to remove"
                      : "Soft-delete unpaid entries"
              }
              className="px-3 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Purge unpaid{" "}
              <span className="opacity-80">
                ({purgeInfo ? purgeInfo.unpaidCount : "…"})
              </span>
            </button>

            {purgeInfo && (
              <div className="text-xs opacity-75">
                Eligible when tournament starts (
                {new Date(purgeInfo.startsAt).toLocaleString()})
                {purgeInfo.locked ? " • pool is locked" : ""}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
          <div className="font-bold">Reset user code word</div>
          <div className="text-xs opacity-75 mt-1">
            Resets the per-pool code word for an email address. The old code
            word will stop working.
          </div>

          <input
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="User email (e.g., joyce@test.com)"
            className="w-full p-2 mt-2.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />

          <input
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            placeholder="New code word (4–50 characters)"
            className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          />

          <button
            onClick={resetPasscode}
            disabled={
              resetLoading || !resetEmail.trim() || resetCode.trim().length < 4
            }
            className="mt-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {resetLoading ? "Resetting…" : "Reset code word"}
          </button>

          {resetMsg && (
            <div className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
              {resetMsg}
            </div>
          )}
        </div>

        {pool && (
          <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div>
              <strong>{pool.name}</strong>
            </div>
            <div className="text-sm">
              entriesCloseAt: {new Date(pool.entriesCloseAt).toLocaleString()}
            </div>
            <div className="text-sm">
              startsAt: {new Date(pool.startsAt).toLocaleString()}
            </div>
            <label className="flex gap-2 items-center mt-2">
              <input
                type="checkbox"
                checked={pool.locked}
                onChange={async (e) => {
                  const res = await fetch(`/api/admin/pools/${pool.id}/lock`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ locked: e.target.checked }),
                  });

                  const text = await res.text();
                  const data = text ? JSON.parse(text) : null;
                  if (!res.ok)
                    throw new Error(
                      data?.error || `Request failed (${res.status})`
                    );

                  await fetchEntries();
                  await loadPurgeInfo();
                }}
              />
              <span className="text-sm">Manually lock pool (stop edits/entries)</span>
            </label>
          </div>
        )}

        {pool && (
          <div className="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
            <div className="font-bold">Edit pool data</div>

            <label className="block mt-2.5">
              <span className="text-xs opacity-80">Pool name</span>
              <input
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="Pool name"
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <label className="block mt-2">
              <span className="text-xs opacity-80">Year</span>
              <input
                value={poolYear}
                onChange={(e) => setPoolYear(e.target.value)}
                placeholder="Year"
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <label className="block mt-2">
              <span className="text-xs opacity-80">Tournament key</span>
              <input
                value={poolTournamentKey}
                onChange={(e) => setPoolTournamentKey(e.target.value)}
                placeholder="Tournament key (e.g. R2026005)"
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <div className="mt-2 text-xs opacity-80">Starts at</div>
            <input
              type="datetime-local"
              value={poolStartsAt}
              onChange={(e) => setPoolStartsAt(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
            />

            <div className="mt-2 text-xs opacity-80">Entries close at</div>
            <input
              type="datetime-local"
              value={poolEntriesCloseAt}
              onChange={(e) => setPoolEntriesCloseAt(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
            />

            <div className="mt-2 text-xs opacity-80">Ended at (optional)</div>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
            />

            <label className="block mt-2">
              <span className="text-xs opacity-80">Rules text</span>
              <textarea
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
                placeholder="Rules text"
                rows={5}
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <label className="block mt-2">
              <span className="text-xs opacity-80">Entry cost</span>
              <input
                value={entryCost}
                onChange={(e) => setEntryCost(e.target.value)}
                placeholder="Entry cost (e.g. 25)"
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <label className="block mt-2">
              <span className="text-xs opacity-80">Payout text</span>
              <input
                value={payoutText}
                onChange={(e) => setPayoutText(e.target.value)}
                placeholder="Payout text (e.g. 1st: 50%, 2nd: 30%, 3rd: 20%)"
                className="w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
              />
            </label>

            <div className="mt-2 text-xs opacity-80">Scoring weights JSON</div>
            <textarea
              value={poolWeightsJson}
              onChange={(e) => setPoolWeightsJson(e.target.value)}
              rows={7}
              spellCheck={false}
              className="font-mono text-xs w-full p-2 mt-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
            />

            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={poolLocked}
                  onChange={(e) => setPoolLocked(e.target.checked)}
                />
                <span className="text-sm">Manually lock pool</span>
              </label>

              <label className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                />
                <span className="text-sm">Archive this pool</span>
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={savePoolData}
              disabled={poolLoading}
              className="px-3 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {poolLoading ? "Saving..." : "Save pool data"}
            </button>

              <button
                type="button"
                onClick={() => syncPoolDataForm(pool)}
                disabled={poolLoading}
                className="px-3 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Restore saved values
              </button>

              <button
                type="button"
                onClick={clearDisplayDetailsForm}
                disabled={poolLoading}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Clear display fields
              </button>
            </div>

            {poolMsg && (
              <div className="mt-2 text-xs font-semibold text-green-600 dark:text-green-400">
                {poolMsg}
              </div>
            )}
          </div>
        )}

        {err && (
          <div className="mt-4 text-red-600 dark:text-red-400 font-semibold">
            <strong>Error:</strong> {err}
          </div>
        )}
      </div>

      {/* Entry editing modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Edit Entry: {editingEntry.entryName}</h3>
            
            <div className="space-y-3">
              {entryPicks.map((pick) => (
                <div key={pick.rank} className="flex gap-3 items-center">
                  <span className="w-8 font-semibold">#{pick.rank}</span>
                  <select
                    value={pick.golferId}
                    onChange={(e) => {
                      const golfer = availableGolfers.find(g => g.id === e.target.value);
                      if (golfer) updatePick(pick.rank, golfer.id, golfer.name);
                    }}
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
                  >
                    <option value="">Select golfer...</option>
                    {availableGolfers.map((golfer) => (
                      <option key={golfer.id} value={golfer.id}>
                        {golfer.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={saveEntryPicks}
                disabled={entryLoading}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50"
              >
                {entryLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            </div>

            {entryMsg && (
              <div className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">
                {entryMsg}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div>Loading…</div>
        ) : entries.length === 0 ? (
          <div className="opacity-80 text-sm">No entries loaded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  {[
                    "Paid",
                    "Entry",
                    "Email",
                    "Picks (1–10)",
                    "Created",
                    "Deleted?",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left p-2 border-b border-gray-300 dark:border-gray-600 whitespace-nowrap font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-200 dark:border-gray-700 ${
                      e.isDeleted ? "opacity-45" : ""
                    }`}
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={e.isPaid}
                        disabled={e.isDeleted}
                        onChange={(ev) => togglePaid(e.id, ev.target.checked)}
                      />
                      <div className="text-xs opacity-80">
                        {e.isPaid ? "Paid" : "Unpaid"}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="font-semibold">{e.entryName}</div>
                      <div className="text-xs opacity-70">
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{e.id}</code>
                      </div>
                    </td>
                    <td className="p-2 text-xs">{e.email}</td>
                    <td className="p-2 min-w-96">
                      <ol className="m-0 pl-4.5 text-xs space-y-0.5">
                        {e.picks.map((p) => (
                          <li key={p.id}>
                            {p.golferName}{" "}
                            <span className="opacity-60">({p.golferId})</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td className="p-2 text-xs whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 text-xs">
                      {e.isDeleted ? "Yes" : "No"}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => startEditingEntry(e)}
                        disabled={e.isDeleted}
                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs rounded disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-2.5 text-xs opacity-75">
              Tip: the &quot;Paid&quot; checkbox currently defaults paidAmount=25 and
              paidMethod=Venmo when turning on. We&apos;ll make those editable next.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
