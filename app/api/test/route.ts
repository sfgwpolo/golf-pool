import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const orgCount = await prisma.organization.count();

  return NextResponse.json({
    message: "Database connected!",
    organizations: orgCount,
  });
}
