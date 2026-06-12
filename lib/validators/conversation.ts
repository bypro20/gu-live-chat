import { z } from 'zod'

export const createConversationSchema = z.object({
  visitorToken: z.string(),
  message: z.string().min(1).max(5000),
})

export const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED', 'CLOSED']).optional(),
  assignedToId: z.string().nullable().optional(),
  visitorLang: z.string().min(2).max(10).optional(),
})

export const assignConversationSchema = z.object({
  userId: z.string(),
})

export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>