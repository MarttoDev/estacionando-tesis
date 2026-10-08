import { prisma } from '@/lib/db/prisma'

export type ConversationPreview = {
  id: string
  spotId: string
  spotTitle: string
  otherPartyId: string
  otherPartyName: string
  lastMessage: { body: string; createdAt: Date; isMine: boolean } | null
  unreadCount: number
  updatedAt: Date
}

export async function getUserConversations(userId: string): Promise<ConversationPreview[]> {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ hostId: userId }, { renterId: userId }] },
    include: {
      spot: { select: { title: true } },
      host: { select: { id: true, name: true } },
      renter: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: { where: { senderId: { not: userId }, readAt: null } } } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return conversations.map((c) => {
    const isHost = c.hostId === userId
    const otherParty = isHost ? c.renter : c.host
    const last = c.messages[0]
    return {
      id: c.id,
      spotId: c.spotId,
      spotTitle: c.spot.title,
      otherPartyId: otherParty.id,
      otherPartyName: otherParty.name,
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, isMine: last.senderId === userId } : null,
      unreadCount: c._count.messages,
      updatedAt: c.updatedAt,
    }
  })
}

export type MessageItem = { id: string; body: string; createdAt: Date; isMine: boolean }

export type ConversationThread = {
  id: string
  spotId: string
  spotTitle: string
  otherPartyId: string
  otherPartyName: string
  messages: MessageItem[]
}

/** Returns null if the conversation doesn't exist or `userId` isn't one of its two participants. */
export async function getConversationThread(conversationId: string, userId: string): Promise<ConversationThread | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      spot: { select: { title: true } },
      host: { select: { id: true, name: true } },
      renter: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!conversation) return null
  const isParticipant = conversation.hostId === userId || conversation.renterId === userId
  if (!isParticipant) return null

  const isHost = conversation.hostId === userId
  const otherParty = isHost ? conversation.renter : conversation.host

  return {
    id: conversation.id,
    spotId: conversation.spotId,
    spotTitle: conversation.spot.title,
    otherPartyId: otherParty.id,
    otherPartyName: otherParty.name,
    messages: conversation.messages.map((m) => ({ id: m.id, body: m.body, createdAt: m.createdAt, isMine: m.senderId === userId })),
  }
}
