'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookings } from './bookings'
import { Explore } from './explore'
import { NotificationsView } from './notifications-view'
import { Profile } from './profile'
import { Publish } from './publish'
import { SiteChrome } from './site-chrome'
import { useRealtimeRefresh } from '@/hooks/use-realtime-refresh'
import type { ScanState, Spot, View } from '@/lib/estacionando/types'
import type { SessionUser } from '@/lib/auth/types'
import type { ReservationView } from '@/lib/reservations/queries'
import type { OwnerSpot } from '@/lib/parking-spots/queries'
import type { NotificationItem } from '@/lib/notifications/queries'

type ParkingTypeOption = { id: string; name: string }

export function AppShell({ user, spots, parkingTypes, reservations, ownerSpots, notifications }: { user: SessionUser | null; spots: Spot[]; parkingTypes: ParkingTypeOption[]; reservations: ReservationView[]; ownerSpots: OwnerSpot[]; notifications: NotificationItem[] }) {
  const [view, setView] = useState<View>('explore')
  const [query, setQuery] = useState('')
  const [comuna, setComuna] = useState('')
  const [liked, setLiked] = useState<string[]>([])
  const [selected, setSelected] = useState<Spot | null>(null)
  const [verified, setVerified] = useState(false)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const router = useRouter()
  useRealtimeRefresh(['parking_spots', 'reservations', 'notifications'])
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

  return <main className="min-h-screen bg-background text-foreground"><SiteChrome view={view} nav={nav} selected={selected} closeSpot={() => setSelected(null)} onReserved={onReserved} user={user} notifications={notifications}><>{view === 'explore' && <Explore query={query} setQuery={setQuery} comuna={comuna} setComuna={setComuna} comunas={comunas} filtered={filtered} liked={liked} toggleLike={(id) => setLiked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onSelect={setSelected} nav={nav} />}{view === 'bookings' && <Bookings user={user} reservations={reservations} onExplore={() => nav('explore')} />}{view === 'publish' && <Publish user={user} parkingTypes={parkingTypes} ownerSpots={ownerSpots} />}{view === 'notifications' && <NotificationsView user={user} notifications={notifications} />}{view === 'profile' && <Profile user={user} verified={verified} scanState={scanState} startScan={startScan} reservationsMadeCount={reservations.length} reservationsReceivedCount={ownerSpots.reduce((sum, spot) => sum + spot.totalReservationCount, 0)} spotsPublishedCount={ownerSpots.length} />}</></SiteChrome></main>
}
