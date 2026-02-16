import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

function assertAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    assertAdmin(req);
    const { poolId } = await context.params;

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

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
      },
      entries,
      now: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Error" }, { status: 401 });
  }
}
