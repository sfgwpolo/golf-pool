-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Pool" ADD COLUMN     "endedAt" TIMESTAMP(3);
