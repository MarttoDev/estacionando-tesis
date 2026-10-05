import { prisma } from '@/lib/db/prisma'

export type AdminUserRow = {
  id: string
  name: string
  email: string
  rut: string
  isAdmin: boolean
  createdAt: Date
  spotsCount: number
  reservationsCount: number
}

export type AdminSpotRow = {
  id: string
  title: string
  area: string
  comuna: string | null
  price: number
  ownerName: string
  ownerEmail: string
  isPublished: boolean
  isArchived: boolean
  /** Published, not archived, but every availability window has already ended — invisible to Explorar despite the "published" flag. */
  isExpired: boolean
  reservationsCount: number
  createdAt: Date
}

export type AdminReservationRow = {
  id: string
  spotTitle: string
  renterName: string
  renterEmail: string
  ownerName: string
  startTime: Date
  endTime: Date
  totalPrice: number
  confirmationCode: string
}

export type AdminStats = {
  totalUsers: number
  totalAdmins: number
  totalSpots: number
  publishedSpots: number
  totalReservations: number
  activeReservations: number
}

export type AdminTaskRow = {
  id: string
  epic: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  assignedTo: { id: string; name: string } | null
}

export type AdminDashboardData = {
  stats: AdminStats
  users: AdminUserRow[]
  spots: AdminSpotRow[]
  activeReservations: AdminReservationRow[]
  tasks: AdminTaskRow[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date()

  const [users, spots, totalReservations, activeReservationRows, tasks] = await Promise.all([
    prisma.user.findMany({
      include: { _count: { select: { parkingSpots: true, reservations: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.parkingSpot.findMany({
      include: { owner: true, _count: { select: { reservations: true, availabilities: { where: { endTime: { gt: now } } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reservation.count(),
    prisma.reservation.findMany({
      where: { status: 'CONFIRMED', endTime: { gt: now } },
      include: { spot: { include: { owner: true } }, user: true },
      orderBy: { startTime: 'asc' },
    }),
    prisma.task.findMany({
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { order: 'asc' },
    }),
  ])

  const activeReservations = activeReservationRows.length

  const stats: AdminStats = {
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.isAdmin).length,
    totalSpots: spots.length,
    publishedSpots: spots.filter((s) => s.isPublished).length,
    totalReservations,
    activeReservations,
  }

  return {
    stats,
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      rut: u.rut,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      spotsCount: u._count.parkingSpots,
      reservationsCount: u._count.reservations,
    })),
    spots: spots.map((s) => ({
      id: s.id,
      title: s.title,
      area: s.area,
      comuna: s.comuna,
      price: s.pricePerHour,
      ownerName: s.owner.name,
      ownerEmail: s.owner.email,
      isPublished: s.isPublished,
      isArchived: s.archivedAt !== null,
      isExpired: s.isPublished && s.archivedAt === null && s._count.availabilities === 0,
      reservationsCount: s._count.reservations,
      createdAt: s.createdAt,
    })),
    activeReservations: activeReservationRows.map((r) => ({
      id: r.id,
      spotTitle: r.spot.title,
      renterName: r.user.name,
      renterEmail: r.user.email,
      ownerName: r.spot.owner.name,
      startTime: r.startTime,
      endTime: r.endTime,
      totalPrice: r.totalPrice,
      confirmationCode: r.confirmationCode,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      epic: t.epic,
      title: t.title,
      status: t.status,
      assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name } : null,
    })),
  }
}
