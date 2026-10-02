"use server"

import { prisma } from "@/lib/prisma"
import { checkFinanceAccess } from "./_shared"
import { LEDGER_ACCOUNTS, getOrCreateExpenseCategoryAccount } from "@/lib/ledger"
import { paginate, parseListQuery, type SortDir } from "@/lib/listQuery"

const GENERAL_LEDGER_SORT_KEYS = ["date", "description"] as const
type GeneralLedgerSortKey = (typeof GENERAL_LEDGER_SORT_KEYS)[number]

function generalLedgerOrderBy(sort: GeneralLedgerSortKey, dir: SortDir) {
  // JournalLine has no date/createdAt of its own — tiebreak through its parent JournalEntry, then
  // fall back to the line's own id (two lines of one entry share both the entry's date and
  // createdAt, so id is what finally guarantees a deterministic order between them).
  const primary =
    sort === "date" ? { journalEntry: { date: dir } } : { journalEntry: { description: dir } }
  return [primary, { journalEntry: { createdAt: dir } }, { id: dir }]
}

export async function getChartOfAccounts() {
  await checkFinanceAccess()

  // Backfill accounts for any ExpenseCategory that hasn't had an Expense posted against it yet,
  // so the Chart of Accounts view is complete even before those categories see any activity.
  const missing = await prisma.expenseCategory.findMany({
    where: { isActive: true, account: null },
    select: { id: true },
  })
  if (missing.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        for (const category of missing) {
          await getOrCreateExpenseCategoryAccount(tx, category.id)
        }
      },
      { timeout: 30_000 },
    )
  }

  return prisma.account.findMany({ where: { isActive: true }, orderBy: { code: "asc" } })
}

export async function getGeneralLedger(params: {
  accountId?: string
  dateFrom?: Date
  dateTo?: Date
  page?: string
  sort?: string
  dir?: string
} = {}) {
  await checkFinanceAccess()

  const { accountId, dateFrom, dateTo } = params
  const whereClause = {
    ...(accountId ? { accountId } : {}),
    journalEntry: {
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
    },
  }

  const { sort, dir } = parseListQuery(params, {
    allowedSorts: GENERAL_LEDGER_SORT_KEYS,
    defaultSort: "date",
    defaultDir: "asc",
  })
  const orderBy = generalLedgerOrderBy(sort, dir)

  const result = await paginate(
    () => prisma.journalLine.count({ where: whereClause }),
    ({ skip, take }) =>
      prisma.journalLine.findMany({
        where: whereClause,
        include: { account: true, journalEntry: true },
        orderBy,
        skip,
        take,
      }),
    Number(params.page) || 1,
  )

  return {
    ...result,
    sort,
    dir,
    items: result.items.map((line) => ({
      id: line.id,
      date: line.journalEntry.date,
      accountCode: line.account.code,
      accountName: line.account.name,
      description: line.journalEntry.description,
      debit: Number(line.debit),
      credit: Number(line.credit),
      sourceType: line.journalEntry.sourceType,
      sourceId: line.journalEntry.sourceId,
    })),
  }
}

export async function getTrialBalance() {
  await checkFinanceAccess()

  const grouped = await prisma.journalLine.groupBy({
    by: ["accountId"],
    _sum: { debit: true, credit: true },
  })
  const accounts = await prisma.account.findMany({
    where: { id: { in: grouped.map((group) => group.accountId) } },
  })

  const rows = grouped
    .map((group) => {
      const account = accounts.find((item) => item.id === group.accountId)!
      return {
        accountId: group.accountId,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: Number(group._sum.debit || 0),
        credit: Number(group._sum.credit || 0),
      }
    })
    .filter((row) => row.debit !== 0 || row.credit !== 0)
    .sort((a, b) => a.code.localeCompare(b.code))

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0)
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0)

  return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 }
}

// Core P&L math, no access check — reused by getBalanceSheet's Retained Earnings calculation.
async function computeProfitAndLoss(dateFrom: Date, dateTo: Date) {
  const lines = await prisma.journalLine.findMany({
    where: { journalEntry: { date: { gte: dateFrom, lte: dateTo } } },
    include: { account: true },
  })

  type AccountAmount = { code: string; name: string; amount: number }
  const salesByAccount = new Map<string, AccountAmount>()
  const expensesByAccount = new Map<string, AccountAmount>()
  let otherIncome = 0
  let cogs = 0

  for (const line of lines) {
    const debit = Number(line.debit)
    const credit = Number(line.credit)
    const account = line.account

    if (account.code === LEDGER_ACCOUNTS.OTHER_INCOME.code) {
      otherIncome += credit - debit
      continue
    }
    if (account.type === "INCOME") {
      const existing = salesByAccount.get(account.id) || { code: account.code, name: account.name, amount: 0 }
      existing.amount += credit - debit
      salesByAccount.set(account.id, existing)
      continue
    }
    if (account.code === LEDGER_ACCOUNTS.COGS.code) {
      cogs += debit - credit
      continue
    }
    if (account.type === "EXPENSE") {
      const existing =
        expensesByAccount.get(account.id) || { code: account.code, name: account.name, amount: 0 }
      existing.amount += debit - credit
      expensesByAccount.set(account.id, existing)
    }
  }

  const totalSales = [...salesByAccount.values()].reduce((sum, item) => sum + item.amount, 0)
  const grossProfit = totalSales - cogs
  const grossMarginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0
  const totalExpenses = [...expensesByAccount.values()].reduce((sum, item) => sum + item.amount, 0)
  const netProfit = grossProfit + otherIncome - totalExpenses
  const netMarginPercent = totalSales > 0 ? (netProfit / totalSales) * 100 : 0

  return {
    salesByAccount: [...salesByAccount.values()],
    otherIncome,
    totalSales,
    cogs,
    grossProfit,
    grossMarginPercent,
    expensesByAccount: [...expensesByAccount.values()],
    totalExpenses,
    netProfit,
    netMarginPercent,
  }
}

export async function getProfitAndLoss(dateFrom: Date, dateTo: Date) {
  await checkFinanceAccess()
  const summary = await computeProfitAndLoss(dateFrom, dateTo)
  return { dateFrom, dateTo, ...summary }
}

export async function getBalanceSheet(asOfDate: Date) {
  await checkFinanceAccess()

  const lines = await prisma.journalLine.findMany({
    where: { journalEntry: { date: { lte: asOfDate } } },
    include: { account: true },
  })

  type AccountBalance = { code: string; name: string; balance: number }
  const byAccount = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>()
  for (const line of lines) {
    const account = line.account
    const existing =
      byAccount.get(account.id) || { code: account.code, name: account.name, type: account.type, debit: 0, credit: 0 }
    existing.debit += Number(line.debit)
    existing.credit += Number(line.credit)
    byAccount.set(account.id, existing)
  }

  const toBalances = (type: string, sign: 1 | -1): AccountBalance[] =>
    [...byAccount.values()]
      .filter((account) => account.type === type && (account.debit !== 0 || account.credit !== 0))
      .map((account) => ({
        code: account.code,
        name: account.name,
        balance: sign * (account.debit - account.credit),
      }))
      .sort((a, b) => a.code.localeCompare(b.code))

  const assets = toBalances("ASSET", 1)
  const liabilities = toBalances("LIABILITY", -1)
  const equity = toBalances("EQUITY", -1)

  // Retained Earnings: cumulative net profit from inception through asOfDate — the same P&L
  // formula, just with an unbounded start date instead of a reporting-period window.
  const { netProfit: retainedEarnings } = await computeProfitAndLoss(new Date(0), asOfDate)

  const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0)
  const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0) + retainedEarnings

  return {
    asOfDate,
    assets,
    liabilities,
    equity,
    retainedEarnings,
    totalAssets,
    totalLiabilities,
    totalEquity,
    balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
  }
}
