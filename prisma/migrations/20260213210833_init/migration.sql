-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tournamentKey" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "entriesCloseAt" TIMESTAMP(3) NOT NULL,
    "weightsJson" JSONB NOT NULL DEFAULT '{"1":10,"2":9,"3":8,"4":7,"5":6,"6":5,"7":4,"8":3,"9":2,"10":1}',

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "entryName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "paidMethod" TEXT,
    "paidNote" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntryPick" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "golferId" TEXT NOT NULL,
    "golferName" TEXT NOT NULL,

    CONSTRAINT "EntryPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentSnapshot" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw" JSONB NOT NULL,

    CONSTRAINT "TournamentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComputedEntryScore" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DECIMAL(18,2) NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "ComputedEntryScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EntryPick_entryId_rank_key" ON "EntryPick"("entryId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "EntryPick_entryId_golferId_key" ON "EntryPick"("entryId", "golferId");

-- CreateIndex
CREATE INDEX "TournamentSnapshot_poolId_fetchedAt_idx" ON "TournamentSnapshot"("poolId", "fetchedAt");

-- CreateIndex
CREATE INDEX "ComputedEntryScore_entryId_fetchedAt_idx" ON "ComputedEntryScore"("entryId", "fetchedAt");

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryPick" ADD CONSTRAINT "EntryPick_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSnapshot" ADD CONSTRAINT "TournamentSnapshot_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComputedEntryScore" ADD CONSTRAINT "ComputedEntryScore_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
