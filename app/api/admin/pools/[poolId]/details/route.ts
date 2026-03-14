import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await ctx.params;
    await requireOrgAdminForPool(req, poolId);

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rulesText =
      typeof body.rulesText === "string" ? body.rulesText.trim() : null;

    const payoutText =
      typeof body.payoutText === "string" ? body.payoutText.trim() : null;

    const entryCost =
      body.entryCost === null || body.entryCost === undefined || body.entryCost === ""
        ? null
        : Number(body.entryCost);

    if (entryCost !== null && !Number.isFinite(entryCost)) {
      return NextResponse.json({ error: "Invalid entryCost" }, { status: 400 });
    }

    const endedAt =
      typeof body.endedAt === "string" && body.endedAt.trim()
        ? new Date(body.endedAt)
        : null;

    if (endedAt && Number.isNaN(endedAt.getTime())) {
      return NextResponse.json({ error: "Invalid endedAt" }, { status: 400 });
    }

    const isArchived =
      typeof body.isArchived === "boolean" ? body.isArchived : false;

    const updated = await prisma.pool.update({
      where: { id: poolId },
      data: {
        rulesText,
        payoutText,
        entryCost,
        endedAt,
        isArchived,
      },
      select: {
        id: true,
        name: true,
        year: true,
        rulesText: true,
        payoutText: true,
        entryCost: true,
        endedAt: true,
        isArchived: true,
      },
    });

    return NextResponse.json({
      pool: {
        ...updated,
        entryCost: updated.entryCost?.toString() ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}