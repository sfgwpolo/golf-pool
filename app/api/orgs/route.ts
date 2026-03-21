import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const orgs = await prisma.organization.findMany({
    where: { isArchived: false },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      emblemUrl: true,
    },
  });

  return NextResponse.json({ organizations: orgs });
}
