import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../lib/adminAuth";

export async function GET(req: Request) {
  try {
    const me = await requireAnyAdmin(req);

    if (me.role === "SUPER_ADMIN") {
      return NextResponse.json({
        me,
        organizations: await prisma.organization.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, slug: true },
        }),
      });
    }

    // ORG_ADMIN: only orgs they belong to
    const memberships = await prisma.orgAdmin.findMany({
      where: { adminId: me.id },
      select: { organization: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({
      me,
      organizations: memberships.map((m) => m.organization),
    });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
