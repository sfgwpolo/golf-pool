import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { fetchPgaTourLeaderboard } from "../../../../../../lib/providers/pgaTourLeaderboard";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function POST(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;

    await requireOrgAdminForPool(req, poolId);

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    if (!pool.tournamentKey) {
        return NextResponse.json({ error: "Pool.tournamentKey must be set (ex: R2026005)" }, { status: 400 });
    }

    const leaderboard = await fetchPgaTourLeaderboard(pool.tournamentKey);

    const snapshot = await prisma.tournamentSnapshot.create({
    data: {
        poolId,
        source: "pga-orchestrator",
        rawJson: { leaderboard },
    },
    });

    return NextResponse.json({
      ok: true,
      snapshot: { id: snapshot.id, fetchedAt: snapshot.fetchedAt, source: snapshot.source },
      count: leaderboard.length,
    });
  } catch (e: unknown) {
    console.error("refresh-snapshot error:", e);

    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status =
      msg === "Forbidden" ? 403 : msg === "Pool not found" ? 404 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
