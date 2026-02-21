import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  const { poolId } = await context.params;

  const latest = await prisma.tournamentSnapshot.findFirst({
    where: { poolId },
    orderBy: { fetchedAt: "desc" },
  });

  const raw = (latest?.rawJson as any) ?? {};
  const leaderboard = raw?.leaderboard ?? [];

  const golfers = Array.isArray(leaderboard)
    ? leaderboard
        .map((g: any) => ({
          golferId: String(g?.golferId ?? ""),
          golferName: String(g?.golferName ?? ""),
        }))
        .filter((g: any) => g.golferId && g.golferName)
    : [];

  // de-dupe by golferId
  const seen = new Set<string>();
  const unique = golfers.filter((g: any) => {
    if (seen.has(g.golferId)) return false;
    seen.add(g.golferId);
    return true;
  });

  // sort alphabetically
  unique.sort((a: any, b: any) => a.golferName.localeCompare(b.golferName));

  return NextResponse.json({
    golfers: unique,
    snapshotFetchedAt: latest?.fetchedAt ?? null,
    count: unique.length,
  });
}
