import crypto from 'node:crypto'
import { prisma } from '@/lib/db/prisma'

const RESET_TOKEN_DURATION_MS = 1000 * 60 * 60 // 1 hora

function generateResetToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/** Creates a reset token for `userId` and returns the raw (unhashed) token to email out.
 *  Clears any reset token the user already had — only the most recent link stays valid. */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = generateResetToken()
  const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION_MS)

  await prisma.passwordResetToken.deleteMany({ where: { userId } })
  await prisma.passwordResetToken.create({ data: { id: hashToken(token), userId, expiresAt } })

  return token
}

/** Validates and immediately deletes the token (single use) — returns the userId it belonged
 *  to, or null if the token doesn't exist or already expired. */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const id = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({ where: { id } })
  if (!record) return null

  await prisma.passwordResetToken.delete({ where: { id } }).catch(() => {})

  if (record.expiresAt < new Date()) return null

  return record.userId
}
