import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) });

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "joyce-demo" },
    update: {},
    create: { name: "Joyce Demo Org", slug: "joyce-demo" },
  });

  const now = new Date();
  const startsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
  const entriesCloseAt = new Date(startsAt.getTime() - 60 * 60 * 1000); // 1 hour before start

  const pool = await prisma.pool.create({
    data: {
      orgId: org.id,
      year: 2026,
      name: "Demo Tournament Pool",
      // For now, tournamentKey can be a placeholder URL until we scrape
      tournamentKey: "https://example.com/leaderboard.json",
      startsAt,
      entriesCloseAt,
    },
  });

  console.log("Seeded:", { org, pool });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pgPool.end();
  });
