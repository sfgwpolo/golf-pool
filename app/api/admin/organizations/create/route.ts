import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAnyAdmin } from "../../../../../lib/adminAuth";

export async function POST(req: Request) {
  try {
    const me = await requireAnyAdmin(req);
    if (me.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = String(body.name || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase();
    const description =
      typeof body.description === "string" ? body.description.trim() : null;
    const emblemUrl =
      typeof body.emblemUrl === "string" && body.emblemUrl.trim()
        ? body.emblemUrl.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const created = await prisma.organization.create({
      data: {
        name,
        slug,
        description,
        emblemUrl,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        emblemUrl: true,
        isArchived: true,
      },
    });

    return NextResponse.json({ organization: created });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const status =
      msg.includes("Unique constraint") ? 409 : msg === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
