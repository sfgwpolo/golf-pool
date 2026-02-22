"use client";

import { useEffect, useMemo, useState } from "react";

type EntrySummary = {
  id: string;
  entryName: string;
  createdAt: string;
  isPaid: boolean;
};

type PoolInfo = {
  id: string;
  name: string;
  entriesCloseAt: string;
  locked: boolean;
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

  const isLocked = useMemo(() => {
    if (!pool) return false;
    return new Date() >= new Date(pool.entriesCloseAt) || pool.locked;
  }, [pool]);

  const isValid = useMemo(() => {
    if (!entryName || !email) return false;
    if (picks.some((p) => !p.trim())) return false;
    const normalized = picks.map((p) => p.trim().toLowerCase());
    return new Set(normalized).size === 10;
  }, [entryName, email, picks]);

  function updatePick(index: number, value: string) {
    const next = [...picks];
    next[index] = value;
    setPicks(next);
  }

  const unmatched = useMemo(() => {
    // If we don't have golfer list, don't block / warn
    if (golfers.length === 0) return [];

    const golferNameSet = new Set(
      golfers.map((g) => normalizeForMatch(g.golferName)),
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

  async function submitEntry() {
    if (!isValid || isLocked) return;

    setMessage("");
    setLoading(true);

    try {
      const payload = {
        entryName,
        email,
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
          : "Entry submitted successfully!",
      );
      setEntryName("");
      setEmail("");
      setPicks(Array(10).fill(""));
      setEditingEntryId(null);
      setFoundEntries([]);
      setEditEmail("");

      // reload list
      const reload = await fetch(`/api/pools/${poolId}/entries/list`);
      const reloadData = await reload.json();
      setEntries(reloadData.entries || []);
    } catch (e: any) {
      setMessage(e?.message || "Error submitting entry");
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

    // 1️⃣ Exact normalized match
    for (const name of golferNames) {
      if (normalizeForMatch(name) === q) return name;
    }

    // 2️⃣ Unique last-name match (e.g., "Scheffler")
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

    // 3️⃣ Unique substring match (min length 4)
    if (q.length >= 4) {
      const matches = golferNames.filter((n) =>
        normalizeForMatch(n).includes(q),
      );
      if (matches.length === 1) return matches[0];
    }

    return null;
  }

  function autocorrectPick(index: number) {
    const current = picks[index] || "";

    // Clear message if field empty
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

    // Clear message if no confident match
    if (!match) {
      setAutoFillMsg((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      return;
    }

    // If match is different, update picks + show message
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
      // Exact match typed — clear message
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
          editEmail.trim().toLowerCase(),
        )}`,
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
          .map((p: any) => p.golferName),
      );

      setMessage("Editing existing entry");
    } catch (e: any) {
      setMessage(e?.message || "Error loading entry");
    }
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 700,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>
        {pool?.name || "Golf Pool"}
      </h1>

      {pool && (
        <div style={{ marginTop: 6, opacity: 0.8 }}>
          Entries close at: {new Date(pool.entriesCloseAt).toLocaleString()}
        </div>
      )}

      {isLocked && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            background: "#ffe5e5",
            borderRadius: 6,
            fontWeight: 600,
          }}
        >
          Entries are now closed.
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Edit Existing Entry</h3>

        <input
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
          placeholder="Enter your email"
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        />

        <button
          onClick={findEntriesByEmail}
          style={{ marginTop: 8, padding: "6px 10px" }}
        >
          Find My Entries
        </button>

        {foundEntries.length > 0 && (
          <ul style={{ marginTop: 10 }}>
            {foundEntries.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => loadEntry(e.id)}
                  style={{ cursor: "pointer" }}
                >
                  {e.entryName} – {new Date(e.createdAt).toLocaleString()}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <h3>Submit Entry</h3>

        <input
          value={entryName}
          onChange={(e) => setEntryName(e.target.value)}
          placeholder="Your Name"
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        />

        <datalist id="golfer-list">
          {golfers.map((g) => (
            <option key={g.golferId} value={g.golferName} />
          ))}
        </datalist>

        {golfersInfo && (
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            Golfer list: {golfersInfo.count} players
            {golfersInfo.snapshotFetchedAt
              ? ` (from snapshot ${new Date(golfersInfo.snapshotFetchedAt).toLocaleString()})`
              : " (no snapshot yet — ask admin to Refresh Snapshot)"}
          </div>
        )}

        {picks.map((pick, i) => (
          <div key={i} style={{ marginTop: 8 }}>
            <input
              value={pick}
              onChange={(e) => updatePick(i, e.target.value)}
              onBlur={() => autocorrectPick(i)}
              placeholder={`Rank ${i + 1} golfer`}
              list="golfer-list"
              style={{ width: "100%", padding: 8 }}
            />
            {autoFillMsg[i] && (
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                {autoFillMsg[i]}
              </div>
            )}
          </div>
        ))}

        {golfers.length > 0 && unmatched.length > 0 && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              border: "1px solid #f0c36d",
              borderRadius: 6,
              background: "rgba(240,195,109,0.15)",
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              Some picks don’t match the tournament field:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {unmatched.map((u) => (
                <li key={u.idx}>
                  Rank {u.idx + 1}: “{u.raw}”
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 6, opacity: 0.85 }}>
              Tip: click into the field and choose a name from the dropdown.
            </div>
          </div>
        )}

        <button
          onClick={submitEntry}
          disabled={disableSubmit}
          style={{
            marginTop: 12,
            padding: "10px 14px",
            cursor: disableSubmit ? "not-allowed" : "pointer",
            opacity: disableSubmit ? 0.5 : 1,
          }}
        >
          {loading
            ? "Saving..."
            : editingEntryId
              ? "Save Changes"
              : "Submit Entry"}
        </button>

        {message && (
          <div style={{ marginTop: 8 }}>
            <strong>{message}</strong>
          </div>
        )}
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>Current Entries</h3>

        {entries.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No entries yet.</div>
        ) : (
          <ul>
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
