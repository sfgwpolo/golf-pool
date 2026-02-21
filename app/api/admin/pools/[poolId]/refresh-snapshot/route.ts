import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { fetchPgaTourLeaderboard } from "../../../../../../lib/providers/pgaTourLeaderboard";

function assertAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    assertAdmin(req);
    const { poolId } = await context.params;

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
  } catch (e: any) {
    console.error("refresh-snapshot error:", e);

    const msg = e?.message ?? "Error";
    const status = msg === "Unauthorized" ? 401 : 500;

    return NextResponse.json(
      { error: msg, detail: String(e) },
      { status }
    );
  }
}
