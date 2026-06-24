import { listAdminMailMessages } from '@/lib/admin-mail-inbox'
import { isEmailConfigured } from '@/lib/email'
import {
  channelPublishReady,
  getMarketingPublishCredentials,
} from '@/lib/marketing-publish'
import { getOrganicAutomationConfig } from '@/lib/organic-marketing/automation-config'
import { dispatchSocialContent } from '@/lib/organic-marketing/social-dispatcher'
import { getPaidAutomationConfig } from '@/lib/paid-marketing/automation-config'
import { sendPaidMarketingDigest } from '@/lib/paid-marketing/dispatcher'
import { getTodayAdTasks } from '@/lib/paid-marketing/generator'
import { ensurePaidPlanInitialized } from '@/lib/paid-marketing/storage'
import { getMailNotifyTo } from '@/lib/site-config'
import type { ContentTask } from '@/lib/organic-marketing/types'

function maskEmail(email: string | null): string | null {
  if (!email) return null
  const [user, domain] = email.split('@')
  if (!domain) return email
  const visible = user.length <= 2 ? user[0] : `${user.slice(0, 2)}***`
  return `${visible}@${domain}`
}

function isOwnDomainEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain === 'gulivechat.com' || domain === 'www.gulivechat.com'
}

export async function getOrganicMarketingHealth() {
  const config = await getOrganicAutomationConfig()
  const creds = await getMarketingPublishCredentials()
  const deliverTo = getMailNotifyTo()
  const webhookUrl = config.webhookUrl.trim()
  const mail = await listAdminMailMessages({ source: 'organic-marketing', limit: 5 })
  const latest = mail[0] ?? null

  return {
    automation: {
      enabled: config.enabled,
      autoPublishBlog: config.autoPublishBlog,
      autoDispatchSocial: config.autoDispatchSocial,
      lastRunAt: config.lastRunAt,
      lastRunSummary: config.lastRunSummary,
      runCount: config.runCount,
    },
    email: {
      providerConfigured: isEmailConfigured(),
      deliverTo: maskEmail(deliverTo),
      deliverToOk: Boolean(deliverTo),
      notifyEmailField: config.notifyEmail,
      notifyEmailUsable:
        Boolean(deliverTo) ||
        (Boolean(config.notifyEmail) && !isOwnDomainEmail(config.notifyEmail)),
      note: deliverTo
        ? `Dış e-posta: ${maskEmail(deliverTo)}`
        : isOwnDomainEmail(config.notifyEmail)
          ? '@gulivechat.com adresine doğrudan mail gitmez — webhook veya E-posta Merkezi kullanılır'
          : 'E-posta hedefi tanımlı değil',
    },
    webhook: {
      configured: Boolean(webhookUrl),
      url: webhookUrl ? (webhookUrl.includes('gulivechat.com') ? webhookUrl : `${webhookUrl.slice(0, 40)}…`) : null,
      isInternalDispatch: webhookUrl.includes('/api/internal/organic-marketing-dispatch'),
      note: webhookUrl.includes('/api/internal/organic-marketing-dispatch')
        ? 'İç webhook: içerik Admin → E-posta Merkezi kutusuna düşer'
        : webhookUrl
          ? 'Harici webhook (Zapier/Make vb.)'
          : 'Webhook yok — e-posta veya kuyruk',
    },
    cron: {
      secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
      scheduleTr: '07:00, 13:00, 19:00, 01:00',
    },
    inbox: {
      recentCount: mail.length,
      latestSubject: latest?.subject ?? null,
      latestAt: latest?.createdAt ?? null,
    },
    autoPublish: {
      enabled: creds.autoPublishSocial,
      facebook: channelPublishReady('facebook', creds),
      instagram: channelPublishReady('instagram', creds),
      linkedin: channelPublishReady('linkedin', creds),
      x: channelPublishReady('x', creds),
      note: creds.autoPublishSocial
        ? 'Sosyal içerik doğrudan platformlara yayınlanır (token varsa)'
        : 'Doğrudan yayın kapalı',
    },
  }
}

export async function testOrganicMarketingDelivery() {
  const config = await getOrganicAutomationConfig()
  const task: ContentTask = {
    id: `health-test-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    channel: 'instagram',
    type: 'post',
    title: '[TEST] Pazarlama bağlantı testi',
    hook: 'Bu mesaj admin panelindeki bağlantı testinden geldi.',
    body: 'Webhook ve e-posta kanalları çalışıyorsa bu içeriği E-posta Merkezi ve/veya Gmail kutunda görürsünüz.',
    cta: 'Gu Live Chat — organik pazarlama botu',
    landingUrl: 'https://www.gulivechat.com',
    hashtags: ['#test', '#gulivechat'],
    status: 'draft',
    generatedAt: new Date().toISOString(),
  }

  const result = await dispatchSocialContent(task, config.webhookUrl, config.notifyEmail)
  const mail = await listAdminMailMessages({ source: 'organic-marketing', limit: 1 })

  return {
    dispatch: result,
    inboxLatest: mail[0]
      ? { subject: mail[0].subject, at: mail[0].createdAt }
      : null,
    hint:
      result.via === 'webhook' && result.ok
        ? 'Webhook OK — Admin → E-posta Merkezi → Pazarlama Botu filtresine bakın'
        : result.via === 'email' && result.ok
          ? 'E-posta OK — Gmail kutunuzu kontrol edin'
          : result.error || 'Gönderim tamamlanamadı',
  }
}

export async function getPaidMarketingHealth() {
  const config = await getPaidAutomationConfig()
  const creds = await getMarketingPublishCredentials()
  const deliverTo = getMailNotifyTo()
  const plan = await ensurePaidPlanInitialized()
  const todayTasks = getTodayAdTasks(plan)

  return {
    automation: {
      enabled: config.enabled,
      dailyEmailDigest: config.dailyEmailDigest,
      rotateChannels: config.rotateChannels,
      lastRunAt: config.lastRunAt,
      lastRunSummary: config.lastRunSummary,
      runCount: config.runCount,
    },
    email: {
      providerConfigured: isEmailConfigured(),
      deliverTo: maskEmail(deliverTo || config.notifyEmail),
      deliverToOk: Boolean(deliverTo || (config.notifyEmail && !isOwnDomainEmail(config.notifyEmail))),
      notifyEmailField: config.notifyEmail,
      note: deliverTo
        ? `Günlük özet: ${maskEmail(deliverTo)}`
        : isOwnDomainEmail(config.notifyEmail)
          ? '@gulivechat.com — ADMIN_EMAIL veya Gmail hedefi Vercel env’de olmalı'
          : `Hedef: ${maskEmail(config.notifyEmail)}`,
    },
    cron: {
      secretConfigured: Boolean(process.env.CRON_SECRET?.trim()),
      scheduleTr: '07:00, 13:00, 19:00, 01:00',
    },
    campaigns: {
      todayCount: todayTasks.length,
      channels: todayTasks.map((t) => t.channel),
    },
    autoLaunch: {
      enabled: config.autoLaunchAds && creds.autoLaunchPaidAds,
      metaReady: Boolean(creds.metaAdAccountId && creds.metaPageAccessToken),
      note: creds.metaAdAccountId
        ? 'Meta reklamları otomatik oluşturulur (duraklatılmış kampanya)'
        : 'Meta reklam hesabı tokeni yok — sadece metin/e-posta',
    },
  }
}

export async function testPaidMarketingEmail() {
  const config = await getPaidAutomationConfig()
  const plan = await ensurePaidPlanInitialized()
  const tasks = getTodayAdTasks(plan)

  if (!tasks.length) {
    return { ok: false, error: 'Bugün için kampanya yok — önce plan üretin' }
  }

  const notifyTo = getMailNotifyTo() || config.notifyEmail
  if (!notifyTo || isOwnDomainEmail(notifyTo)) {
    return {
      ok: false,
      error: 'Geçerli bir Gmail/hedef e-posta yok. Vercel’de ADMIN_EMAIL ayarlayın.',
    }
  }

  const result = await sendPaidMarketingDigest(tasks.slice(0, 1), notifyTo)
  return {
    ok: result.ok,
    error: result.error,
    sentTo: maskEmail(notifyTo),
    hint: result.ok ? 'Günlük reklam özeti e-postası gönderildi — Gmail’i kontrol edin' : undefined,
  }
}
