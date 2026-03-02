import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { verifyPassword } from "../../../../../lib/admin/password";
import { createAdminSession, getSessionCookieName } from "../../../../../lib/admin/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();
  const password = String(body?.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token, expiresAt } = await createAdminSession(admin.id);

  const res = NextResponse.json({ ok: true, role: admin.role });
  res.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true when deployed on HTTPS
    path: "/",
    expires: expiresAt,
  });
  return res;
}
