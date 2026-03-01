import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { hashPasscode, isValidPasscode } from "../../../../../../../lib/passcode";

function assertAdmin(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    throw new Error("Unauthorized");
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ poolId: string }> }
) {
  await assertAdmin(req);

  const { poolId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const email = String(body?.email || "").toLowerCase().trim();
  const newPasscode = String(body?.newPasscode || "").trim();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  if (!isValidPasscode(newPasscode)) {
    return NextResponse.json(
      { error: "newPasscode required (4–50 characters)" },
      { status: 400 }
    );
  }

  const passcodeHash = hashPasscode(poolId, email, newPasscode);

  const record = await prisma.entryPasscode.upsert({
    where: { poolId_email: { poolId, email } },
    update: { passcodeHash },
    create: { poolId, email, passcodeHash },
    select: { id: true, poolId: true, email: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, record });
}
