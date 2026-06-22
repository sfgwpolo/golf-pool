import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../../lib/adminAuth";

type PickData = {
  rank: number;
  golferId: string;
  golferName?: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await context.params;

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      select: { poolId: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await requireOrgAdminForPool(req, entry.poolId);

    const body = await req.json().catch(() => null);
    const picks = body && typeof body === "object" ? (body as { picks?: unknown }).picks : null;

    if (!Array.isArray(picks) || picks.length !== 10) {
      return NextResponse.json({ error: "Must provide exactly 10 picks" }, { status: 400 });
    }

    const cleanPicks = picks.map((pick) => {
      const maybePick = pick as Partial<PickData>;
      return {
        rank: Number(maybePick.rank),
        golferId: String(maybePick.golferId ?? "").trim(),
        golferName: String(maybePick.golferName ?? "").trim(),
      };
    });

    for (const pick of cleanPicks) {
      if (!Number.isInteger(pick.rank) || pick.rank < 1 || pick.rank > 10 || !pick.golferId) {
        return NextResponse.json(
          { error: "Each pick must have rank 1-10 and golferId" },
          { status: 400 }
        );
      }
    }

    await prisma.entryPick.deleteMany({
      where: { entryId },
    });

    await prisma.entryPick.createMany({
      data: cleanPicks.map((pick) => ({
        entryId,
        rank: pick.rank,
        golferId: pick.golferId,
        golferName: pick.golferName,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
