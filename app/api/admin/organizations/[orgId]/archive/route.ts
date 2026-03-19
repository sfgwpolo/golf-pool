import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ orgId: string }> }
) {
  try {
    const me = await requireAnyAdmin(req);
    if (me.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orgId } = await ctx.params;
    const body = await req.json().catch(() => null);

    if (!body || typeof body.isArchived !== "boolean") {
      return NextResponse.json(
        { error: "isArchived boolean required" },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { isArchived: body.isArchived },
      select: {
        id: true,
        name: true,
        slug: true,
        isArchived: true,
      },
    });

    return NextResponse.json({ organization: updated });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
