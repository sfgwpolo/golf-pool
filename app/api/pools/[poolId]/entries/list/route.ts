import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(
  _: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  const { poolId } = await context.params;

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  const entries = await prisma.entry.findMany({
    where: { poolId, isDeleted: false },
    orderBy: [{ isPaid: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      entryName: true,
      createdAt: true,
      isPaid: true,
    },
  });

  return NextResponse.json({
    pool: {
      id: pool.id,
      name: pool.name,
      entriesCloseAt: pool.entriesCloseAt,
    },
    entries,
  });
}
