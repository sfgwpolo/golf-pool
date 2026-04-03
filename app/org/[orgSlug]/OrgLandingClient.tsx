"use client";

import { useEffect, useState } from "react";
import { getPoolStatus } from "../../../lib/poolStatus";
import Link from "next/link"; // Add for better navigation

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

function PoolCard({
  pool,
  orgSlug,
  featured = false,
}: {
  pool: Pool;
  orgSlug: string;
  featured?: boolean;
}) {
  const status = getPoolStatus(pool);

  return (
    <div className={`mt-3 p-4 border rounded-lg ${featured ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} border-gray-300 dark:border-gray-600`}>
      <div className="flex justify-between gap-3 flex-wrap">
        <div>
          <div className={`font-bold ${featured ? 'text-2xl' : 'text-xl'}`}>
            {pool.year} — {pool.name}
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Starts: {new Date(pool.startsAt).toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Entries close: {new Date(pool.entriesCloseAt).toLocaleString()}
          </div>
          {pool.endedAt && (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Ends: {new Date(pool.endedAt).toLocaleString()}
            </div>
          )}
        </div>
        <div className="self-start">
          <span className="inline-block px-2 py-1 rounded-full border border-gray-400 dark:border-gray-500 text-xs font-bold opacity-85">
            {pool.status.toUpperCase()}
          </span>
        </div>
      </div>

      {pool.entryCost && (
        <div className="mt-3">
          <strong>Entry cost:</strong> ${pool.entryCost}
        </div>
      )}

      {pool.payoutText && (
        <div className="mt-2">
          <strong>Payout:</strong> {pool.payoutText}
        </div>
      )}

      {pool.rulesText && (
        <div className="mt-2">
          <strong>Rules:</strong>
          <div className="mt-1 whitespace-pre-wrap">
            {pool.rulesText}
          </div>
        </div>
      )}

      <div className="mt-2.5 text-sm text-gray-600 dark:text-gray-400">
        Status: <strong>{status}</strong>
      </div>

      <div className="flex gap-2.5 mt-3.5 flex-wrap">
        <Link
          href={`/pool/${pool.id}?org=${orgSlug}`}
          className="px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-md text-inherit no-underline hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Create / Edit Entry
        </Link>
        <Link
          href={`/leaderboard/${pool.id}?org=${orgSlug}`}
          className="px-3 py-2 border border-gray-400 dark:border-gray-500 rounded-md text-inherit no-underline hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          View Leaderboard
        </Link>
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
      <div className="p-5 font-sans">
        <strong className="text-red-600 dark:text-red-400">{err}</strong>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 font-sans">
        Loading...
      </div>
    );
  }

  const { organization, defaultPool, activePools, upcomingPools, pastPools } = data;

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <div className="flex gap-4 items-center flex-wrap">
        {organization.emblemUrl ? (
          <img
            src={organization.emblemUrl}
            alt={`${organization.name} emblem`}
            className="w-18 h-18 object-contain rounded-md border border-gray-300 dark:border-gray-600 p-1 bg-white dark:bg-gray-800"
          />
        ) : null}
        <div>
          <h1 className="text-3xl font-bold m-0">
            {organization.name}
          </h1>
          {organization.description && (
            <div className="mt-1.5 opacity-80">
              {organization.description}
            </div>
          )}
        </div>
      </div>

      {defaultPool && (
        <div className="mt-6">
          <div className="text-xl font-bold">Featured Pool</div>
          <PoolCard pool={defaultPool} orgSlug={organization.slug} featured />
        </div>
      )}

      {activePools.length > 0 && (
        <div className="mt-7">
          <div className="text-xl font-bold">Active Pools</div>
          {activePools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} orgSlug={organization.slug} />
          ))}
        </div>
      )}

      {upcomingPools.length > 0 && (
        <div className="mt-7">
          <div className="text-xl font-bold">Upcoming Pools</div>
          {upcomingPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} orgSlug={organization.slug} />
          ))}
        </div>
      )}

      {pastPools.length > 0 && (
        <div className="mt-7">
          <div className="text-xl font-bold">Past Pools</div>
          {pastPools.map((pool) => (
            <PoolCard key={pool.id} pool={pool} orgSlug={organization.slug} />
          ))}
        </div>
      )}

      {!defaultPool && activePools.length === 0 && upcomingPools.length === 0 && pastPools.length === 0 && (
        <div className="mt-6 opacity-75">
          No pools available yet.
        </div>
      )}
    </div>
  );
}