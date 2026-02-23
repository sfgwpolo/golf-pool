import { NextResponse } from "next/server";
import { prisma } from "../../../../../..//lib/prisma";

function assertAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ entryId: string }> }
) {
    assertAdmin(req);

    const { entryId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const isPaid = body?.isPaid;

  if (typeof isPaid !== "boolean") {
    return NextResponse.json({ error: "Missing isPaid boolean" }, { status: 400 });
  }

  const entry = await prisma.entry.update({
    where: { id: entryId },
    data: {
      isPaid,
      paidAt: isPaid ? new Date() : null,
    },
    select: { id: true, isPaid: true, paidAt: true },
  });

  return NextResponse.json({ entry });
}
