import zlib from "node:zlib";

export type LeaderboardPlayer = {
  golferId: string; // normalized name (matches your manual entry ids)
  golferName: string;
  position: number;
  earnings: number; // if not present in payload, 0 (we can later switch to strokes)
};

function firstDefined<T>(...values: T[]): T | undefined {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function normalizeId(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

function decodePayloadToJson(payload: string): any {
  // payload is typically base64-encoded compressed JSON
  const buf = Buffer.from(payload, "base64");

  // Try common compressors
  let out: Buffer;
  try {
    out = zlib.gunzipSync(buf);
  } catch {
    try {
      out = zlib.inflateSync(buf);
    } catch {
      out = zlib.inflateRawSync(buf);
    }
  }

  const text = out.toString("utf8");
  return JSON.parse(text);
}

function findPlayers(decoded: any): any[] {
  return (
    decoded?.leaderboard?.players ??
    decoded?.leaderboard?.rows ??
    decoded?.leaderboard?.playerStandings ??
    decoded?.players ??
    decoded?.rows ??
    decoded?.playerStandings ??
    decoded?.data?.leaderboard?.players ??
    decoded?.data?.leaderboard?.rows ??
    decoded?.data?.leaderboard?.playerStandings ??
    []
  );
}

function parsePosition(v: unknown): number {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 9999;
}

function parseMoney(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetch PGA leaderboard via orchestrator LeaderboardCompressedV3 query.
 * Works on your network because it avoids statdata/microservice domains.
 */
export async function fetchPgaTourLeaderboard(
  leaderboardCompressedV3Id: string,
): Promise<LeaderboardPlayer[]> {
  const url = process.env.PGA_ORCH_URL;
  const apiKey = process.env.PGA_ORCH_API_KEY;
  if (!url || !apiKey)
    throw new Error("Missing PGA_ORCH_URL or PGA_ORCH_API_KEY in .env");

  const body = {
    operationName: "LeaderboardCompressedV3",
    variables: { leaderboardCompressedV3Id },
    query:
      "query LeaderboardCompressedV3($leaderboardCompressedV3Id: ID!) { leaderboardCompressedV3(id: $leaderboardCompressedV3Id) { id payload } }",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-api-key": apiKey,
      "x-pgat-platform": "web",
      // These aren’t strictly required but help keep parity with browser requests
      origin: "https://www.pgatour.com",
      referer: "https://www.pgatour.com/",
    } as any,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  if (!res.ok)
    throw new Error(`Orchestrator HTTP ${res.status}: ${text.slice(0, 400)}`);
  if (json?.errors?.length)
    throw new Error(`GraphQL error: ${json.errors[0]?.message ?? "Unknown"}`);

  const payload = json?.data?.leaderboardCompressedV3?.payload;
  if (!payload || typeof payload !== "string" || payload.length === 0) {
    const keys = Object.keys(json?.data ?? {});
    throw new Error(`No payload returned. data keys: ${keys.join(", ")}`);
  }

  const decoded = decodePayloadToJson(payload);

  const players = findPlayers(decoded);
  if (!Array.isArray(players) || players.length === 0) {
    // This tells us how the payload is shaped if it changed
    const topKeys = Object.keys(decoded ?? {});
    throw new Error(
      `Decoded payload but players array not found. Top keys: ${topKeys.join(", ")}`,
    );
  }

  // Map to your app’s format
  const mapped = players
    .map((p: any) => {
      const name =
        firstDefined(
          p?.playerName,
          p?.player?.displayName,
          p?.player?.name,
          p?.name,
          [p?.player?.firstName, p?.player?.lastName].filter(Boolean).join(" "),
        ) ?? "";

      if (!name) return null;

      const position = parsePosition(
        firstDefined(
          p?.position,
          p?.currentPosition,
          p?.rank,
          p?.pos,
          p?.place,
          p?.positionDisplay,
          p?.displayPosition,
          p?.status?.position,
          p?.playerStanding?.position,
          p?.playerStanding?.displayPosition,
          p?.scoringData?.position,
        ),
      );

      const earnings = parseMoney(
        firstDefined(
          p?.earnings,
          p?.money,
          p?.officialMoney,
          p?.projectedEarnings,
          p?.prizeMoney,
          p?.purse,
          p?.scoringData?.earnings,
          p?.scoringData?.money,
        ) ?? 0,
      );

      return {
        golferId: normalizeId(name),
        golferName: name,
        position,
        earnings,
      };
    })
    .filter(Boolean) as LeaderboardPlayer[];

  const usablePositions = mapped.filter((p) => p.position !== 9999).length;
  if (mapped.length > 0 && usablePositions === 0) {
    console.warn("PGA provider parsed players but found no usable positions.");
  }

  return mapped;
}
