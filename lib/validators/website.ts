import { z } from 'zod'

export const createWebsiteSchema = z.object({
  name: z.string().min(2, 'Website adı en az 2 karakter olmalı'),
  domain: z.string().min(4, 'Geçerli bir domain girin'),
})

export const updateWebsiteSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.string().min(4).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir renk kodu girin').optional(),
  position: z.enum(['BOTTOM_RIGHT', 'BOTTOM_LEFT']).optional(),
  welcomeMessage: z.string().max(500).optional(),
  offlineMessage: z.string().max(500).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  showPreChatForm: z.boolean().optional(),
  requireName: z.boolean().optional(),
  requireEmail: z.boolean().optional(),
})

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>