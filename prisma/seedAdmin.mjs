import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 120_000, 32, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  // 🔐 CHANGE THESE
  const email = "joyce@local.test";
  const password = "ChangeMe123!";

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashPassword(password),
      role: "SUPER_ADMIN",
    },
    select: { id: true, email: true, role: true },
  });

  console.log("Seeded admin:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
