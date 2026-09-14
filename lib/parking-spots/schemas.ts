import { z } from 'zod'

const availabilityWindowSchema = z
  .object({ start: z.string(), end: z.string() })
  .transform((value, ctx) => {
    const startTime = new Date(value.start)
    const endTime = new Date(value.end)

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Fecha u hora inválida' })
      return z.NEVER
    }

    if (endTime <= startTime) {
      ctx.addIssue({ code: 'custom', message: 'La hora de término debe ser posterior a la de inicio' })
      return z.NEVER
    }

    return { startTime, endTime }
  })

const availabilityListSchema = z
  .string()
  .transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'Agrega al menos un horario disponible' })
        return z.NEVER
      }
      return parsed
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Formato de disponibilidad inválido' })
      return z.NEVER
    }
  })
  .pipe(z.array(availabilityWindowSchema).min(1, 'Agrega al menos un horario disponible'))

const optionalComuna = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : null))

const optionalCoordinate = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? Number(value) : null))
  .refine((value) => value === null || Number.isFinite(value), 'Coordenada inválida')

export const createParkingSpotSchema = z.object({
  title: z.string().trim().min(2, 'Ingresa un título').max(80),
  area: z.string().trim().min(2, 'Ingresa la comuna o sector').max(100),
  comuna: optionalComuna,
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  parkingTypeId: z.string().trim().min(1, 'Selecciona un tipo de espacio'),
  pricePerHour: z.coerce.number().int('El precio debe ser un número entero').positive('El precio debe ser mayor a 0'),
  availability: availabilityListSchema,
})

export const updateParkingSpotSchema = z.object({
  spotId: z.string().trim().min(1),
  title: z.string().trim().min(2, 'Ingresa un título').max(80),
  area: z.string().trim().min(2, 'Ingresa la comuna o sector').max(100),
  comuna: optionalComuna,
  latitude: optionalCoordinate,
  longitude: optionalCoordinate,
  parkingTypeId: z.string().trim().min(1, 'Selecciona un tipo de espacio'),
  pricePerHour: z.coerce.number().int('El precio debe ser un número entero').positive('El precio debe ser mayor a 0'),
})

export const addAvailabilitySchema = z.object({
  spotId: z.string().trim().min(1),
  availability: availabilityListSchema,
})
