import { NextResponse } from "next/server";
import { prisma } from "../../../../../..//lib/prisma";
import { requireOrgAdminForPool } from "..//../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ entryId: string }> },
) {
  try {
    await requireOrgAdminForPool(req, poolId);

    const { entryId } = await ctx.params;

    const body = await req.json().catch(() => null);
    const isPaid = body?.isPaid;

    if (typeof isPaid !== "boolean") {
      return NextResponse.json(
        { error: "Missing isPaid boolean" },
        { status: 400 },
      );
    }

    const entry = await prisma.entry.update({
      where: { id: entryId },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
      select: { id: true, isPaid: true, paidAt: true },
    });

    return NextResponse.json({ entry });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status =
      msg === "Forbidden" ? 403 : msg === "Pool not found" ? 404 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
