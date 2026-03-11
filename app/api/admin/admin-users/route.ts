import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../lib/adminAuth";
import { hashPassword } from "../../../../lib/admin/password";

export async function POST(req: Request) {
  try {
    const admin = await requireAnyAdmin(req);
    if (admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");
    const role = String(body?.role || "ORG_ADMIN");

    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
    if (password.length < 8) {
      return NextResponse.json({ error: "password must be at least 8 characters" }, { status: 400 });
    }
    if (role !== "ORG_ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }

    const created = await prisma.adminUser.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ adminUser: created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    // Prisma unique constraint -> already exists
    const status = msg.includes("Unique constraint") ? 409 : msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
