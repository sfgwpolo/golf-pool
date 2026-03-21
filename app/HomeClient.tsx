"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "../lib/http";

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
      <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
        <strong style={{ color: "crimson" }}>{err}</strong>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif", maxWidth: 960 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Golf Pools</h1>

      <div style={{ marginTop: 20 }}>
        {orgs.length === 0 ? (
          <div style={{ opacity: 0.75 }}>No organizations available yet.</div>
        ) : (
          orgs.map((org) => (
            <a
              key={org.id}
              href={`/org/${org.slug}`}
              style={{
                display: "block",
                marginTop: 12,
                padding: 16,
                border: "1px solid #ddd",
                borderRadius: 10,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {org.emblemUrl ? (
                  <img
                    src={org.emblemUrl}
                    alt={`${org.name} emblem`}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "contain",
                      borderRadius: 8,
                      border: "1px solid #eee",
                      padding: 4,
                      background: "white",
                    }}
                  />
                ) : null}

                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{org.name}</div>
                  {org.description && (
                    <div style={{ marginTop: 4, opacity: 0.8 }}>{org.description}</div>
                  )}
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
