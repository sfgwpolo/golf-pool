/*
  Warnings:

  - You are about to drop the column `raw` on the `TournamentSnapshot` table. All the data in the column will be lost.
  - Added the required column `rawJson` to the `TournamentSnapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `TournamentSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TournamentSnapshot" DROP CONSTRAINT "TournamentSnapshot_poolId_fkey";

-- AlterTable
ALTER TABLE "TournamentSnapshot" DROP COLUMN "raw",
ADD COLUMN     "rawJson" JSONB NOT NULL,
ADD COLUMN     "source" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "TournamentSnapshot" ADD CONSTRAINT "TournamentSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
