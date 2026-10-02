import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { ensureBaseAccounts } from "../lib/ledger"

const prisma = new PrismaClient()

type SeedField = { name: string; type: "NUMBER" | "PERCENTAGE" | "TEXT"; section: string }

async function seedReportTemplate(
  name: string,
  attachTo: "PURCHASE" | "PRODUCTION",
  appliesToProductType: string | null,
  description: string,
  fields: SeedField[],
) {
  const existing = await prisma.reportTemplate.findFirst({ where: { name } })
  if (existing) return existing

  return prisma.reportTemplate.create({
    data: {
      name,
      description,
      attachTo,
      appliesToProductType,
      fields: {
        create: fields.map((field, index) => ({
          name: field.name,
          type: field.type,
          section: field.section,
          isRequired: false,
          orderIndex: index,
        })),
      },
    },
  })
}

const PADDY_REPORT_QUALITY = [
  "Moisture",
  "Broken",
  "Trash",
  "Red Rice",
  "Green Grain",
  "Crack",
  "Fungus",
  "Fati Grain",
  "Shrivelled",
  "Dust",
  "Damage",
  "Tip Damage",
  "Immature Grain",
]
const PADDY_REPORT_VARIETY_MIXING = [
  "Super",
  "PK-386",
  "Supree",
  "KS-282",
  "Super Fine",
  "1509",
  "Chenab",
  "Kissan",
  "C-9",
  "1847",
  "1718",
]

const RICE_REPORT_VARIETY_MIXING = [
  "Total Mixing",
  "Super",
  "Supree",
  "Super Chinab",
  "KS-282",
  "Super Fine",
  "1509",
  "1847",
  "1718",
  "C-9",
  "109",
  "PB07",
]

const HUSKER_REPORT_INPUT = [
  "Moisture",
  "Paddy Broken",
  "Husker 1",
  "Husker 2",
  "Husker 3",
  "Husker 4",
  "Average Husker",
  "VTA 1",
  "VTA 2",
  "VTA 3",
  "VTA 4",
  "VTA Average",
  "Polisher 1",
  "Polisher 2",
  "Polisher Average",
  "Tip Damage",
  "Damage",
  "Red Rice",
]

async function main() {
  await ensureBaseAccounts(prisma)

  const passwordHash = await bcrypt.hash("password123", 10)

  const kilogram = await prisma.unitOfMeasure.upsert({
    where: { symbol: "KG" },
    update: { name: "Kilogram", isActive: true },
    create: { name: "Kilogram", symbol: "KG" },
  })

  const bag = await prisma.unitOfMeasure.upsert({
    where: { symbol: "BAG" },
    update: { name: "Bag", isActive: true },
    create: { name: "Bag", symbol: "BAG" },
  })

  const paddyCategory = await prisma.productCategory.upsert({
    where: { name: "Raw Paddy" },
    update: { isActive: true },
    create: { name: "Raw Paddy", description: "Purchased paddy and raw material" },
  })

  const riceCategory = await prisma.productCategory.upsert({
    where: { name: "Finished Rice" },
    update: { isActive: true },
    create: { name: "Finished Rice", description: "Finished rice products" },
  })

  await prisma.product.upsert({
    where: { sku: "PADDY-GENERIC" },
    update: { isActive: true, categoryId: paddyCategory.id, unitId: kilogram.id },
    create: {
      name: "Raw Paddy",
      sku: "PADDY-GENERIC",
      type: "RAW_MATERIAL",
      categoryId: paddyCategory.id,
      unitId: kilogram.id,
    },
  })

  await prisma.product.upsert({
    where: { sku: "RICE-GENERIC" },
    update: { isActive: true, categoryId: riceCategory.id, unitId: kilogram.id },
    create: {
      name: "Finished Rice",
      sku: "RICE-GENERIC",
      type: "FINISHED_GOOD",
      categoryId: riceCategory.id,
      unitId: kilogram.id,
      requiresQa: true,
    },
  })

  await prisma.product.upsert({
    where: { sku: "RICE-BAGS" },
    update: { isActive: true, categoryId: riceCategory.id, unitId: bag.id },
    create: {
      name: "Rice Bags",
      sku: "RICE-BAGS",
      type: "PACKAGING",
      categoryId: riceCategory.id,
      unitId: bag.id,
    },
  })

  await prisma.godown.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: { isActive: true, unitId: kilogram.id },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Main Paddy Godown",
      location: "Mill Site - Block A",
      capacity: 500000,
      unitId: kilogram.id,
    },
  })

  await prisma.companyProfile.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: { name: "Ricely", currency: "PKR" },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ricely",
      legalName: "Ricely Rice Mill",
      businessType: "Rice Mill & Trading",
      country: "Pakistan",
      currency: "PKR",
      defaultGodownId: "00000000-0000-0000-0000-000000000001",
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: passwordHash,
      name: "Admin User",
      role: "ADMIN",
    },
  })

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@example.com" },
    update: {},
    create: {
      email: "analyst@example.com",
      password: passwordHash,
      name: "Analyst User",
      role: "ANALYST",
    },
  })

  const qa = await prisma.user.upsert({
    where: { email: "qa@example.com" },
    update: {},
    create: {
      email: "qa@example.com",
      password: passwordHash,
      name: "QA User",
      role: "QA",
    },
  })

  const finance = await prisma.user.upsert({
    where: { email: "finance@example.com" },
    update: {},
    create: {
      email: "finance@example.com",
      password: passwordHash,
      name: "Finance Manager",
      role: "FINANCE_MANAGER",
    },
  })

  const paddyReport = await seedReportTemplate(
    "Paddy Report",
    "PURCHASE",
    "RAW_MATERIAL",
    "Paddy analysis report filled when receiving/buying paddy.",
    [
      ...PADDY_REPORT_QUALITY.map((name) => ({ name, type: "PERCENTAGE" as const, section: "Quality" })),
      ...PADDY_REPORT_VARIETY_MIXING.map((name) => ({
        name,
        type: "PERCENTAGE" as const,
        section: "Variety Mixing",
      })),
    ],
  )

  const riceReport = await seedReportTemplate(
    "Rice Report",
    "PURCHASE",
    "FINISHED_GOOD",
    "Rice analysis report filled when receiving/buying rice.",
    [
      { name: "Broken B1-B2", type: "PERCENTAGE", section: "Quality" },
      { name: "Tip Breakage", type: "PERCENTAGE", section: "Quality" },
      { name: "Short Grain", type: "PERCENTAGE", section: "Quality" },
      { name: "Shrivelled", type: "PERCENTAGE", section: "Quality" },
      { name: "Red Rice", type: "PERCENTAGE", section: "Quality" },
      { name: "Chalky Grain", type: "PERCENTAGE", section: "Quality" },
      { name: "Under Milled Grain", type: "PERCENTAGE", section: "Quality" },
      { name: "Insect Grain", type: "PERCENTAGE", section: "Quality" },
      { name: "A.G.L (mm)", type: "NUMBER", section: "Quality" },
      { name: "Damage", type: "PERCENTAGE", section: "Quality" },
      { name: "Light Damage", type: "PERCENTAGE", section: "Quality" },
      { name: "Moisture", type: "PERCENTAGE", section: "Quality" },
      { name: "Kett", type: "NUMBER", section: "Quality" },
      ...RICE_REPORT_VARIETY_MIXING.map((name) => ({
        name,
        type: "PERCENTAGE" as const,
        section: "Variety Mixing",
      })),
    ],
  )

  const huskerReport = await seedReportTemplate(
    "Husker Report",
    "PRODUCTION",
    null,
    "Daily unit husking report filled during milling — input readings vs final output readings.",
    [
      ...HUSKER_REPORT_INPUT.map((name) => ({ name, type: "PERCENTAGE" as const, section: "Input" })),
      { name: "Broken", type: "PERCENTAGE", section: "Final" },
      { name: "Short Grain", type: "PERCENTAGE", section: "Final" },
      { name: "Short Length Grain", type: "PERCENTAGE", section: "Final" },
      { name: "Tips Damage", type: "PERCENTAGE", section: "Final" },
      { name: "L/Y Damage", type: "PERCENTAGE", section: "Final" },
      { name: "AGL", type: "NUMBER", section: "Final" },
      { name: "Moisture", type: "PERCENTAGE", section: "Final" },
      { name: "Kett", type: "NUMBER", section: "Final" },
      { name: "Good Grain", type: "PERCENTAGE", section: "Sortex" },
      { name: "Tips Damage", type: "PERCENTAGE", section: "Sortex" },
      { name: "Dark Yellow", type: "PERCENTAGE", section: "Sortex" },
    ],
  )

  console.log({ admin, analyst, qa, finance, paddyReport, riceReport, huskerReport })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
