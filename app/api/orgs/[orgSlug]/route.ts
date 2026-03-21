import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type PoolStatus = "active" | "upcoming" | "past";

function getPoolStatus(pool: {
  startsAt: Date;
  endedAt: Date | null;
  isArchived: boolean;
}): PoolStatus {
  const now = new Date();

  if (pool.isArchived) return "past";
  if (now < new Date(pool.startsAt)) return "upcoming";
  if (pool.endedAt && now >= new Date(pool.endedAt)) return "past";
  return "active";
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ orgSlug: string }> }
) {
  const { orgSlug } = await ctx.params;

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      pools: {
        orderBy: [{ year: "desc" }, { startsAt: "desc" }],
        select: {
          id: true,
          name: true,
          year: true,
          startsAt: true,
          endedAt: true,
          entriesCloseAt: true,
          locked: true,
          isArchived: true,
          rulesText: true,
          entryCost: true,
          payoutText: true,
        },
      },
    },
  });

  if (!org || org.isArchived) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 }
    );
  }

  const poolsWithStatus = org.pools.map((p) => ({
    ...p,
    status: getPoolStatus({
      startsAt: p.startsAt,
      endedAt: p.endedAt,
      isArchived: p.isArchived,
    }),
    entryCost: p.entryCost?.toString() ?? null,
  }));

  const activePools = poolsWithStatus.filter((p) => p.status === "active");
  const upcomingPools = poolsWithStatus.filter((p) => p.status === "upcoming");
  const pastPools = poolsWithStatus.filter((p) => p.status === "past");

  const defaultPool =
    activePools.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt))[0] ??
    poolsWithStatus.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt))[0] ??
    null;

  return NextResponse.json({
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      emblemUrl: org.emblemUrl,
    },
    defaultPool,
    activePools,
    upcomingPools,
    pastPools,
  });
}