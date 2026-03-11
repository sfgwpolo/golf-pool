-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "description" TEXT,
ADD COLUMN     "emblemUrl" TEXT;

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "entryCost" DECIMAL(10,2),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutText" TEXT,
ADD COLUMN     "rulesText" TEXT;
