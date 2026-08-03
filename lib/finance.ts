export const DEFAULT_EXPENSE_CATEGORIES = [
  "Electricity",
  "Salaries",
  "Fuel",
  "Travel",
  "Maintenance",
  "Machinery Repair",
  "Office Expenses",
  "Packing Material",
  "Transportation",
  "Internet",
  "Security",
  "Rent",
  "Taxes",
  "Miscellaneous",
  "Paddy Purchase",
  "Processing",
] as const

export const FINANCE_SOURCE = {
  LOT_SALE: "LOT_SALE",
  LOT_PADDY: "LOT_PADDY",
  LOT_PROCESSING: "LOT_PROCESSING",
  SALARY: "SALARY",
} as const

export type FinanceSourceType = (typeof FINANCE_SOURCE)[keyof typeof FINANCE_SOURCE]

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

export function getMonthDateRange(month: string, year: number) {
  const monthIndex = MONTHS.findIndex((m) => m === month)
  if (monthIndex < 0) {
    throw new Error("Invalid month")
  }
  const startDate = new Date(year, monthIndex, 1)
  const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return { startDate, endDate }
}

export function getCurrentMonthYear() {
  const now = new Date()
  return {
    month: MONTHS[now.getMonth()],
    year: now.getFullYear(),
  }
}
