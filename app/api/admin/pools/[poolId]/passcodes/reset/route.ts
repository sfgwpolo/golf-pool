import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import {
  hashPasscode,
  isValidPasscode,
} from "../../../../../../../lib/passcode";
import { requireOrgAdminForPool } from "../../../../../../../lib/adminAuth";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ poolId: string }> },
) {
  const { poolId } = await ctx.params;

  try {
    await requireOrgAdminForPool(req, poolId);

    const body = await req.json().catch(() => null);
    const email = String(body?.email || "")
      .toLowerCase()
      .trim();
    const newPasscode = String(body?.newPasscode || "").trim();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    if (!isValidPasscode(newPasscode)) {
      return NextResponse.json(
        { error: "newPasscode required (4–50 characters)" },
        { status: 400 },
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
    
  } catch (e: any) {
    const msg = String(e?.message || "Unauthorized");
    const status =
      msg === "Forbidden" ? 403 : msg === "Pool not found" ? 404 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
