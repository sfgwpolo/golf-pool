import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireOrgAdminForPool } from "../../../../../lib/adminAuth";

type PoolUpdateData = {
  name: string;
  year: number | string;
  tournamentKey: string;
  startsAt: string;
  entriesCloseAt: string;
  locked?: boolean;
  weightsJson?: unknown;
  rulesText?: string | null;
  entryCost?: string | number | null;
  payoutText?: string | null;
  endedAt?: string | null;
  isArchived?: boolean;
};

function parseDate(value: string, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}`);
  }
  return date;
}

function parseWeightsJson(value: unknown) {
  if (value === undefined) return undefined;

  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("weightsJson must be a JSON object");
  }

  const weights: Record<string, number> = {};
  for (const [rank, weight] of Object.entries(parsed)) {
    const numericRank = Number(rank);
    const numericWeight = Number(weight);
    if (
      !Number.isInteger(numericRank) ||
      numericRank < 1 ||
      !Number.isFinite(numericWeight)
    ) {
      throw new Error("weightsJson must map numeric ranks to numeric weights");
    }
    weights[String(numericRank)] = numericWeight;
  }

  return weights;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    await requireOrgAdminForPool(req, poolId);

    const body = await req.json() as PoolUpdateData;
    const {
      name,
      year,
      tournamentKey,
      startsAt,
      entriesCloseAt,
      locked,
      weightsJson,
      rulesText,
      entryCost,
      payoutText,
      endedAt,
      isArchived,
    } = body;

    if (!name?.trim() || !year || !tournamentKey?.trim() || !startsAt || !entriesCloseAt) {
      throw new Error(
        "Missing required fields: name, year, tournamentKey, startsAt, entriesCloseAt"
      );
    }

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear)) {
      throw new Error("Invalid year");
    }

    const parsedEntryCost =
      entryCost === null || entryCost === undefined || entryCost === ""
        ? null
        : Number(entryCost);

    if (parsedEntryCost !== null && !Number.isFinite(parsedEntryCost)) {
      throw new Error("Invalid entryCost");
    }

    const parsedEndedAt =
      typeof endedAt === "string" && endedAt.trim()
        ? parseDate(endedAt, "endedAt")
        : null;

    const parsedWeightsJson = parseWeightsJson(weightsJson);

    const updated = await prisma.pool.update({
      where: { id: poolId },
      data: {
        name: name.trim(),
        year: parsedYear,
        tournamentKey: tournamentKey.trim(),
        startsAt: parseDate(startsAt, "startsAt"),
        entriesCloseAt: parseDate(entriesCloseAt, "entriesCloseAt"),
        locked: typeof locked === "boolean" ? locked : undefined,
        weightsJson: parsedWeightsJson,
        rulesText: typeof rulesText === "string" ? rulesText.trim() : null,
        entryCost: parsedEntryCost,
        payoutText: typeof payoutText === "string" ? payoutText.trim() : null,
        endedAt: parsedEndedAt,
        isArchived: typeof isArchived === "boolean" ? isArchived : undefined,
      },
    });

    return NextResponse.json({
      pool: {
        ...updated,
        entryCost: updated.entryCost?.toString() ?? null,
      },
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 400 });
  }
}
