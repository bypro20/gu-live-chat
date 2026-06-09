import { z } from 'zod'

const messageAttachmentSchema = z.object({
  url: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().optional(),
})

export const sendMessageSchema = z
  .object({
    content: z.string().max(5000, 'Mesaj çok uzun').default(''),
    type: z.enum(['TEXT', 'IMAGE', 'FILE']).default('TEXT'),
    attachment: messageAttachmentSchema.optional(),
  })
  .refine((data) => data.content.trim().length > 0 || data.attachment, {
    message: 'Mesaj boş olamaz',
    path: ['content'],
  })

export type SendMessageInput = z.infer<typeof sendMessageSchema>