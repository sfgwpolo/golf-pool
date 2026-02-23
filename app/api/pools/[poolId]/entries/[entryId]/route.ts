import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(_req: Request, ctx: { params: Promise<{ poolId: string; entryId: string }> }) {
  const { poolId, entryId } = await ctx.params;

  const entry = await prisma.entry.findFirst({
    where: { id: entryId, poolId },
    include: { picks: { orderBy: { rank: "asc" } } },
  });

  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  return NextResponse.json({
    entry: {
      id: entry.id,
      entryName: entry.entryName,
      email: entry.email,
      locked: entry.locked,
      isPaid: entry.isPaid,
      createdAt: entry.createdAt,
      picks: entry.picks.map((p) => ({
        rank: p.rank,
        golferId: p.golferId,
        golferName: p.golferName,
      })),
    },
  });
}

export async function PUT(req: Request, ctx: { params: Promise<{ poolId: string; entryId: string }> }) {
  const { poolId, entryId } = await ctx.params;

  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  // Respect close time (and later we can add pool.locked)
  if (new Date() >= new Date(pool.entriesCloseAt) || pool.locked) {
    return NextResponse.json({ error: "Entries are closed" }, { status: 403 });
  }

  const entry = await prisma.entry.findFirst({ where: { id: entryId, poolId } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  if (entry.locked) {
    return NextResponse.json({ error: "This entry is locked" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.picks || !Array.isArray(body.picks) || body.picks.length !== 10) {
    return NextResponse.json({ error: "Invalid picks" }, { status: 400 });
  }

  // Replace picks
  await prisma.entryPick.deleteMany({ where: { entryId } });
  await prisma.entryPick.createMany({
    data: body.picks.map((p: any) => ({
      entryId,
      rank: Number(p.rank),
      golferId: String(p.golferId),
      golferName: String(p.golferName),
    })),
  });

  // Optional: allow updating entryName too
  if (typeof body.entryName === "string" && body.entryName.trim()) {
    await prisma.entry.update({
      where: { id: entryId },
      data: { entryName: body.entryName.trim() },
    });
  }

  return NextResponse.json({ ok: true });
}
