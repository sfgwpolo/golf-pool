import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireOrgAdmin } from "../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await ctx.params;
    await requireOrgAdmin(req, orgId);

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    const emblemUrl =
      typeof body.emblemUrl === "string" && body.emblemUrl.trim()
        ? body.emblemUrl.trim()
        : null;

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        description,
        emblemUrl,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        emblemUrl: true,
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}