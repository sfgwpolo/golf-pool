import { NextResponse } from "next/server";
import { getSessionCookieName } from "../../../../../lib/admin/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(0),
  });
  return res;
}
