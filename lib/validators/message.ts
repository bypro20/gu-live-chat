import { z } from 'zod'

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Mesaj boş olamaz').max(5000, 'Mesaj çok uzun'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>