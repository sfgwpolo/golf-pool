import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

type GolferRaw = {
  golferId?: string | number;
  golferName?: string;
};

type Golfer = {
  id: string;
  name: string;
};

type TournamentSnapshotRaw = {
  leaderboard?: GolferRaw[];
};

export async function GET(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    
    // Check admin permissions
    await requireOrgAdminForPool(req, poolId);

    const latest = await prisma.tournamentSnapshot.findFirst({
      where: { poolId },
      orderBy: { fetchedAt: "desc" },
    });

    const raw = (latest?.rawJson as TournamentSnapshotRaw) ?? {};
    const leaderboard = raw?.leaderboard ?? [];

    const golfers: Golfer[] = Array.isArray(leaderboard)
      ? leaderboard
          .map((g: GolferRaw) => ({
            id: String(g?.golferId ?? ""),
            name: String(g?.golferName ?? ""),
          }))
          .filter((g: Golfer) => g.id && g.name)
      : [];

    // de-dupe by id
    const seen = new Set<string>();
    const unique: Golfer[] = golfers.filter((g: Golfer) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });

    // sort alphabetically
    unique.sort((a: Golfer, b: Golfer) => a.name.localeCompare(b.name));

    return NextResponse.json({
      golfers: unique,
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 400 });
  }
}