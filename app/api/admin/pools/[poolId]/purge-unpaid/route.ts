import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function POST(req: Request, ctx: { params: Promise<{ poolId: string }> }) {
  try {
    const { poolId } = await ctx.params;

    // ✅ RBAC: must be SUPER_ADMIN or ORG_ADMIN for the pool's org
    await requireOrgAdminForPool(req, poolId);

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      select: { id: true, startsAt: true, locked: true },
    });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    // Confirm flag prevents accidental clicks / bots
    const body = await req.json().catch(() => null);
    if (!body || body.confirm !== true) {
      return NextResponse.json({ error: "Missing confirm=true" }, { status: 400 });
    }

    // ✅ Rule: allow if tournament started OR pool manually locked
    const now = new Date();
    const allowed = now >= new Date(pool.startsAt) || pool.locked;
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Not allowed until tournament starts (or pool is manually locked).",
          startsAt: pool.startsAt,
          locked: pool.locked,
        },
        { status: 400 }
      );
    }

    const result = await prisma.entry.updateMany({
      where: { poolId, isDeleted: false, isPaid: false },
      data: { isDeleted: true, deletedAt: now },
    });

    return NextResponse.json({ purged: result.count });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
