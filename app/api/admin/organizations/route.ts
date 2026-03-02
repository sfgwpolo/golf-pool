import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../lib/adminAuth";

export async function GET(req: Request) {
  try {
    const admin = await requireAnyAdmin(req);
    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orgs = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        admins: {
          select: {
            admin: { select: { id: true, email: true, role: true } },
          },
        },
      },
    });

    return NextResponse.json({
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        admins: o.admins.map((a) => a.admin),
      })),
    });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
