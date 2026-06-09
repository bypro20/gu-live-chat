import { z } from 'zod'

const strongPassword = z
  .string()
  .min(10, 'Yeni şifre en az 10 karakter olmalı')
  .regex(/[a-z]/, 'En az bir küçük harf içermeli')
  .regex(/[A-Z]/, 'En az bir büyük harf içermeli')
  .regex(/[0-9]/, 'En az bir rakam içermeli')

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, 'Şifre tekrarı gerekli'),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Yeni şifreler eşleşmiyor',
        path: ['confirmPassword'],
      })
    }
    if (data.currentPassword === data.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Yeni şifre mevcut şifreden farklı olmalı',
        path: ['newPassword'],
      })
    }
  })

export const adminChangeEmailSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email('Geçerli bir e-posta adresi girin'),
  currentPassword: z.string().min(1, 'Mevcut şifre gerekli'),
})

export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>
export type AdminChangeEmailInput = z.infer<typeof adminChangeEmailSchema>
