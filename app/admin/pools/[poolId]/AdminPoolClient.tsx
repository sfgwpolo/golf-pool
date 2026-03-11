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
  name: string;
  startsAt: string;
  entriesCloseAt: string;
  locked: boolean;
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

  useEffect(() => {
    fetchEntries();
    loadPurgeInfo();
  }, [poolId]);

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
      } catch {
        // If it's not JSON (e.g., HTML 404), we'll handle below
      }

      if (!res.ok) {
        throw new Error(
          getErrorMessageFromJson(data) || text || "Failed to load entries",
        );
      }

      // Validate-ish: ensure it's an object with pool/entries
      if (!data || typeof data !== "object") {
        throw new Error("Unexpected response (not JSON object)");
      }

      const obj = data as AdminEntriesResponse;
      if (!obj.pool?.id || !Array.isArray(obj.entries)) {
        throw new Error("Unexpected response shape from server");
      }

      setPool(obj.pool);
      setEntries(obj.entries);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
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
            ? { isPaid: true, paidAmount: 25, paidMethod: "Venmo" } // change defaults anytime
            : { isPaid: false },
        ),
      });

      const text = await res.text();

      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        throw new Error(
          getErrorMessageFromJson(data) || text || "Failed to update payment",
        );
      }
      // refresh list
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
          getErrorMessageFromJson(data) || text || "Failed to refresh snapshot",
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
        "Purge unpaid entries? (This will soft-delete them.)",
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
      } catch {
        // ignore
      }

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
      await fetchEntries(); // reload entries
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

      const obj = data as PurgeInfo;
      setPurgeInfo(obj);
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
      // optionally keep email for repeated resets:
      // setResetEmail("");
    } catch (e: unknown) {
      setResetMsg(e instanceof Error ? e.message : "Error resetting code word");
    } finally {
      setResetLoading(false);
    }
  }

  const canPurge =
    !!purgeInfo && purgeInfo.allowed && purgeInfo.unpaidCount > 0;

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin: Pool</h1>
      <div style={{ marginTop: 8, opacity: 0.8 }}>
        Pool ID: <code>{poolId}</code>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={async () => {
              await fetchEntries();
              await loadPurgeInfo();
            }}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <button
            onClick={refreshSnapshot}
            style={{
              padding: "8px 12px",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Refresh Snapshot
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: 6,
                cursor: canPurge ? "pointer" : "not-allowed",
                opacity: canPurge ? 1 : 0.5,
                width: "fit-content",
              }}
            >
              Purge unpaid{" "}
              <span style={{ opacity: 0.8 }}>
                ({purgeInfo ? purgeInfo.unpaidCount : "…"})
              </span>
            </button>

            {purgeInfo && (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Eligible when tournament starts (
                {new Date(purgeInfo.startsAt).toLocaleString()})
                {purgeInfo.locked ? " • pool is locked" : ""}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            Reset user code word
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
            Resets the per-pool code word for an email address. The old code
            word will stop working.
          </div>

          <input
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="User email (e.g., joyce@test.com)"
            style={{ width: "100%", padding: 8, marginTop: 10 }}
          />

          <input
            value={resetCode}
            onChange={(e) => setResetCode(e.target.value)}
            placeholder="New code word (4–50 characters)"
            style={{ width: "100%", padding: 8, marginTop: 8 }}
          />

          <button
            onClick={resetPasscode}
            disabled={
              resetLoading || !resetEmail.trim() || resetCode.trim().length < 4
            }
            style={{
              marginTop: 10,
              padding: "8px 12px",
              cursor:
                resetLoading ||
                !resetEmail.trim() ||
                resetCode.trim().length < 4
                  ? "not-allowed"
                  : "pointer",
              opacity:
                resetLoading ||
                !resetEmail.trim() ||
                resetCode.trim().length < 4
                  ? 0.5
                  : 1,
            }}
          >
            {resetLoading ? "Resetting…" : "Reset code word"}
          </button>

          {resetMsg && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong>{resetMsg}</strong>
            </div>
          )}
        </div>

        {pool && (
          <div style={{ marginTop: 10, fontSize: 14, opacity: 0.9 }}>
            <div>
              <strong>{pool.name}</strong>
            </div>
            <div>
              entriesCloseAt: {new Date(pool.entriesCloseAt).toLocaleString()}
            </div>
            <div>startsAt: {new Date(pool.startsAt).toLocaleString()}</div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                      data?.error || `Request failed (${res.status})`,
                    );

                  // refresh UI
                  await fetchEntries();
                  await loadPurgeInfo();
                }}
              />
              Manually lock pool (stop edits/entries)
            </label>
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
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: 8,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Paid",
                    "Entry",
                    "Email",
                    "Picks (1–10)",
                    "Created",
                    "Deleted?",
                  ].map((h) => (
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
                    <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                      {e.email}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        minWidth: 360,
                      }}
                    >
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {e.picks.map((p) => (
                          <li key={p.id} style={{ fontSize: 13 }}>
                            {p.golferName}{" "}
                            <span style={{ opacity: 0.6 }}>({p.golferId})</span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td
                      style={{
                        padding: 8,
                        borderBottom: "1px solid #eee",
                        whiteSpace: "nowrap",
                      }}
                    >
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
              Tip: the “Paid” checkbox currently defaults paidAmount=25 and
              paidMethod=Venmo when turning on. We’ll make those editable next.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
