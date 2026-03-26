import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type LeaderboardPlayer = {
  golferId: string;
  golferName: string;
  position: number;
};

function pointsForPosition(position: number) {
  if (!Number.isFinite(position) || position <= 0 || position >= 9999) return 0;

  // simple descending points model
  if (position === 1) return 100;
  if (position === 2) return 90;
  if (position === 3) return 80;
  if (position === 4) return 70;
  if (position === 5) return 60;
  if (position === 6) return 50;
  if (position === 7) return 40;
  if (position === 8) return 30;
  if (position === 9) return 20;
  if (position === 10) return 10;

  return 0;
}

function normalizeName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ poolId: string }> },
) {
  const { poolId } = await context.params;

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool)
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const latest = await prisma.tournamentSnapshot.findFirst({
    where: { poolId },
    orderBy: { fetchedAt: "desc" },
  });

  const raw = latest?.rawJson as Record<string, unknown> | null | undefined;

  const leaderboardPlayers: LeaderboardPlayer[] = Array.isArray(
    raw?.leaderboard,
  )
    ? (raw.leaderboard as LeaderboardPlayer[])
    : [];

  const pointsByGolferId = new Map<string, number>();
  const pointsByGolferName = new Map<string, number>();

  for (const p of leaderboardPlayers) {
    const points = pointsForPosition(Number(p.position));
    pointsByGolferId.set(String(p.golferId), points);
    pointsByGolferName.set(normalizeName(p.golferName), points);
  }

  const weights =
    pool.weightsJson && typeof pool.weightsJson === "object"
      ? (pool.weightsJson as Record<string, number>)
      : {};
  const weightForRank = (rank: number) => Number(weights[String(rank)] ?? 0);

  const entries = await prisma.entry.findMany({
    where: { poolId, isDeleted: false },
    orderBy: [{ isPaid: "desc" }, { entryName: "asc" }],
    select: {
      id: true,
      entryName: true,
      isPaid: true,
      createdAt: true,
      picks: {
        orderBy: { rank: "asc" },
        select: { id: true, rank: true, golferId: true, golferName: true },
      },
    },
  });

  const scored = entries.map((e) => {
    let score = 0;

    const picksWithPoints = e.picks.map((pick) => {
      const points =
        pointsByGolferId.get(String(pick.golferId)) ??
        pointsByGolferName.get(normalizeName(pick.golferName)) ??
        0;

      const weight = weightForRank(pick.rank);
      const total = points * weight;

      score += total;

      return {
        ...pick,
        positionPoints: points,
        weight,
        totalPoints: total,
      };
    });

    return {
      ...e,
      score,
      picks: picksWithPoints,
    };
  });

  // Sort by score desc, then paid desc, then name
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      Number(b.isPaid) - Number(a.isPaid) ||
      a.entryName.localeCompare(b.entryName),
  );

  return NextResponse.json({
    pool: {
      id: pool.id,
      name: pool.name,
      entriesCloseAt: pool.entriesCloseAt,
      startsAt: pool.startsAt,
      locked: pool.locked,
    },
    leaderboard: scored,
    snapshot: latest
      ? { fetchedAt: latest.fetchedAt, source: latest.source }
      : null,
  });
}
