"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "../lib/http";
import Link from "next/link"; // Add this import

type Org = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  emblemUrl: string | null;
};

type OrgsResponse = {
  organizations: Org[];
};

export default function HomeClient() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchJson<OrgsResponse>("/api/orgs", {
          cache: "no-store",
        });
        setOrgs(data.organizations || []);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Error");
      }
    }

    load();
  }, []);

  if (err) {
    return (
      <div className="p-5 font-sans">
        <strong className="text-red-600 dark:text-red-400">{err}</strong>
      </div>
    );
  }

  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-3xl font-bold">Golf Pool</h1>
      <div className="mt-5">
        {orgs.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No organizations available.</p>
        ) : (
          <ul className="space-y-4">
            {orgs.map(org => (
              <Link key={org.id} href={`/org/${org.slug}`}>
                <li className="p-4 border rounded bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
                  <h2 className="text-xl font-semibold">{org.name}</h2>
                  {org.description && <p className="text-gray-700 dark:text-gray-300">{org.description}</p>}
                </li>
              </Link>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
