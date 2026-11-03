'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { createDiditSession, getDiditDecision, diditStatusFrom } from './didit'

export type VerificationActionState = { error?: string; url?: string } | undefined

export async function startIdentityVerificationAction(): Promise<VerificationActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'Debes iniciar sesión para verificar tu identidad.' }

  try {
    const session = await createDiditSession(user.id)
    await prisma.identityVerification.upsert({
      where: { userId: user.id },
      create: { userId: user.id, provider: 'didit', sessionId: session.session_id, status: 'PENDING' },
      update: { provider: 'didit', sessionId: session.session_id, status: 'PENDING' },
    })
    return { url: session.url }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'No se pudo iniciar la verificación.' }
  }
}

export async function refreshIdentityVerificationAction() {
  const user = await getCurrentUser()
  if (!user) return

  const row = await prisma.identityVerification.findUnique({ where: { userId: user.id } })
  if (!row?.sessionId) return

  try {
    const decision = await getDiditDecision(row.sessionId)
    const status = diditStatusFrom(decision)
    if (status !== row.status) {
      await prisma.identityVerification.update({
        where: { userId: user.id },
        data: { status, verifiedAt: status === 'VERIFIED' ? new Date() : row.verifiedAt },
      })
    }
  } catch {
    // Didit no disponible o la sesión aún no tiene decisión: se mantiene el estado actual.
  }
}
