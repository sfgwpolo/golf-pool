import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function GET(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;

    await requireOrgAdminForPool(req, poolId);

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const entries = await prisma.entry.findMany({
      where: { poolId },
      orderBy: [{ isDeleted: "asc" }, { isPaid: "desc" }, { createdAt: "asc" }],
      include: { picks: { orderBy: { rank: "asc" } } },
    });

    return NextResponse.json({
      pool: {
        id: pool.id,
        name: pool.name,
        startsAt: pool.startsAt,
        entriesCloseAt: pool.entriesCloseAt,
        locked: pool.locked,
      },
      entries,
      now: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
