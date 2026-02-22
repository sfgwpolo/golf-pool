import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

function assertAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ poolId: string }> }
) {
    assertAdmin(req);

  const { poolId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const locked = body?.locked;

  if (typeof locked !== "boolean") {
    return NextResponse.json({ error: "Missing locked boolean" }, { status: 400 });
  }

  const pool = await prisma.pool.update({
    where: { id: poolId },
    data: { locked },
    select: { id: true, locked: true },
  });

  return NextResponse.json({ pool });
}
