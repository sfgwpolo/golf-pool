"use client";

import { useEffect, useState } from "react";

type Org = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emblemUrl: string | null;
};

type Pool = {
  id: string;
  name: string;
  year: number;
  startsAt: string;
  endedAt: string | null;
  entriesCloseAt: string;
  locked: boolean;
  isArchived: boolean;
  rulesText: string | null;
  entryCost: string | null;
  payoutText: string | null;
  status: "active" | "upcoming" | "past";
};

type OrgResponse = {
  organization: Org;
  defaultPool: Pool | null;
  activePools: Pool[];
  upcomingPools: Pool[];
  pastPools: Pool[];
};

function PoolCard({ pool, featured = false }: { pool: Pool; featured?: boolean }) {
  const isOpen = !pool.locked && new Date() < new Date(pool.entriesCloseAt);

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 10,
        background: featured ? "#fafafa" : "white",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: featured ? 22 : 18, fontWeight: 800 }}>
            {pool.year} — {pool.name}
          </div>

          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
            Starts: {new Date(pool.startsAt).toLocaleString()}
          </div>

          <div style={{ marginTop: 4, fontSize: 14, opacity: 0.8 }}>
            Entries close: {new Date(pool.entriesCloseAt).toLocaleString()}
          </div>

          {pool.endedAt && (
            <div style={{ marginTop: 4, fontSize: 14, opacity: 0.8 }}>
              Ends: {new Date(pool.endedAt).toLocaleString()}
            </div>
          )}
        </div>

        <div style={{ alignSelf: "flex-start" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #ccc",
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.85,
            }}
          >
            {pool.status.toUpperCase()}
          </span>
        </div>
      </div>

      {pool.entryCost && (
        <div style={{ marginTop: 12 }}>
          <strong>Entry cost:</strong> ${pool.entryCost}
        </div>
      )}

      {pool.payoutText && (
        <div style={{ marginTop: 8 }}>
          <strong>Payout:</strong> {pool.payoutText}
        </div>
      )}

      {pool.rulesText && (
        <div style={{ marginTop: 8 }}>
          <strong>Rules:</strong>
          <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{pool.rulesText}</div>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
        Entry status:{" "}
        {isOpen ? (
          <span style={{ color: "green", fontWeight: 700 }}>Open</span>
        ) : (
          <span style={{ color: "#999" }}>Closed</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <a
          href={`/pool/${pool.id}`}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          Create / Edit Entry
        </a>

        <a
          href={`/leaderboard/${pool.id}`}
          style={{
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 6,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          View Leaderboard
        </a>
      </div>
    </div>
  );
}

export default function OrgLandingClient({ orgSlug }: { orgSlug: string }) {
  const [data, setData] = useState<OrgResponse | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      try {
        const res = await fetch(`/api/orgs/${orgSlug}`, { cache: "no-store" });
        const text = await res.text();
        const json = text ? JSON.parse(text) : null;

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load organization");
        }

        setData(json);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    }

    load();
  }, [orgSlug]);

  if (err) {
    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <strong style={{ color: "crimson" }}>{err}</strong>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        Loading...
      </div>
    );
  }

  const { organization, defaultPool, activePools, upcomingPools, pastPools } = data;

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif", maxWidth: 960 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        {organization.emblemUrl ? (
          <img
            src={organization.emblemUrl}
            alt={`${organization.name} emblem`}
            style={{
              width: 72,
              height: 72,
              objectFit: "contain",
              borderRadius: 8,
              border: "1px solid #eee",
              padding: 4,
              background: "white",
            }}
          />
        ) : null}

        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{organization.name}</h1>
          {organization.description && (
            <div style={{ marginTop: 6, opacity: 0.8 }}>{organization.description}</div>
          )}
        </div>
      </div>

      {defaultPool && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Featured Pool</div>
          <PoolCard pool={defaultPool} featured />
        </div>
      )}

      {activePools.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Active Pools</div>
          {activePools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}

      {upcomingPools.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Upcoming Pools</div>
          {upcomingPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}

      {pastPools.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Past Pools</div>
          {pastPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} />
          ))}
        </div>
      )}

      {!defaultPool && activePools.length === 0 && upcomingPools.length === 0 && pastPools.length === 0 && (
        <div style={{ marginTop: 24, opacity: 0.75 }}>No pools available yet.</div>
      )}
    </div>
  );
}