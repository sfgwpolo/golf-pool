import crypto from "crypto";

function timingSafeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function hashPassword(password: string, salt?: string) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 120_000, 32, "sha256").toString("hex");
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [s, hash] = String(stored).split(":");
  if (!s || !hash) return false;
  const test = crypto.pbkdf2Sync(password, s, 120_000, 32, "sha256").toString("hex");
  return timingSafeEqual(test, hash);
}
