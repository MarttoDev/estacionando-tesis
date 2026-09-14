import { defineConfig } from 'prisma/config'

try {
  process.loadEnvFile('.env.local')
} catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
