import { prisma } from './db'
import { NotificationType } from '../app/generated/prisma/client'

// ─── Types ────────────────────────────────────────────────────────

interface CreateNotificationParams {
  userId: string
  websiteId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
}

// ─── Create Notification ───────────────────────────────────────────

export async function createNotification({
  userId,
  websiteId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId,
      websiteId,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    },
  })
}

// ─── Create Notification for All Website Members ───────────────────

export async function notifyWebsiteMembers(params: {
  websiteId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  excludeUserId?: string
}) {
  const { websiteId, type, title, message, data, excludeUserId } = params

  const members = await prisma.teamMember.findMany({
    where: { websiteId },
    select: { userId: true },
  })

  const notifications = await Promise.all(
    members
      .filter((m) => m.userId !== excludeUserId)
      .map((member) =>
        createNotification({
          userId: member.userId,
          websiteId,
          type,
          title,
          message,
          data,
        })
      )
  )

  return notifications
}

// ─── Notification Helpers (specific types) ─────────────────────────

export async function notifyNewConversation(
  websiteId: string,
  visitorName: string,
  conversationId: string,
  assignedUserId?: string
) {
  const targetUserId = assignedUserId
  if (targetUserId) {
    return createNotification({
      userId: targetUserId,
      websiteId,
      type: 'NEW_CONVERSATION',
      title: 'Yeni konuşma',
      message: `${visitorName} yeni bir konuşma başlattı`,
      data: { conversationId },
    })
  }
  return notifyWebsiteMembers({
    websiteId,
    type: 'NEW_CONVERSATION',
    title: 'Yeni konuşma',
    message: `${visitorName} yeni bir konuşma başlattı`,
    data: { conversationId },
  })
}

export async function notifyNewMessage(
  websiteId: string,
  senderName: string,
  conversationId: string,
  recipientUserId: string
) {
  return createNotification({
    userId: recipientUserId,
    websiteId,
    type: 'NEW_MESSAGE',
    title: 'Yeni mesaj',
    message: `${senderName} bir mesaj gönderdi`,
    data: { conversationId },
  })
}

export async function notifyConversationAssigned(
  websiteId: string,
  conversationId: string,
  assignedUserId: string,
  assignedByName: string
) {
  return createNotification({
    userId: assignedUserId,
    websiteId,
    type: 'CONVERSATION_ASSIGNED',
    title: 'Konuşma atandı',
    message: `${assignedByName} size bir konuşma atadı`,
    data: { conversationId },
  })
}

export async function notifyConversationResolved(
  websiteId: string,
  conversationId: string,
  resolverName: string,
  excludeUserId?: string
) {
  return notifyWebsiteMembers({
    websiteId,
    type: 'CONVERSATION_RESOLVED',
    title: 'Konuşma çözüldü',
    message: `${resolverName} bir konuşmayı çözdü olarak işaretledi`,
    data: { conversationId },
    excludeUserId,
  })
}

export async function notifyTeamMemberJoined(
  websiteId: string,
  newMemberName: string,
  newMemberId: string,
  excludeUserId?: string
) {
  return notifyWebsiteMembers({
    websiteId,
    type: 'TEAM_MEMBER_JOINED',
    title: 'Yeni takım üyesi',
    message: `${newMemberName} takıma katıldı`,
    data: { newMemberId },
    excludeUserId,
  })
}

export async function notifyPlanUpgraded(
  websiteId: string,
  newPlan: string,
  userId: string
) {
  return createNotification({
    userId,
    websiteId,
    type: 'PLAN_UPGRADED',
    title: 'Plan yükseltildi',
    message: `Planınız ${newPlan} planına yükseltildi`,
    data: { newPlan },
  })
}

export async function notifyPaymentFailed(
  websiteId: string,
  userId: string
) {
  return createNotification({
    userId,
    websiteId,
    type: 'PAYMENT_FAILED',
    title: 'Ödeme başarısız',
    message: 'Plan ödemeniz gerçekleştirilemedi. Lütfen ödeme bilgilerinizi kontrol edin.',
  })
}

export async function notifyPaymentSuccess(
  websiteId: string,
  userId: string,
  planName: string
) {
  return createNotification({
    userId,
    websiteId,
    type: 'PAYMENT_SUCCESS',
    title: 'Ödeme başarılı',
    message: `${planName} planı ödemeniz başarıyla gerçekleştirildi`,
  })
}

export async function notifyLimitWarning(
  websiteId: string,
  userId: string,
  feature: string,
  current: number,
  limit: number
) {
  return createNotification({
    userId,
    websiteId,
    type: 'LIMIT_WARNING',
    title: 'Limit uyarısı',
    message: `${feature} limitinize (${limit}) yaklaşılıyor (${current}/${limit})`,
    data: { feature, current, limit },
  })
}

export async function notifyTrialExpiring(
  websiteId: string,
  userId: string,
  daysLeft: number
) {
  return createNotification({
    userId,
    websiteId,
    type: 'TRIAL_EXPIRING',
    title: 'Deneme süresi doluyor',
    message: `Deneme sürenizin dolmasına ${daysLeft} gün kaldı`,
    data: { daysLeft },
  })
}