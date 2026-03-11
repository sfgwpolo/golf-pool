import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../../lib/adminAuth";

export async function GET(req: Request) {
  try {
    const me = await requireAnyAdmin(req);
    if (me.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ adminUsers: admins });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
