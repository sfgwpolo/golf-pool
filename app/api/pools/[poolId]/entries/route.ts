import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { validateTenUniquePicks } from "../../../../../lib/validation/picks";
import { hashPasscode, isValidPasscode } from "../../../../../lib/passcode";

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

    const email = String(body.email || "")
      .toLowerCase()
      .trim();
      
    const picks = body.picks.map((p: any) => ({
      ...p,
      rank: Number(p.rank),
      golferId: String(p.golferId || ""),
      golferName: String(p.golferName || ""),
    }));

    const passcode = String(body.passcode ?? "").trim();
    if (!isValidPasscode(passcode)) {
      return NextResponse.json(
        { error: "Code word required (4–50 characters)." },
        { status: 400 },
      );
    }

    const entryName = String(body.entryName ?? "").trim();

    if (!entryName) return NextResponse.json({ error: "entryName required" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

    if (new Date() >= new Date(pool.entriesCloseAt) || pool.locked) {
      return NextResponse.json({ error: "Entries are closed for this pool" }, { status: 403 });
    }

    const existing = await prisma.entryPasscode.findUnique({
      where: { poolId_email: { poolId, email } },
    });

    const passcodeHash = hashPasscode(poolId, email, passcode);

    if (!existing) {
      // first time this email is used in this pool -> set passcode
      await prisma.entryPasscode.create({
        data: { poolId, email, passcodeHash },
      });
    } else {
      // already claimed -> must match
      if (existing.passcodeHash !== passcodeHash) {
        return NextResponse.json(
          { error: "Code word incorrect for this email." },
          { status: 401 },
        );
      }
    }

    const check = validateTenUniquePicks(picks);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
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
