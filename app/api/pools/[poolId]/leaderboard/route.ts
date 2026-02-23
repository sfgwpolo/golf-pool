import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

type LeaderboardPlayer = {
  golferId: string;
  golferName: string;
  position: number;
  earnings: number;
};

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

  const leaderboardPlayers: LeaderboardPlayer[] =
    (latest?.rawJson as any)?.leaderboard ?? [];

  // Map golferId -> earnings (placeholder scoring input)
  const earningsByGolferId = new Map<string, number>();
  for (const p of leaderboardPlayers)
    earningsByGolferId.set(p.golferId, p.earnings ?? 0);

  const weights = (pool.weightsJson as any) ?? {};
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
    for (const pick of e.picks) {
      const earnings = earningsByGolferId.get(pick.golferId) ?? 0;
      score += earnings * weightForRank(pick.rank);
    }
    return { ...e, score };
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
