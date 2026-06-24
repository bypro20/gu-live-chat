export type AdminMailSource = 'contact-form' | 'organic-marketing' | 'system'
export type AdminMailStatus = 'unread' | 'read' | 'archived'

export type AdminMailMessage = {
  id: string
  source: AdminMailSource
  fromName: string | null
  fromEmail: string | null
  subject: string
  body: string
  htmlBody: string | null
  status: AdminMailStatus
  starred: boolean
  metadata: Record<string, unknown> | null
  repliedAt: string | null
  replyBody: string | null
  createdAt: string
  updatedAt: string
}

export const ADMIN_MAIL_SOURCE_LABELS: Record<AdminMailSource, string> = {
  'contact-form': 'İletişim Formu',
  'organic-marketing': 'Pazarlama Botu',
  system: 'Sistem',
}
