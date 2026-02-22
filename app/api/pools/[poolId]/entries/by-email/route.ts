import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";

export async function GET(req: Request, ctx: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await ctx.params;
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const entries = await prisma.entry.findMany({
    where: { poolId, email },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      entryName: true,
      createdAt: true,
      locked: true,
      isPaid: true,
    },
  });

  return NextResponse.json({ entries });
}
