import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdmin } from "../../../../../../lib/adminAuth";

export async function GET(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await ctx.params;
    await requireOrgAdmin(req, orgId);

    const pools = await prisma.pool.findMany({
      where: { orgId },
      orderBy: [{ year: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        year: true,
        startsAt: true,
        entriesCloseAt: true,
        locked: true,
      },
    });

    return NextResponse.json({ pools });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
