-- AlterTable
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "paddyLotId" TEXT,
ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "paddyLotId" TEXT,
ADD COLUMN IF NOT EXISTS "sourceType" TEXT,
ADD COLUMN IF NOT EXISTS "sourceId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Income_paddyLotId_idx" ON "Income"("paddyLotId");
CREATE UNIQUE INDEX IF NOT EXISTS "Income_sourceType_sourceId_key" ON "Income"("sourceType", "sourceId");
CREATE INDEX IF NOT EXISTS "Expense_paddyLotId_idx" ON "Expense"("paddyLotId");
CREATE UNIQUE INDEX IF NOT EXISTS "Expense_sourceType_sourceId_key" ON "Expense"("sourceType", "sourceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_categoryId_month_year_key" ON "Budget"("categoryId", "month", "year");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "Income" ADD CONSTRAINT "Income_paddyLotId_fkey" FOREIGN KEY ("paddyLotId") REFERENCES "PaddyLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paddyLotId_fkey" FOREIGN KEY ("paddyLotId") REFERENCES "PaddyLot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
