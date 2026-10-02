-- AlterTable
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Expense_employeeId_idx" ON "Expense"("employeeId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
