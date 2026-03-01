import crypto from "crypto";

const SALT = process.env.PASSCODE_SALT || "dev-salt-change-me";

function normEmail(email: string) {
  return String(email || "").toLowerCase().trim();
}

export function hashPasscode(poolId: string, email: string, passcode: string) {
  const e = normEmail(email);
  const p = String(passcode || "");
  return crypto
    .createHash("sha256")
    .update(`${SALT}:${poolId}:${e}:${p}`)
    .digest("hex");
}

export function isValidPasscode(passcode: unknown) {
  const s = String(passcode ?? "").trim();
  return s.length >= 4 && s.length <= 50;
}
