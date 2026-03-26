import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ poolId: string }> },
) {
  const { poolId } = await context.params;

  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      name: true,
      entryCost: true,
      startsAt: true,
      entriesCloseAt: true,
      locked: true,
      endedAt: true,
      isArchived: true,
    },
  });

  if (!pool) {
    return NextResponse.json({ error: "Pool not found" }, { status: 404 });
  }

  return NextResponse.json({ pool });
}
