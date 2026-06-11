import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z.string().min(2, 'İsim en az 2 karakter olmalı'),
    email: z.string().email('Geçerli bir e-posta adresi girin'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
    confirmPassword: z.string(),
    websiteName: z.string().optional(),
    websiteDomain: z.string().optional(),
    inviteToken: z.string().optional(),
    utmSource: z.string().max(120).optional(),
    utmMedium: z.string().max(120).optional(),
    utmCampaign: z.string().max(120).optional(),
    utmContent: z.string().max(120).optional(),
    utmTerm: z.string().max(120).optional(),
    signupReferrer: z.string().max(500).optional(),
    referralCode: z.string().max(64).optional(),
    signupLandingPage: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Şifreler eşleşmiyor',
        path: ['confirmPassword'],
      })
    }
    if (!data.inviteToken) {
      if (!data.websiteName || data.websiteName.length < 2) {
        ctx.addIssue({
          code: 'custom',
          message: 'Website adı en az 2 karakter olmalı',
          path: ['websiteName'],
        })
      }
      if (!data.websiteDomain || data.websiteDomain.length < 4) {
        ctx.addIssue({
          code: 'custom',
          message: 'Geçerli bir domain girin',
          path: ['websiteDomain'],
        })
      }
    }
  })

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(1, 'Şifre gerekli'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>