export async function fetchTournamentMeta(ids: string[]) {
  const url = process.env.PGA_ORCH_URL!;
  const apiKey = process.env.PGA_ORCH_API_KEY!;
  if (!url || !apiKey) throw new Error("Missing PGA_ORCH_URL or PGA_ORCH_API_KEY in .env");

  const body = {
    operationName: "Tournaments",
    variables: { ids },
    query: `query Tournaments($ids: [ID!]) {
      tournaments(ids: $ids) {
        id
        tournamentName
        seasonYear
        events { id eventName leaderboardId }
      }
    }`,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-api-key": apiKey,
      "x-pgat-platform": "web",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}

  if (!res.ok) throw new Error(`Orchestrator HTTP ${res.status}: ${text.slice(0, 300)}`);
  if (json?.errors?.length) throw new Error(json.errors[0]?.message ?? "GraphQL error");

  const t = json?.data?.tournaments?.[0];
  if (!t) throw new Error("No tournament returned for ids");

  // Choose the first event that has a leaderboardId
  const event = (t.events ?? []).find((e: any) => e?.leaderboardId);
  if (!event?.leaderboardId) {
    throw new Error("No leaderboardId found in tournament events.");
  }

  return {
    tournamentId: t.id,
    tournamentName: t.tournamentName,
    seasonYear: t.seasonYear,
    eventId: event.id,
    eventName: event.eventName,
    leaderboardId: event.leaderboardId,
  };
}
