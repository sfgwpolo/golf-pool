"use client";

import { useEffect, useMemo, useState } from "react";
import { getPoolStatus } from "../../../lib/poolStatus";

type EntrySummary = {
  id: string;
  entryName: string;
  createdAt: string;
  isPaid: boolean;
};

type PoolInfo = {
  id: string;
  name: string;
  entryCost: string | null;
  entriesCloseAt: string;
  startsAt: string;
  locked?: boolean;
  endedAt?: string | null;
  isArchived?: boolean;
};

type Golfer = { golferId: string; golferName: string };

export default function PublicPoolClient({ poolId }: { poolId: string }) {
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [entryName, setEntryName] = useState("");
  const [email, setEmail] = useState("");
  const [picks, setPicks] = useState<string[]>(Array(10).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [golfersInfo, setGolfersInfo] = useState<{
    count: number;
    snapshotFetchedAt: string | null;
  } | null>(null);

  const [autoFillMsg, setAutoFillMsg] = useState<Record<number, string>>({});
  const [editEmail, setEditEmail] = useState("");
  const [foundEntries, setFoundEntries] = useState<EntrySummary[]>([]);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    loadPoolPageData();
  }, [poolId]);

  useEffect(() => {
    fetch(`/api/pools/${poolId}/golfers`)
      .then((res) => res.json())
      .then((data) => {
        setGolfers(Array.isArray(data.golfers) ? data.golfers : []);
        setGolfersInfo({
          count: data.count ?? 0,
          snapshotFetchedAt: data.snapshotFetchedAt ?? null,
        });
      })
      .catch(() => {
        setGolfers([]);
        setGolfersInfo({ count: 0, snapshotFetchedAt: null });
      });
  }, [poolId]);

  const status = pool ? getPoolStatus(pool) : null;
  const isEditable = status === "Open" || status === "Not Started";
  const isLocked =
    status === "Closed" || status === "Locked" || status === "Final";

  const isValid = useMemo(() => {
    if (!entryName || !email) return false;
    if (picks.some((p) => !p.trim())) return false;
    if (!passcode.trim()) return false;
    const normalized = picks.map((p) => p.trim().toLowerCase());
    return new Set(normalized).size === 10;
  }, [entryName, email, picks, passcode]);

  const paidEntries = entries.filter((e) => e.isPaid).length;
  const entryCost = Number(pool?.entryCost ?? 0);
  const pot = paidEntries * entryCost;

  function updatePick(index: number, value: string) {
    const next = [...picks];
    next[index] = value;
    setPicks(next);
  }

  function payoutBreakdown(pot: number) {
    return {
      first: pot * 0.6,
      second: pot * 0.3,
      third: pot * 0.1,
    };
  }

  const payout = payoutBreakdown(pot);

  const unmatched = useMemo(() => {
    if (golfers.length === 0) return [];

    const golferNameSet = new Set(
      golfers.map((g) => normalizeForMatch(g.golferName))
    );

    return picks
      .map((p, idx) => ({ idx, raw: p, norm: normalizeForMatch(p) }))
      .filter((x) => x.raw.trim().length > 0 && !golferNameSet.has(x.norm));
  }, [golfers, picks]);

  const disableSubmit =
    !isValid ||
    isLocked ||
    loading ||
    (golfers.length > 0 && unmatched.length > 0);

  async function loadPoolPageData() {
    try {
      const [poolRes, entriesRes] = await Promise.all([
        fetch(`/api/pools/${poolId}`, { cache: "no-store" }),
        fetch(`/api/pools/${poolId}/entries/list`, { cache: "no-store" }),
      ]);

      const poolText = await poolRes.text();
      const poolData = poolText ? JSON.parse(poolText) : null;
      if (!poolRes.ok) {
        throw new Error(poolData?.error || "Failed to load pool");
      }

      const entriesText = await entriesRes.text();
      const entriesData = entriesText ? JSON.parse(entriesText) : null;
      if (!entriesRes.ok) {
        throw new Error(entriesData?.error || "Failed to load entries");
      }

      setPool(poolData.pool ?? null);
      setEntries(entriesData.entries ?? []);
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Error loading pool");
    }
  }

  async function submitEntry() {
    if (!isValid || isLocked) return;

    setMessage("");
    setLoading(true);

    try {
      const payload = {
        entryName,
        email,
        passcode,
        picks: picks.map((name, i) => ({
          rank: i + 1,
          golferId: normalizeForMatch(name).replace(/\s+/g, "-"),
          golferName: name.trim(),
        })),
      };

      const endpoint = editingEntryId
        ? `/api/pools/${poolId}/entries/${editingEntryId}`
        : `/api/pools/${poolId}/entries`;

      const method = editingEntryId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(data?.error || "Submission failed");

      setMessage(
        editingEntryId
          ? "Entry updated successfully!"
          : "Entry submitted successfully!"
      );
      setEntryName("");
      setEmail("");
      setPasscode("");
      setPicks(Array(10).fill(""));
      setEditingEntryId(null);
      setFoundEntries([]);
      setEditEmail("");

      await loadPoolPageData();
    } catch (e: unknown) {
      setMessage((e as Error)?.message || "Error submitting entry");
    } finally {
      setLoading(false);
    }
  }

  function normalizeForMatch(s: string) {
    return s
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function bestGolferNameMatch(input: string, golferNames: string[]) {
    const q = normalizeForMatch(input);
    if (!q) return null;

    for (const name of golferNames) {
      if (normalizeForMatch(name) === q) return name;
    }

    const tokens = q.split(" ").filter(Boolean);
    if (tokens.length === 1) {
      const t = tokens[0];
      const matches = golferNames.filter((n) => {
        const nn = normalizeForMatch(n);
        const parts = nn.split(" ");
        const last = parts[parts.length - 1];
        return last === t;
      });
      if (matches.length === 1) return matches[0];
    }

    if (q.length >= 4) {
      const matches = golferNames.filter((n) =>
        normalizeForMatch(n).includes(q)
      );
      if (matches.length === 1) return matches[0];
    }

    return null;
  }

  function autocorrectPick(index: number) {
    const current = picks[index] || "";

    if (!current.trim()) {
      setAutoFillMsg((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    const golferNames = golfers.map((g) => g.golferName);
    const match = bestGolferNameMatch(current, golferNames);

    if (!match) {
      setAutoFillMsg((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    if (match !== current) {
      setPicks((prev) => {
        const next = [...prev];
        next[index] = match;
        return next;
      });

      setAutoFillMsg((prev) => ({
        ...prev,
        [index]: `Auto-filled to: ${match}`,
      }));
    } else {
      setAutoFillMsg((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  }

  async function findEntriesByEmail() {
    if (!editEmail.trim()) return;

    try {
      const res = await fetch(
        `/api/pools/${poolId}/entries/by-email?email=${encodeURIComponent(
          editEmail.trim().toLowerCase()
        )}`
      );
      const data = await res.json();
      setFoundEntries(data.entries || []);
    } catch {
      setFoundEntries([]);
    }
  }

  async function loadEntry(entryId: string) {
    try {
      const res = await fetch(`/api/pools/${poolId}/entries/${entryId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load entry");

      setEditingEntryId(entryId);
      setEntryName(data.entry.entryName);
      setEmail(data.entry.email);
      setPicks(
        data.entry.picks
          .sort((a: any, b: any) => a.rank - b.rank)
          .map((p: any) => p.golferName)
      );

      setMessage("Editing existing entry");
    } catch (e: unknown) {
      setMessage((e as Error)?.message || "Error loading entry");
    }
  }

  function statusColor(status: string | null) {
    if (!status) return "text-gray-600 dark:text-gray-400";
    if (status === "Open") return "text-green-600 dark:text-green-400 font-bold";
    if (status === "Closed" || status === "Locked")
      return "text-red-600 dark:text-red-400 font-bold";
    if (status === "Final") return "text-gray-600 dark:text-gray-400";
    return "text-gray-600 dark:text-gray-400";
  }

  return (
    <div className="p-5 font-sans max-w-2xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl font-bold">
        {pool?.name || "Golf Pool"}
      </h1>

      <div className="mt-2 font-semibold">
        Status: <span className={statusColor(status)}>{status}</span>
      </div>

      {pool && entryCost > 0 && (
        <div className="mt-3">
          <div>
            <strong>Entry Cost:</strong> ${entryCost}
          </div>
          <div>
            <strong>Paid Entries:</strong> {paidEntries}
          </div>
          <div>
            <strong>Total Pot:</strong> ${pot}
          </div>
        </div>
      )}

      <div className="mt-2.5">
        <div>🥇 1st: ${payout.first.toFixed(0)}</div>
        <div>🥈 2nd: ${payout.second.toFixed(0)}</div>
        <div>🥉 3rd: ${payout.third.toFixed(0)}</div>
      </div>

      {pool && (
        <div className="mt-1.5 opacity-80 text-sm">
          Entries close at: {new Date(pool.entriesCloseAt).toLocaleString()}
        </div>
      )}

      {pool && !isEditable && (
        <div className="mt-3 p-2.5 bg-red-100 dark:bg-red-900 rounded-md font-semibold text-red-800 dark:text-red-200">
          {status === "Closed" && "Entries are now closed."}
          {status === "Locked" && "This pool has been locked."}
          {status === "Final" && "This pool is complete."}
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-lg font-bold">Edit Existing Entry</h3>

        <input
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white"
        />

        <button
          onClick={findEntriesByEmail}
          disabled={!isEditable}
          className="mt-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Find My Entries
        </button>

        {foundEntries.length > 0 && (
          <ul className="mt-2.5 space-y-1">
            {foundEntries.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => loadEntry(e.id)}
                  disabled={!isEditable}
                  className="text-blue-500 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {e.entryName} – {new Date(e.createdAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-bold">Submit Entry</h3>

        <input
          disabled={!isEditable}
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="Your Name"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white disabled:opacity-50"
        />

        <input
          disabled={!isEditable}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white disabled:opacity-50"
        />

        <input
          disabled={!isEditable}
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Code word (to edit later)"
          className="w-full p-2 mt-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white disabled:opacity-50"
        />

        <datalist id="golfer-list">
          {golfers.map((g) => (
            <option key={g.golferId} value={g.golferName} />
          ))}
        </datalist>

        {golfersInfo && (
          <div className="mt-2.5 text-xs opacity-75">
            Golfer list: {golfersInfo.count} players
            {golfersInfo.snapshotFetchedAt
              ? ` (from snapshot ${new Date(golfersInfo.snapshotFetchedAt).toLocaleString()})`
              : " (no snapshot yet — ask admin to Refresh Snapshot)"}
          </div>
        )}

        {picks.map((pick, i) => (
          <div key={i} className="mt-2">
            <input
              disabled={!isEditable}
              value={pick}
              onChange={(e) => updatePick(i, e.target.value)}
              onBlur={() => autocorrectPick(i)}
              placeholder={`Rank ${i + 1} golfer`}
              list="golfer-list"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white disabled:opacity-50"
            />
            {autoFillMsg[i] && (
              <div className="text-xs opacity-75 mt-1">
                {autoFillMsg[i]}
              </div>
            )}
          </div>
        ))}

        {golfers.length > 0 && unmatched.length > 0 && (
          <div className="mt-3 p-2.5 border border-amber-400 dark:border-amber-600 rounded bg-amber-50 dark:bg-amber-900 dark:bg-opacity-30 text-sm">
            <div className="font-semibold mb-1.5">
              Some picks don't match the tournament field:
            </div>
            <ul className="m-0 pl-4.5 space-y-0.5">
              {unmatched.map((u) => (
                <li key={u.idx}>
                  Rank {u.idx + 1}: "{u.raw}"
                </li>
              ))}
            </ul>
            <div className="mt-1.5 opacity-85">
              Tip: click into the field and choose a name from the dropdown.
            </div>
          </div>
        )}

        <button
          onClick={submitEntry}
          disabled={disableSubmit || !isEditable}
          className="mt-3 px-3.5 py-2.5 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading
            ? "Saving..."
            : editingEntryId
              ? "Save Changes"
              : "Submit Entry"}
        </button>

        {message && (
          <div className="mt-2">
            <strong className="text-blue-600 dark:text-blue-400">{message}</strong>
          </div>
        )}
      </div>

      <div className="mt-7.5">
        <h3 className="text-lg font-bold">Current Entries</h3>

        {entries.length === 0 ? (
          <div className="opacity-70">No entries yet.</div>
        ) : (
          <ul className="mt-2 space-y-1">
            {entries.map((e) => (
              <li key={e.id}>
                {e.entryName} {e.isPaid ? "✓ Paid" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}