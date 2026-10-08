import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/prisma'
import { SESSION_COOKIE_NAME } from './constants'
import type { SessionUser } from './types'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30
const RENEWAL_THRESHOLD_MS = SESSION_DURATION_MS / 2

function generateSessionToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function setSessionCookie(token: string, expiresAt: Date) {
  try {
    const store = await cookies()
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
  } catch {
    // Cookies can only be written from a Server Action or Route Handler. When the
    // sliding renewal below runs during a Server Component render, the DB-side
    // expiry is still extended; the cookie itself just renews on the next login.
  }
}

export async function createSession(userId: string) {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } })
  await setSessionCookie(token, expiresAt)
}

export async function getSessionToken() {
  const store = await cookies()
  return store.get(SESSION_COOKIE_NAME)?.value
}

export async function validateSessionToken(token: string): Promise<SessionUser | null> {
  const sessionId = hashToken(token)
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } })
  if (!session) return null

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: sessionId } })
    return null
  }

  if (session.expiresAt.getTime() - Date.now() < RENEWAL_THRESHOLD_MS) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
    await prisma.session.update({ where: { id: sessionId }, data: { expiresAt } })
    await setSessionCookie(token, expiresAt)
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    rut: session.user.rut,
    avatarUrl: session.user.avatarUrl,
    isAdmin: session.user.isAdmin,
    createdAt: session.user.createdAt,
  }
}

export async function invalidateCurrentSession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE_NAME)?.value

  if (token) {
    await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {})
  }

  store.delete(SESSION_COOKIE_NAME)
}

/** Invalidates every active session for a user — used after a password reset, so a
 *  stolen-but-now-outdated session can't keep using the account the real owner just reset. */
export async function invalidateAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } })
}
