'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookings } from './bookings'
import { Explore } from './explore'
import { MessagesView } from './messages-view'
import { NotificationsView } from './notifications-view'
import { Profile } from './profile'
import { Publish } from './publish'
import { PaymentReceiptModal } from './payment-receipt-modal'
import { SiteChrome } from './site-chrome'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import { startConversationAction } from '@/lib/messages/actions'
import type { ScanState, Spot, View } from '@/lib/estacionando/types'
import type { SessionUser } from '@/lib/auth/types'
import type { ReservationView } from '@/lib/reservations/queries'
import type { OwnerSpot } from '@/lib/parking-spots/queries'
import type { NotificationItem } from '@/lib/notifications/queries'
import type { ConversationPreview } from '@/lib/messages/queries'

type ParkingTypeOption = { id: string; name: string }

export function AppShell({
  user,
  spots,
  parkingTypes,
  reservations,
  ownerSpots,
  notifications,
  conversations,
  paymentNotice,
  paymentReservationId,
}: {
  user: SessionUser | null
  spots: Spot[]
  parkingTypes: ParkingTypeOption[]
  reservations: ReservationView[]
  ownerSpots: OwnerSpot[]
  notifications: NotificationItem[]
  conversations: ConversationPreview[]
  paymentNotice: 'success' | 'failed' | 'error' | null
  paymentReservationId: string | null
}) {
  const paidReservation = paymentNotice === 'success' ? reservations.find((r) => r.id === paymentReservationId) ?? null : null
  const [view, setView] = useState<View>(paymentNotice ? 'bookings' : 'explore')
  const [banner, setBanner] = useState(paymentNotice && !paidReservation ? paymentNotice : null)
  const [showReceipt, setShowReceipt] = useState(Boolean(paidReservation))
  const [query, setQuery] = useState('')
  const [comuna, setComuna] = useState('')
  const [liked, setLiked] = useState<string[]>([])
  const [selected, setSelected] = useState<Spot | null>(null)
  const [verified, setVerified] = useState(false)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [openConversationId, setOpenConversationId] = useState<string | null>(null)
  const router = useRouter()
  useRealtimeRefresh(['parking_spots', 'reservations', 'notifications', 'messages'])
  useEffect(() => {
    if (paymentNotice) router.replace('/')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const comunas = useMemo(() => Array.from(new Set(spots.map((spot) => spot.comuna).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'es')), [spots])
  const filtered = useMemo(
    () => spots.filter((spot) => `${spot.title} ${spot.area}`.toLowerCase().includes(query.toLowerCase()) && (!comuna || spot.comuna === comuna)),
    [spots, query, comuna],
  )

  function startScan() {
    setScanState('scanning')
    window.setTimeout(() => { setScanState('done'); setVerified(true) }, 1800)
  }

  function nav(next: View) {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onReserved() {
    setSelected(null)
    nav('bookings')
    router.refresh()
  }

  function openMessages() {
    setOpenConversationId(null)
    nav('messages')
  }

  async function startConversation(spotId: string) {
    const formData = new FormData()
    formData.set('spotId', spotId)
    const result = await startConversationAction(undefined, formData)
    if (result && 'success' in result) {
      setOpenConversationId(result.conversationId)
      nav('messages')
    }
    return result
  }

  return <main className="min-h-screen bg-background text-foreground">{banner && <div className={`sticky top-0 z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-medium ${banner === 'success' ? 'bg-accent text-accent-foreground' : 'bg-destructive text-destructive-foreground'}`}><span>{banner === 'success' ? 'Tu pago se confirmó, tu reserva quedó lista.' : banner === 'failed' ? 'El pago no se completó y el horario quedó liberado.' : 'No pudimos validar tu pago, revisa tus reservas.'}</span><button onClick={() => setBanner(null)} className="rounded-full bg-black/10 px-2 py-0.5 text-xs">Cerrar</button></div>}{showReceipt && paidReservation && <PaymentReceiptModal receipt={{ spotTitle: paidReservation.spotTitle, spotArea: paidReservation.spotArea, startTime: paidReservation.startTime, endTime: paidReservation.endTime, totalPrice: paidReservation.totalPrice, confirmationCode: paidReservation.confirmationCode, authorizationCode: paidReservation.payment?.authorizationCode ?? null, cardLastDigits: paidReservation.payment?.cardLastDigits ?? null, paidAt: paidReservation.payment?.paidAt ?? null }} onClose={() => setShowReceipt(false)} />}<SiteChrome view={view} nav={nav} selected={selected} closeSpot={() => setSelected(null)} onReserved={onReserved} user={user} notifications={notifications} conversations={conversations} startConversation={startConversation} openMessages={openMessages}><>{view === 'explore' && <Explore query={query} setQuery={setQuery} comuna={comuna} setComuna={setComuna} comunas={comunas} filtered={filtered} liked={liked} toggleLike={(id) => setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onSelect={setSelected} nav={nav} />}{view === 'bookings' && <Bookings user={user} reservations={reservations} onExplore={() => nav('explore')} onMessageHost={startConversation} />}{view === 'publish' && <Publish user={user} parkingTypes={parkingTypes} ownerSpots={ownerSpots} />}{view === 'notifications' && <NotificationsView user={user} notifications={notifications} />}{view === 'messages' && <MessagesView user={user} conversations={conversations} initialConversationId={openConversationId} />}{view === 'profile' && <Profile user={user} verified={verified} scanState={scanState} startScan={startScan} reservationsMadeCount={reservations.length} reservationsReceivedCount={ownerSpots.reduce((sum, spot) => sum + spot.totalReservationCount, 0)} spotsPublishedCount={ownerSpots.length} />}</></SiteChrome></main>
}
