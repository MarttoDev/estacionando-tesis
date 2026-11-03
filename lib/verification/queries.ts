import { prisma } from '@/lib/db/prisma'
import type { VerificationStatus } from '@prisma/client'

export type VerificationView = {
  status: VerificationStatus
  sessionId: string | null
  verifiedAt: Date | null
}

export async function getIdentityVerification(userId: string): Promise<VerificationView | null> {
  const row = await prisma.identityVerification.findUnique({ where: { userId } })
  if (!row) return null
  return { status: row.status, sessionId: row.sessionId, verifiedAt: row.verifiedAt }
}
