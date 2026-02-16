import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

    const entryName = String(body.entryName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const picks = Array.isArray(body.picks) ? body.picks : [];

    if (!entryName) return NextResponse.json({ error: "entryName required" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    if (picks.length !== 10) return NextResponse.json({ error: "Exactly 10 picks required" }, { status: 400 });

    const ranks = picks.map((p: any) => Number(p.rank));
    const rankSet = new Set(ranks);
    if (rankSet.size !== 10 || Math.min(...ranks) !== 1 || Math.max(...ranks) !== 10) {
      return NextResponse.json({ error: "Ranks must be 1..10 unique" }, { status: 400 });
    }

    const golferIds = picks.map((p: any) => String(p.golferId));
    if (new Set(golferIds).size !== 10) {
      return NextResponse.json({ error: "Golfer IDs must be unique" }, { status: 400 });
    }

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    if (new Date() >= new Date(pool.entriesCloseAt)) {
      return NextResponse.json({ error: "Entries are closed for this pool" }, { status: 403 });
    }

    const entry = await prisma.entry.create({
      data: {
        poolId,
        entryName,
        email,
        picks: {
          create: picks.map((p: any) => ({
            rank: Number(p.rank),
            golferId: String(p.golferId),
            golferName: String(p.golferName),
          })),
        },
      },
      include: { picks: { orderBy: { rank: "asc" } } },
    });

    return NextResponse.json({ entry });
  } catch (e: any) {
    console.error("Create entry error:", e);
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error", detail: String(e) },
      { status: 500 }
    );
  }
}
