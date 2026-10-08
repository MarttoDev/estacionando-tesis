import { z } from 'zod'
import { isValidRut, normalizeRut } from './rut'

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresa tu nombre completo').max(80),
    rut: z
      .string()
      .trim()
      .transform(normalizeRut)
      .refine(isValidRut, 'Ingresa un RUT chileno válido (ej. 12345678-9)'),
    email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden',
    path: ['confirmPassword'],
  })

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Link inválido'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
