import { PrismaClient } from '@prisma/client'

try {
  process.loadEnvFile('.env.local')
} catch {}

const prisma = new PrismaClient()

const PARKING_TYPES = ['Techado', 'Privado', 'Al aire libre', 'Con seguridad']

async function main() {
  for (const name of PARKING_TYPES) {
    await prisma.parkingType.upsert({ where: { name }, update: {}, create: { name } })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
