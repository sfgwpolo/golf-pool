export type IncomingPick = {
  rank: number;
  golferId?: string;
  golferName: string;
};

function normalizeName(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeId(s: string) {
  return normalizeName(s).replace(/\s+/g, "-");
}

export function validateTenUniquePicks(picks: IncomingPick[]) {
  if (!Array.isArray(picks) || picks.length !== 10) {
    return { ok: false as const, error: "You must submit exactly 10 picks." };
  }

  // Validate ranks 1..10 exactly once
  const ranks = picks.map((p) => Number(p.rank));
  const rankSet = new Set(ranks);
  const expected = new Set([1,2,3,4,5,6,7,8,9,10]);

  if (rankSet.size !== 10 || ranks.some((r) => !expected.has(r))) {
    return { ok: false as const, error: "Ranks must be 1 through 10 with no duplicates." };
  }

  // Validate names + uniqueness
  const seen = new Set<string>();

  for (const p of picks) {
    const name = (p.golferName || "").trim();
    if (!name) {
      return { ok: false as const, error: "Each pick must include a golfer name." };
    }

    const keyById = p.golferId ? `id:${normalizeId(p.golferId)}` : "";
    const keyByName = `name:${normalizeName(name)}`;

    // Treat either ID or Name match as duplicate
    const keysToCheck = [keyByName, keyById].filter(Boolean);

    for (const k of keysToCheck) {
      if (seen.has(k)) {
        return {
          ok: false as const,
          error: `Duplicate golfer detected: "${name}". Each golfer can only be picked once.`,
        };
      }
    }

    // Add both keys so duplicates match either way
    seen.add(keyByName);
    if (keyById) seen.add(keyById);
  }

  return { ok: true as const };
}
