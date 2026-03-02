import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../../../lib/adminAuth";

export async function POST(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  try {
    const me = await requireAnyAdmin(req);
    if (me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { orgId } = await ctx.params;
    const body = await req.json().catch(() => null);
    const adminId = String(body?.adminId || "");

    if (!adminId) return NextResponse.json({ error: "adminId required" }, { status: 400 });

    const row = await prisma.orgAdmin.create({
      data: { orgId, adminId },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status =
      msg.includes("Unique constraint") ? 409 : msg === "Forbidden" ? 403 : msg === "Organization" ? 404 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ orgId: string }> }) {
  try {
    const me = await requireAnyAdmin(req);
    if (me.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { orgId } = await ctx.params;
    const url = new URL(req.url);
    const adminId = url.searchParams.get("adminId") || "";

    if (!adminId) return NextResponse.json({ error: "adminId required" }, { status: 400 });

    await prisma.orgAdmin.delete({
      where: { orgId_adminId: { orgId, adminId } },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
