import crypto from "crypto";
import { prisma } from "../prisma";

const COOKIE_NAME = "gp_admin_session";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export async function createAdminSession(adminId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14); // 14 days

  await prisma.adminSession.create({
    data: { adminId, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}

export async function getAdminFromRequest(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/gp_admin_session=([^;]+)/);
  if (!match) return null;

  const token = decodeURIComponent(match[1]);
  const tokenHash = hashToken(token);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session) return null;
  if (new Date() > new Date(session.expiresAt)) return null;

  return session.admin;
}
