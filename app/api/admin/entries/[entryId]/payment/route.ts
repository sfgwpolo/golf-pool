import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await context.params;

    // Parse body
    const body = await req.json().catch(() => null);
    if (!body || typeof body.isPaid !== "boolean") {
      return NextResponse.json({ error: "isPaid boolean required" }, { status: 400 });
    }

    // Find entry -> poolId
    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { id: true, poolId: true, isPaid: true },
    });
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    // RBAC based on entry.poolId
    await requireOrgAdminForPool(req, entry.poolId);

    const now = new Date();

    const updated = await prisma.entry.update({
      where: { id: entryId },
      data: body.isPaid
        ? { isPaid: true, paidAt: now }
        : { isPaid: false, paidAt: null },
      select: { id: true, isPaid: true, paidAt: true },
    });

    return NextResponse.json({ entry: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
