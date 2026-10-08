'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { hashPassword, verifyPassword } from './password'
import { createSession, invalidateCurrentSession, invalidateAllUserSessions } from './session'
import { createPasswordResetToken, consumePasswordResetToken } from './password-reset'
import { getCurrentUser } from './dal'
import { ADMIN_BOOTSTRAP_EMAIL } from './constants'
import { loginSchema, registerSchema, updatePasswordSchema, requestPasswordResetSchema, resetPasswordSchema } from './schemas'
import { uploadImage } from '@/lib/storage/upload'
import { sendEmail } from '@/lib/notifications/email'
import { passwordResetEmail } from '@/lib/notifications/templates'

export type AuthFormState = { error?: string } | undefined

export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    rut: formData.get('rut'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const { name, rut, email, password } = parsed.data

  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) {
    return { error: 'Ya existe una cuenta con ese email' }
  }

  const existingRut = await prisma.user.findUnique({ where: { rut } })
  if (existingRut) {
    return { error: 'Ya existe una cuenta con ese RUT' }
  }

  const passwordHash = await hashPassword(password)
  const isAdmin = email === ADMIN_BOOTSTRAP_EMAIL
  const user = await prisma.user.create({ data: { name, rut, email, passwordHash, isAdmin } })
  await createSession(user.id)

  redirect(isAdmin ? '/admin' : '/')
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Credenciales inválidas' }
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  const isValid = user ? await verifyPassword(password, user.passwordHash) : false

  if (!user || !isValid) {
    return { error: 'Credenciales inválidas' }
  }

  let isAdmin = user.isAdmin
  if (email === ADMIN_BOOTSTRAP_EMAIL && !isAdmin) {
    await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } })
    isAdmin = true
  }

  await createSession(user.id)
  redirect(isAdmin ? '/admin' : '/')
}

export async function logoutAction() {
  await invalidateCurrentSession()
  redirect('/login')
}

export type UpdatePasswordState = { error?: string; success?: boolean } | undefined

export async function updatePasswordAction(_prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  const isValid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash)
  if (!isValid) {
    return { error: 'Tu contraseña actual es incorrecta' }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  return { success: true }
}

export type UpdateAvatarState = { error?: string; success?: boolean } | undefined

export async function updateAvatarAction(_prevState: UpdateAvatarState, formData: FormData): Promise<UpdateAvatarState> {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Debes iniciar sesión' }
  }

  const photo = formData.get('avatar')
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: 'Selecciona una imagen' }
  }

  const result = await uploadImage(photo, 'avatars')
  if ('error' in result) {
    return { error: result.error }
  }

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: result.url } })

  return { success: true }
}

export type RequestPasswordResetState = { error?: string; success?: boolean } | undefined

export async function requestPasswordResetAction(_prevState: RequestPasswordResetState, formData: FormData): Promise<RequestPasswordResetState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Email inválido' }
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  // Siempre responde success, exista o no la cuenta — así nadie puede usar este formulario
  // para averiguar qué correos están registrados en la plataforma.
  if (user) {
    const token = await createPasswordResetToken(user.id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`
    await sendEmail({
      to: user.email,
      subject: 'Restablece tu contraseña — estacionando',
      html: passwordResetEmail({ resetUrl }),
    })
  }

  return { success: true }
}

export type ResetPasswordState = { error?: string; success?: boolean } | undefined

export async function resetPasswordAction(_prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const userId = await consumePasswordResetToken(parsed.data.token)
  if (!userId) {
    return { error: 'Este link ya expiró o no es válido. Solicita uno nuevo.' }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
  await invalidateAllUserSessions(userId)

  return { success: true }
}
