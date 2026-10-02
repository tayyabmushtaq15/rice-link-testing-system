import type { AccountType, Prisma, PrismaClient } from "@prisma/client"

type Client = Prisma.TransactionClient | PrismaClient

export const LEDGER_ACCOUNTS = {
  CASH: { code: "1000", name: "Cash", type: "ASSET" as AccountType },
  BANK: { code: "1010", name: "Bank", type: "ASSET" as AccountType },
  AR: { code: "1100", name: "Accounts Receivable", type: "ASSET" as AccountType },
  INVENTORY: { code: "1200", name: "Inventory", type: "ASSET" as AccountType },
  MACHINERY: { code: "1500", name: "Machinery", type: "ASSET" as AccountType },
  AP: { code: "2000", name: "Accounts Payable", type: "LIABILITY" as AccountType },
  LOANS: { code: "2100", name: "Loans", type: "LIABILITY" as AccountType },
  SALES_TAX_PAYABLE: { code: "2200", name: "Sales Tax Payable", type: "LIABILITY" as AccountType },
  OWNERS_EQUITY: { code: "3000", name: "Owner's Equity", type: "EQUITY" as AccountType },
  RICE_SALES: { code: "4000", name: "Rice Sales", type: "INCOME" as AccountType },
  BYPRODUCT_SALES: { code: "4100", name: "By-product Sales", type: "INCOME" as AccountType },
  OTHER_INCOME: { code: "4900", name: "Other Income", type: "INCOME" as AccountType },
  COGS: { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" as AccountType },
} as const

export const LEDGER_SOURCE = {
  PURCHASE: "PURCHASE",
  PURCHASE_PAYMENT: "PURCHASE_PAYMENT",
  SALE: "SALE",
  SALE_PAYMENT: "SALE_PAYMENT",
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
} as const

export async function ensureBaseAccounts(client: Client) {
  for (const account of Object.values(LEDGER_ACCOUNTS)) {
    await client.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    })
  }
}

export async function getOrCreateAccount(
  tx: Prisma.TransactionClient,
  code: string,
  name: string,
  type: AccountType,
) {
  return tx.account.upsert({
    where: { code },
    update: {},
    create: { code, name, type },
  })
}

// One Account per ExpenseCategory, lazily materialized on first posting against that category —
// mirrors the existing ensureCategoryByName() lazy-creation pattern in actions/finance/_shared.ts.
export async function getOrCreateExpenseCategoryAccount(
  tx: Prisma.TransactionClient,
  categoryId: string,
) {
  const existing = await tx.account.findUnique({ where: { expenseCategoryId: categoryId } })
  if (existing) return existing

  const category = await tx.expenseCategory.findUniqueOrThrow({ where: { id: categoryId } })
  const last = await tx.account.findFirst({
    where: { type: "EXPENSE", code: { not: LEDGER_ACCOUNTS.COGS.code } },
    orderBy: { code: "desc" },
  })
  const nextCode = String((last ? Number(last.code) : 5000) + 100)

  try {
    return await tx.account.create({
      data: { code: nextCode, name: category.name, type: "EXPENSE", expenseCategoryId: categoryId },
    })
  } catch {
    // Race: another concurrent posting grabbed this code or this category's account first.
    return tx.account.findUniqueOrThrow({ where: { expenseCategoryId: categoryId } })
  }
}

export function resolveCashOrBankAccount(paymentMethod: string) {
  return paymentMethod.toUpperCase().includes("CASH") ? LEDGER_ACCOUNTS.CASH.code : LEDGER_ACCOUNTS.BANK.code
}

type PostingLine = { accountCode: string; debit?: number; credit?: number }

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export async function postJournalEntry(
  tx: Prisma.TransactionClient,
  params: { sourceType: string; sourceId: string; date: Date; description: string; lines: PostingLine[] },
) {
  const lines = params.lines
    .map((line) => ({ ...line, debit: round2(line.debit ?? 0), credit: round2(line.credit ?? 0) }))
    .filter((line) => line.debit > 0 || line.credit > 0)

  await tx.journalEntry.deleteMany({ where: { sourceType: params.sourceType, sourceId: params.sourceId } })
  if (lines.length === 0) return null

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)
  if (Math.abs(totalDebit - totalCredit) > 0.01)
    throw new Error(
      `Unbalanced journal entry ${params.sourceType}:${params.sourceId} (Dr ${totalDebit} != Cr ${totalCredit})`,
    )

  const codeToAccountId = new Map<string, string>()
  for (const code of new Set(lines.map((line) => line.accountCode))) {
    const known = Object.values(LEDGER_ACCOUNTS).find((account) => account.code === code)
    const account = known
      ? await getOrCreateAccount(tx, known.code, known.name, known.type)
      : await tx.account.findUniqueOrThrow({ where: { code } })
    codeToAccountId.set(code, account.id)
  }

  return tx.journalEntry.create({
    data: {
      date: params.date,
      description: params.description,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      lines: {
        create: lines.map((line) => ({
          accountId: codeToAccountId.get(line.accountCode)!,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
  })
}

export async function deleteJournalEntry(tx: Prisma.TransactionClient, sourceType: string, sourceId: string) {
  await tx.journalEntry.deleteMany({ where: { sourceType, sourceId } })
}

// Reusable by both actions/finance/expenses.ts and actions/finance/salaries.ts — salary-driven
// expenses already flow through a real Expense row, so no separate salary-specific posting logic
// is needed.
export async function syncExpenseJournalEntry(tx: Prisma.TransactionClient, expenseId: string) {
  const expense = await tx.expense.findUniqueOrThrow({ where: { id: expenseId } })
  if (expense.isDeleted) return deleteJournalEntry(tx, LEDGER_SOURCE.EXPENSE, expenseId)

  const account = await getOrCreateExpenseCategoryAccount(tx, expense.categoryId)
  return postJournalEntry(tx, {
    sourceType: LEDGER_SOURCE.EXPENSE,
    sourceId: expenseId,
    date: expense.date,
    description: `Expense ${expense.transactionNo}`,
    lines: [
      { accountCode: account.code, debit: expense.amount },
      { accountCode: resolveCashOrBankAccount(expense.paymentMethod), credit: expense.amount },
    ],
  })
}

export async function syncIncomeJournalEntry(tx: Prisma.TransactionClient, incomeId: string) {
  const income = await tx.income.findUniqueOrThrow({ where: { id: incomeId } })
  return postJournalEntry(tx, {
    sourceType: LEDGER_SOURCE.INCOME,
    sourceId: incomeId,
    date: income.date,
    description: `Income ${income.transactionNo}`,
    lines: [
      { accountCode: resolveCashOrBankAccount(income.paymentMethod), debit: income.amount },
      { accountCode: LEDGER_ACCOUNTS.OTHER_INCOME.code, credit: income.amount },
    ],
  })
}
