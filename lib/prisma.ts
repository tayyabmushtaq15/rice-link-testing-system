import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Remote (Supabase) database: every query pays network latency, so multi-step transactions
// need far more than Prisma's 5s default to finish.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ transactionOptions: { maxWait: 15_000, timeout: 30_000 } })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
