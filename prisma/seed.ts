import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@example.com' },
    update: {},
    create: {
      email: 'analyst@example.com',
      password: passwordHash,
      name: 'Analyst User',
      role: 'ANALYST',
    },
  })

  const qa = await prisma.user.upsert({
    where: { email: 'qa@example.com' },
    update: {},
    create: {
      email: 'qa@example.com',
      password: passwordHash,
      name: 'QA User',
      role: 'QA',
    },
  })

  console.log({ admin, analyst, qa })
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
