'use server'

import { prisma } from '@/lib/db/prisma'
import { getCurrentUser } from '@/lib/auth/dal'
import { uploadImage } from '@/lib/storage/upload'
import { deleteOrArchiveSpot } from './delete-spot'
import { addAvailabilitySchema, createParkingSpotSchema, updateParkingSpotSchema } from './schemas'
import { notifyChange } from '@/lib/realtime/notify'

export type CreateSpotState =
  | { error: string }
  | { success: true; spot: { title: string; area: string; price: number } }
  | undefined

export async function createParkingSpotAction(_prevState: CreateSpotState, formData: FormData): Promise<CreateSpotState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión para publicar un espacio' }
  }

  const parsed = createParkingSpotSchema.safeParse({
    title: formData.get('title'),
    area: formData.get('area'),
    comuna: formData.get('comuna'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    parkingTypeId: formData.get('parkingTypeId'),
    pricePerHour: formData.get('pricePerHour'),
    availability: formData.get('availability'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { title, area, comuna, latitude, longitude, parkingTypeId, pricePerHour, availability } = parsed.data

  const parkingType = await prisma.parkingType.findUnique({ where: { id: parkingTypeId } })
  if (!parkingType) {
    return { error: 'Tipo de espacio inválido' }
  }

  let imageUrl: string | undefined
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const result = await uploadImage(photo, 'spots')
    if ('error' in result) {
      return { error: result.error }
    }
    imageUrl = result.url
  }

  await prisma.parkingSpot.create({
    data: {
      ownerId: user.id,
      title,
      area,
      comuna,
      latitude,
      longitude,
      parkingTypeId,
      pricePerHour,
      imageUrl,
      isPublished: true,
      availabilities: { createMany: { data: availability.map((window) => ({ startTime: window.startTime, endTime: window.endTime })) } },
    },
  })

  await notifyChange('parking_spots')

  return { success: true, spot: { title, area, price: pricePerHour } }
}

export type OwnerActionState = { error?: string; success?: boolean } | undefined

async function requireOwnedSpot(userId: string, spotId: string) {
  const spot = await prisma.parkingSpot.findUnique({ where: { id: spotId } })
  if (!spot || spot.ownerId !== userId) return null
  return spot
}

export async function updateParkingSpotAction(_prevState: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const parsed = updateParkingSpotSchema.safeParse({
    spotId: formData.get('spotId'),
    title: formData.get('title'),
    area: formData.get('area'),
    comuna: formData.get('comuna'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    parkingTypeId: formData.get('parkingTypeId'),
    pricePerHour: formData.get('pricePerHour'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { spotId, title, area, comuna, latitude, longitude, parkingTypeId, pricePerHour } = parsed.data

  const spot = await requireOwnedSpot(user.id, spotId)
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }

  const parkingType = await prisma.parkingType.findUnique({ where: { id: parkingTypeId } })
  if (!parkingType) {
    return { error: 'Tipo de espacio inválido' }
  }

  let imageUrl = spot.imageUrl ?? undefined
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const result = await uploadImage(photo, 'spots')
    if ('error' in result) {
      return { error: result.error }
    }
    imageUrl = result.url
  }

  await prisma.parkingSpot.update({
    where: { id: spotId },
    data: { title, area, comuna, latitude, longitude, parkingTypeId, pricePerHour, imageUrl },
  })

  await notifyChange('parking_spots')

  return { success: true }
}

export async function addAvailabilityAction(_prevState: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const parsed = addAvailabilitySchema.safeParse({
    spotId: formData.get('spotId'),
    availability: formData.get('availability'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { spotId, availability } = parsed.data

  const spot = await requireOwnedSpot(user.id, spotId)
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }

  await prisma.availability.createMany({
    data: availability.map((window) => ({ spotId, startTime: window.startTime, endTime: window.endTime })),
  })

  await notifyChange('parking_spots')

  return { success: true }
}

export async function setSpotPublishedAction(_prevState: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const spotId = formData.get('spotId')
  const isPublished = formData.get('isPublished') === 'true'
  if (typeof spotId !== 'string' || !spotId) {
    return { error: 'Espacio inválido' }
  }

  const spot = await requireOwnedSpot(user.id, spotId)
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }

  if (spot.archivedAt) {
    return { error: 'Este espacio fue eliminado y no se puede volver a publicar' }
  }

  await prisma.parkingSpot.update({ where: { id: spotId }, data: { isPublished } })

  await notifyChange('parking_spots')

  return { success: true }
}

export async function deleteSpotAction(_prevState: OwnerActionState, formData: FormData): Promise<OwnerActionState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const spotId = formData.get('spotId')
  if (typeof spotId !== 'string' || !spotId) {
    return { error: 'Espacio inválido' }
  }

  const spot = await requireOwnedSpot(user.id, spotId)
  if (!spot) {
    return { error: 'Espacio no encontrado' }
  }

  await deleteOrArchiveSpot(spotId)

  return { success: true }
}
