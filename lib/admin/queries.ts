import { prisma } from '@/lib/db/prisma'
import type { ReviewDirection, ReviewStatus } from '@prisma/client'

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

export type AdminReviewRow = {
  id: string
  direction: ReviewDirection
  rating: number
  comment: string | null
  authorName: string
  targetName: string
  spotTitle: string
  status: ReviewStatus
  removalReason: string | null
  appealMessage: string | null
  appealedAt: Date | null
  createdAt: Date
}

export type AdminDashboardData = {
  stats: AdminStats
  users: AdminUserRow[]
  spots: AdminSpotRow[]
  activeReservations: AdminReservationRow[]
  tasks: AdminTaskRow[]
  reviews: AdminReviewRow[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date()

  const [users, spots, totalReservations, activeReservationRows, tasks, reviewRows] = await Promise.all([
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
    prisma.review.findMany({
      include: {
        author: { select: { name: true } },
        target: { select: { name: true } },
        reservation: { select: { spot: { select: { title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
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
    reviews: [...reviewRows]
      .sort((a, b) => {
        const aPriority = a.status === 'APPEALED' ? 0 : 1
        const bPriority = b.status === 'APPEALED' ? 0 : 1
        return aPriority - bPriority || b.createdAt.getTime() - a.createdAt.getTime()
      })
      .map((r) => ({
        id: r.id,
        direction: r.direction,
        rating: r.rating,
        comment: r.comment,
        authorName: r.author.name,
        targetName: r.target.name,
        spotTitle: r.reservation.spot.title,
        status: r.status,
        removalReason: r.removalReason,
        appealMessage: r.appealMessage,
        appealedAt: r.appealedAt,
        createdAt: r.createdAt,
      })),
  }
}
