import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function GET(req: Request, ctx: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await ctx.params;

    await requireOrgAdminForPool(req, poolId);

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { startsAt: true, locked: true },
    });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    const now = new Date();
    const allowed = now >= new Date(pool.startsAt) || pool.locked;

    const unpaidCount = await prisma.entry.count({
      where: { poolId, isDeleted: false, isPaid: false },
    });

    return NextResponse.json({
      allowed,
      startsAt: pool.startsAt,
      locked: pool.locked,
      unpaidCount,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
