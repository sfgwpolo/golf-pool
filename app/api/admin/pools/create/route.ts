import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireOrgAdmin } from "../../../../../lib/adminAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const orgId = String(body.orgId || "").trim();
    const name = String(body.name || "").trim();
    const year = Number(body.year);
    const tournamentKey = String(body.tournamentKey || "").trim();
    const startsAt = String(body.startsAt || "").trim();
    const entriesCloseAt = String(body.entriesCloseAt || "").trim();
    const endedAt = String(body.endedAt || "").trim();

    const rulesText =
      typeof body.rulesText === "string" ? body.rulesText.trim() : null;

    const payoutText =
      typeof body.payoutText === "string" ? body.payoutText.trim() : null;

    const entryCost =
      body.entryCost === null || body.entryCost === undefined || body.entryCost === ""
        ? null
        : Number(body.entryCost);

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: "valid year required" }, { status: 400 });
    }
    if (!tournamentKey) {
      return NextResponse.json({ error: "tournamentKey required" }, { status: 400 });
    }
    if (!startsAt) {
      return NextResponse.json({ error: "startsAt required" }, { status: 400 });
    }
    if (!entriesCloseAt) {
      return NextResponse.json({ error: "entriesCloseAt required" }, { status: 400 });
    }
    if (entryCost !== null && !Number.isFinite(entryCost)) {
      return NextResponse.json({ error: "invalid entryCost" }, { status: 400 });
    }

    await requireOrgAdmin(req, orgId);

    const created = await prisma.pool.create({
      data: {
        orgId,
        name,
        year,
        tournamentKey,
        startsAt: new Date(startsAt),
        entriesCloseAt: new Date(entriesCloseAt),
        endedAt: endedAt ? new Date(endedAt) : null,
        rulesText,
        payoutText,
        entryCost,
      },
      select: {
        id: true,
        orgId: true,
        name: true,
        year: true,
        startsAt: true,
        entriesCloseAt: true,
        endedAt: true,
        rulesText: true,
        payoutText: true,
        entryCost: true,
      },
    });

    return NextResponse.json({
      pool: {
        ...created,
        entryCost: created.entryCost?.toString() ?? null,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status = msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
