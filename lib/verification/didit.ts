const DIDIT_BASE_URL = process.env.DIDIT_BASE_URL ?? 'https://verification.didit.me'
const DIDIT_API_KEY = process.env.DIDIT_API_KEY
const DIDIT_WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID

export type DiditSession = {
  session_id: string
  url: string
  status: string
  vendor_data?: string
}

export type DiditStatus = 'VERIFIED' | 'REJECTED' | 'PENDING'

/** Convierte la respuesta de Didit (sesión o webhook) al enum de nuestra app. */
export function diditStatusFrom(raw: unknown): DiditStatus {
  const obj = raw as { status?: string; decision?: { status?: string } }
  const value = String(obj?.decision?.status ?? obj?.status ?? '').toLowerCase()
  if (['approved', 'verified', 'passed', 'completed'].some((s) => value.includes(s))) return 'VERIFIED'
  if (['declined', 'rejected', 'failed'].some((s) => value.includes(s))) return 'REJECTED'
  return 'PENDING'
}

export async function createDiditSession(vendorData: string): Promise<DiditSession> {
  if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
    throw new Error('Didit no está configurado. Define DIDIT_API_KEY y DIDIT_WORKFLOW_ID.')
  }

  const callback = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/?verification=complete`

  const res = await fetch(`${DIDIT_BASE_URL}/v3/session/`, {
    method: 'POST',
    headers: {
      'x-api-key': DIDIT_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: vendorData,
      callback,
      language: 'es',
    }),
  })

  if (!res.ok) {
    throw new Error(`Didit respondió ${res.status}: ${await res.text()}`)
  }

  return (await res.json()) as DiditSession
}

export async function getDiditDecision(sessionId: string): Promise<unknown> {
  if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY no está definido')

  const res = await fetch(`${DIDIT_BASE_URL}/v3/session/${sessionId}/decision/`, {
    headers: { 'x-api-key': DIDIT_API_KEY },
  })

  if (!res.ok) throw new Error(`Didit respondió ${res.status}: ${await res.text()}`)

  return res.json()
}
