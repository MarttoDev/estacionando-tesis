import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { diditStatusFrom } from '@/lib/verification/didit'

// Recibe el webhook de Didit cuando una verificación cambia de estado.
// TODO(seguridad): verificar la firma del webhook (Didit firma cada evento).
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const payload = body as { session_id?: string; vendor_data?: string }
  const vendorData = payload.vendor_data
  const status = diditStatusFrom(body)

  if (!vendorData) {
    return NextResponse.json({ ok: false, error: 'missing vendor_data' }, { status: 400 })
  }

  await prisma.identityVerification.updateMany({
    where: { userId: vendorData },
    data: {
      status,
      ...(payload.session_id ? { sessionId: payload.session_id } : {}),
      ...(status === 'VERIFIED' ? { verifiedAt: new Date() } : {}),
    },
  })

  return NextResponse.json({ ok: true })
}
