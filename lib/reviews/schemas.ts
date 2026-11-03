import { z } from 'zod'

const optionalComment = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : null))
  .refine((value) => value === null || value.length <= 1000, 'El comentario no puede superar 1000 caracteres')

export const createReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('La calificación debe ser un número entero')
    .min(1, 'Califica de 1 a 5 estrellas')
    .max(5, 'Califica de 1 a 5 estrellas'),
  comment: optionalComment,
})

export const appealReviewSchema = z.object({
  appealMessage: z.string().trim().min(1, 'Escribe el motivo de tu apelación').max(1000, 'Máximo 1000 caracteres'),
})
