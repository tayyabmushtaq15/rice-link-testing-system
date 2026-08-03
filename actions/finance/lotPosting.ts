"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { calculateProductionSummary } from "@/lib/production"
import { FINANCE_SOURCE } from "@/lib/finance"
import {
  checkFinanceAccess,
  ensureCategoryByName,
  ensureDefaultExpenseCategories,
  generateExpenseTransactionNo,
  generateIncomeTransactionNo,
} from "./_shared"

export async function isLotPostedToFinance(paddyLotId: string) {
  const [sale, paddy, processing] = await Promise.all([
    prisma.income.findUnique({
      where: {
        sourceType_sourceId: {
          sourceType: FINANCE_SOURCE.LOT_SALE,
          sourceId: paddyLotId,
        },
      },
    }),
    prisma.expense.findUnique({
      where: {
        sourceType_sourceId: {
          sourceType: FINANCE_SOURCE.LOT_PADDY,
          sourceId: paddyLotId,
        },
      },
    }),
    prisma.expense.findUnique({
      where: {
        sourceType_sourceId: {
          sourceType: FINANCE_SOURCE.LOT_PROCESSING,
          sourceId: paddyLotId,
        },
      },
    }),
  ])

  return Boolean(sale || paddy || processing)
}

export async function getLotsFinancePostingStatus() {
  await checkFinanceAccess()

  const lots = await prisma.paddyLot.findMany({
    where: { productionOutput: { isNot: null } },
    include: {
      productionOutput: true,
      mill: { select: { name: true } },
      financeIncomes: { select: { id: true, sourceType: true } },
      financeExpenses: {
        where: { isDeleted: false },
        select: { id: true, sourceType: true },
      },
    },
    orderBy: { purchaseDate: "desc" },
  })

  return lots.map((lot) => {
    const output = lot.productionOutput!
    const summary = calculateProductionSummary(output, lot.purchaseRate)
    const posted =
      lot.financeIncomes.some((i) => i.sourceType === FINANCE_SOURCE.LOT_SALE) ||
      lot.financeExpenses.some(
        (e) =>
          e.sourceType === FINANCE_SOURCE.LOT_PADDY ||
          e.sourceType === FINANCE_SOURCE.LOT_PROCESSING
      )

    return {
      id: lot.id,
      lotNumber: lot.lotNumber,
      millName: lot.mill.name,
      supplierName: lot.supplierName,
      status: lot.status,
      purchaseDate: lot.purchaseDate,
      paddyCost: summary.paddyCost,
      processingCost: summary.processingCost,
      expectedSaleValue: summary.expectedSaleValue,
      grossProfit: summary.grossProfit,
      posted,
    }
  })
}

export async function postLotToFinance(paddyLotId: string) {
  const userId = await checkFinanceAccess()
  await ensureDefaultExpenseCategories()

  const lot = await prisma.paddyLot.findUnique({
    where: { id: paddyLotId },
    include: { productionOutput: true },
  })

  if (!lot) throw new Error("Paddy lot not found")
  if (!lot.productionOutput) throw new Error("Production output is required before posting to finance")

  if (await isLotPostedToFinance(paddyLotId)) {
    throw new Error("This lot has already been posted to finance")
  }

  const summary = calculateProductionSummary(lot.productionOutput, lot.purchaseRate)
  const paddyCategory = await ensureCategoryByName("Paddy Purchase")
  const processingCategory = await ensureCategoryByName("Processing")
  const postDate = lot.productionOutput.updatedAt || lot.purchaseDate || new Date()

  const created: { incomes: number; expenses: number } = { incomes: 0, expenses: 0 }

  if (summary.paddyCost > 0) {
    await prisma.expense.create({
      data: {
        transactionNo: await generateExpenseTransactionNo(),
        date: postDate,
        categoryId: paddyCategory.id,
        vendorName: lot.supplierName,
        description: `Paddy purchase for lot ${lot.lotNumber}`,
        amount: summary.paddyCost,
        paymentMethod: "Bank Transfer",
        notes: `Auto-posted from lot ${lot.lotNumber}`,
        paddyLotId: lot.id,
        sourceType: FINANCE_SOURCE.LOT_PADDY,
        sourceId: lot.id,
        createdById: userId,
      },
    })
    created.expenses += 1
  }

  if (summary.processingCost > 0) {
    await prisma.expense.create({
      data: {
        transactionNo: await generateExpenseTransactionNo(),
        date: postDate,
        categoryId: processingCategory.id,
        vendorName: null,
        description: `Processing costs for lot ${lot.lotNumber}`,
        amount: summary.processingCost,
        paymentMethod: "Bank Transfer",
        notes: `Auto-posted from lot ${lot.lotNumber}`,
        paddyLotId: lot.id,
        sourceType: FINANCE_SOURCE.LOT_PROCESSING,
        sourceId: lot.id,
        createdById: userId,
      },
    })
    created.expenses += 1
  }

  if (summary.expectedSaleValue > 0) {
    await prisma.income.create({
      data: {
        transactionNo: await generateIncomeTransactionNo(),
        date: postDate,
        source: `Rice Sales - ${lot.lotNumber}`,
        description: `Expected sale value for lot ${lot.lotNumber}`,
        amount: summary.expectedSaleValue,
        paymentMethod: "Bank Transfer",
        notes: `Auto-posted from lot ${lot.lotNumber}`,
        paddyLotId: lot.id,
        sourceType: FINANCE_SOURCE.LOT_SALE,
        sourceId: lot.id,
        createdById: userId,
      },
    })
    created.incomes += 1
  }

  if (created.incomes === 0 && created.expenses === 0) {
    throw new Error("Nothing to post: lot has zero cost and sale values")
  }

  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/income")
  revalidatePath("/dashboard/finance/expenses")
  revalidatePath("/dashboard/finance/reports")
  revalidatePath("/dashboard/production")
  revalidatePath(`/dashboard/lots/${paddyLotId}`)

  return created
}

export async function getPaddyLotsForSelect() {
  await checkFinanceAccess()
  return prisma.paddyLot.findMany({
    select: { id: true, lotNumber: true, supplierName: true },
    orderBy: { lotNumber: "asc" },
  })
}
