import { cache } from 'react'
import { getSessionToken, validateSessionToken } from './session'
import type { SessionUser } from './types'

export const getCurrentUser = cache((): Promise<SessionUser | null> =>
  getSessionToken().then((token) => (token ? validateSessionToken(token) : null)),
)
