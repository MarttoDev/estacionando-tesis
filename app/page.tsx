import { AppShell } from '@/components/estacionando/app-shell'
import { getCurrentUser } from '@/lib/auth/dal'
import { getOwnerSpots, getParkingTypes, getPublishedSpots } from '@/lib/parking-spots/queries'
import { getUserReservations } from '@/lib/reservations/queries'
import { getUserNotifications } from '@/lib/notifications/queries'

export default async function Page() {
  const [user, spots, parkingTypes] = await Promise.all([getCurrentUser(), getPublishedSpots(), getParkingTypes()])
  const [reservations, ownerSpots, notifications] = await Promise.all([
    user ? getUserReservations(user.id) : Promise.resolve([]),
    user ? getOwnerSpots(user.id) : Promise.resolve([]),
    user ? getUserNotifications(user.id) : Promise.resolve([]),
  ])
  return <AppShell user={user} spots={spots} parkingTypes={parkingTypes} reservations={reservations} ownerSpots={ownerSpots} notifications={notifications} />
}
