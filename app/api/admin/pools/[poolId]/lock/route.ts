import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ poolId: string }> },
) {
  try {
    const { poolId } = await ctx.params;

    await requireOrgAdminForPool(req, poolId);

    const body = await req.json().catch(() => null);
    const locked = body?.locked;

    if (typeof locked !== "boolean") {
      return NextResponse.json(
        { error: "Missing locked boolean" },
        { status: 400 },
      );
    }

    const pool = await prisma.pool.update({
      where: { id: poolId },
      data: { locked },
      select: { id: true, locked: true },
    });

    return NextResponse.json({ pool });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status =
      msg === "Forbidden" ? 403 : msg === "Pool not found" ? 404 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
