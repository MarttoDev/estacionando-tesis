'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { notifyChange } from '@/lib/realtime/notify'
import { getConversationThread, type ConversationThread } from './queries'

/** Plain Server Action (not form-bound) so the client can re-fetch one open thread — e.g. on a
 *  realtime ping — without a full page refresh re-fetching every conversation's messages. */
export async function fetchConversationThreadAction(conversationId: string): Promise<ConversationThread | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return getConversationThread(conversationId, user.id)
}

export type StartConversationState = { error: string } | { success: true; conversationId: string } | undefined

/** Finds the existing (spot, renter) thread or creates it — a renter only ever gets one
 *  conversation per spot, regardless of how many times they message or book. */
export async function startConversationAction(_prevState: StartConversationState, formData: FormData): Promise<StartConversationState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para escribirle al anfitrión' }
  }

  const spotId = formData.get('spotId')
  if (typeof spotId !== 'string' || !spotId) {
    return { error: 'Espacio inválido' }
  }

  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId }, select: { ownerId: true } })
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }
  if (spot.ownerId === user.id) {
    return { error: 'No puedes escribirte a ti mismo' }
  }

  const conversation = await prisma.conversation.upsert({
    where: { spotId_renterId: { spotId, renterId: user.id } },
    update: {},
    create: { spotId, renterId: user.id, hostId: spot.ownerId },
  })

  return { success: true, conversationId: conversation.id }
}

export type SendMessageState = { error: string } | { success: true } | undefined

export async function sendMessageAction(_prevState: SendMessageState, formData: FormData): Promise<SendMessageState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const conversationId = formData.get('conversationId')
  const body = formData.get('body')
  if (typeof conversationId !== 'string' || !conversationId) {
    return { error: 'Conversación inválida' }
  }
  if (typeof body !== 'string' || !body.trim()) {
    return { error: 'Escribe un mensaje' }
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation || (conversation.hostId !== user.id && conversation.renterId !== user.id)) {
    return { error: 'Conversación no encontrada' }
  }

  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: user.id, body: body.trim().slice(0, 2000) } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
  ])
  await notifyChange('messages')

  return { success: true }
}

export type MarkConversationReadState = { error: string } | { success: true } | undefined

export async function markConversationReadAction(_prevState: MarkConversationReadState, formData: FormData): Promise<MarkConversationReadState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const conversationId = formData.get('conversationId')
  if (typeof conversationId !== 'string' || !conversationId) {
    return { error: 'Conversación inválida' }
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation || (conversation.hostId !== user.id && conversation.renterId !== user.id)) {
    return { error: 'Conversación no encontrada' }
  }

  const { count } = await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  })
  if (count > 0) await notifyChange('messages')

  return { success: true }
}
