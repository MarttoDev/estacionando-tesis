export type View = 'explore' | 'bookings' | 'publish' | 'notifications' | 'messages' | 'profile'

export type AvailabilityWindow = { id: string; availabilityId: string; startTime: Date; endTime: Date }

export type Spot = {
  id: string
  title: string
  area: string
  comuna: string | null
  price: number
  type: string
  image: string
  latitude: number | null
  longitude: number | null
  availableWindows: AvailabilityWindow[]
}

export type ScanState = 'idle' | 'scanning' | 'done'
