-- CreateTable
CREATE TABLE "EntryPasscode" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passcodeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryPasscode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryPasscode_poolId_email_idx" ON "EntryPasscode"("poolId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EntryPasscode_poolId_email_key" ON "EntryPasscode"("poolId", "email");

-- AddForeignKey
ALTER TABLE "EntryPasscode" ADD CONSTRAINT "EntryPasscode_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
