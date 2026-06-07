import { prisma } from './db'
import { syncProductionSchema } from './db-schema-sync'
import { isEmailConfigured } from './email'
import { isFileStorageConfigured } from './file-upload'
import {
  ensureAdminMarketingAccess,
  resolveMarketingWebsiteId,
} from './marketing-website'
import { findWebsiteForWidget } from './website-widget-safe'

const BOT_STATE_KEY = 'site_health_bot_last_run'

export type HealthCheck = {
  id: string
  ok: boolean
  severity: 'info' | 'warn' | 'critical'
  message: string
}

export type Remediation = {
  id: string
  attempted: boolean
  success: boolean
  message: string
}

export type SiteHealthBotReport = {
  ok: boolean
  at: string
  checks: HealthCheck[]
  remediations: Remediation[]
  fixedCount: number
}

function socketBaseUrl(): string | null {
  const url = (
    process.env.SOCKET_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')
  if (!url || url.includes('.vercel.app')) return null
  return url
}

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { id: 'database', ok: true, severity: 'info', message: 'DB bağlantısı OK' }
  } catch (e) {
    return {
      id: 'database',
      ok: false,
      severity: 'critical',
      message: `DB hatası: ${e instanceof Error ? e.message : 'unknown'}`,
    }
  }
}

async function checkSocketServer(): Promise<HealthCheck> {
  const url = socketBaseUrl()
  if (!url) {
    return {
      id: 'socket_server',
      ok: false,
      severity: 'warn',
      message: 'Socket URL yapılandırılmamış (polling fallback aktif)',
    }
  }
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(6000) })
    const data = (await res.json()) as { service?: string; socketReady?: boolean }
    if (res.ok && data.service === 'gu-live-chat-socket' && data.socketReady) {
      return { id: 'socket_server', ok: true, severity: 'info', message: 'Socket sunucusu OK' }
    }
    return {
      id: 'socket_server',
      ok: false,
      severity: 'critical',
      message: `Socket yanıtı beklenmiyor: ${JSON.stringify(data).slice(0, 120)}`,
    }
  } catch (e) {
    return {
      id: 'socket_server',
      ok: false,
      severity: 'critical',
      message: `Socket erişilemiyor: ${e instanceof Error ? e.message : 'unknown'}`,
    }
  }
}

async function checkMarketingSite(): Promise<HealthCheck> {
  const wid = await resolveMarketingWebsiteId()
  if (!wid) {
    return {
      id: 'marketing_site',
      ok: false,
      severity: 'critical',
      message: 'Marketing sitesi (guchat.org widget) bulunamadı',
    }
  }
  const site = await prisma.website.findUnique({
    where: { websiteId: wid },
    select: { plan: true, subscriptionStatus: true },
  })
  if (!site) {
    return {
      id: 'marketing_site',
      ok: false,
      severity: 'critical',
      message: `Marketing site kaydı yok: ${wid}`,
    }
  }
  if (site.plan !== 'PRO' && site.plan !== 'BUSINESS') {
    return {
      id: 'marketing_site',
      ok: false,
      severity: 'warn',
      message: `Marketing site planı ${site.plan} — PRO bekleniyor`,
    }
  }
  return {
    id: 'marketing_site',
    ok: true,
    severity: 'info',
    message: `Marketing site OK (${wid}, ${site.plan})`,
  }
}

async function checkWidgetInit(websiteId: string): Promise<HealthCheck> {
  const site = await findWebsiteForWidget(websiteId)
  if (!site) {
    return {
      id: 'widget_init',
      ok: false,
      severity: 'critical',
      message: `Widget site lookup başarısız: ${websiteId}`,
    }
  }
  return {
    id: 'widget_init',
    ok: true,
    severity: 'info',
    message: 'Widget site erişilebilir',
  }
}

function checkIntegrations(): HealthCheck[] {
  return [
    {
      id: 'file_storage',
      ok: isFileStorageConfigured(),
      severity: isFileStorageConfigured() ? 'info' : 'warn',
      message: isFileStorageConfigured()
        ? 'Dosya depolama yapılandırılmış'
        : 'Dosya depolama eksik (Blob/S3)',
    },
    {
      id: 'email',
      ok: isEmailConfigured(),
      severity: isEmailConfigured() ? 'info' : 'warn',
      message: isEmailConfigured()
        ? 'E-posta sağlayıcısı yapılandırılmış'
        : 'E-posta yok — formlar admin bildirimine düşer',
    },
  ]
}

async function notifyAdminsCritical(summary: string, report: SiteHealthBotReport) {
  const marketingId = await resolveMarketingWebsiteId()
  if (!marketingId) return

  const website = await prisma.website.findUnique({
    where: { websiteId: marketingId },
    select: { id: true },
  })
  if (!website) return

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })

  const payload = JSON.stringify({ report, source: 'site-health-bot' })
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          websiteId: website.id,
          type: 'NEW_MESSAGE',
          title: '⚠️ Site sağlık botu uyarısı',
          message: summary.slice(0, 2000),
          data: payload.slice(0, 4000),
        },
      })
    )
  )
}

async function remediateMarketingSite(): Promise<Remediation> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  const admin = adminEmail
    ? await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } })
    : await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      })

  if (!admin) {
    return {
      id: 'bootstrap_marketing',
      attempted: true,
      success: false,
      message: 'ADMIN kullanıcı bulunamadı — seed-admin gerekli',
    }
  }

  try {
    const wid = await ensureAdminMarketingAccess(admin.id)
    return {
      id: 'bootstrap_marketing',
      attempted: true,
      success: !!wid,
      message: wid ? `Marketing site hazır: ${wid}` : 'Marketing site oluşturulamadı',
    }
  } catch (e) {
    return {
      id: 'bootstrap_marketing',
      attempted: true,
      success: false,
      message: e instanceof Error ? e.message : 'bootstrap failed',
    }
  }
}

async function remediateSchema(): Promise<Remediation> {
  try {
    const result = await syncProductionSchema()
    return {
      id: 'schema_sync',
      attempted: true,
      success: true,
      message: `Şema sync: +${result.applied.length} uygulandı, ${result.skipped.length} atlandı`,
    }
  } catch (e) {
    return {
      id: 'schema_sync',
      attempted: true,
      success: false,
      message: e instanceof Error ? e.message : 'schema sync failed',
    }
  }
}

export async function saveBotReport(report: SiteHealthBotReport): Promise<void> {
  try {
    await prisma.platformSetting.upsert({
      where: { key: BOT_STATE_KEY },
      create: { key: BOT_STATE_KEY, value: JSON.stringify(report) },
      update: { value: JSON.stringify(report) },
    })
  } catch (e) {
    console.warn('[site-health-bot] save report failed:', e)
  }
}

export async function loadBotReport(): Promise<SiteHealthBotReport | null> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: BOT_STATE_KEY } })
    if (!row?.value) return null
    return JSON.parse(row.value) as SiteHealthBotReport
  } catch {
    return null
  }
}

/** Otomatik kontrol + güvenli onarım (şema, marketing site, PRO plan). */
export async function runSiteHealthBot(): Promise<SiteHealthBotReport> {
  const checks: HealthCheck[] = []
  const remediations: Remediation[] = []

  checks.push(await checkDatabase())
  checks.push(await checkSocketServer())
  checks.push(await checkMarketingSite())

  const marketingId = await resolveMarketingWebsiteId()
  if (marketingId) {
    checks.push(await checkWidgetInit(marketingId))
  }
  checks.push(...checkIntegrations())

  const replaceCheck = async (id: string, next: HealthCheck) => {
    const idx = checks.findIndex((c) => c.id === id)
    if (idx >= 0) checks[idx] = next
    else checks.push(next)
  }

  const dbOk = checks.find((c) => c.id === 'database')?.ok

  const marketingCheck = checks.find((c) => c.id === 'marketing_site')
  if (marketingCheck && !marketingCheck.ok && dbOk) {
    remediations.push(await remediateSchema())
    remediations.push(await remediateMarketingSite())
    await replaceCheck('marketing_site', await checkMarketingSite())
    const wid = await resolveMarketingWebsiteId()
    if (wid) await replaceCheck('widget_init', await checkWidgetInit(wid))
  }

  let widgetCheck = checks.find((c) => c.id === 'widget_init')
  const widAfter = await resolveMarketingWebsiteId()
  if (dbOk && widAfter && (!widgetCheck || !widgetCheck.ok)) {
    if (!remediations.some((r) => r.id === 'schema_sync')) {
      remediations.push(await remediateSchema())
    }
    await replaceCheck('widget_init', await checkWidgetInit(widAfter))
    widgetCheck = checks.find((c) => c.id === 'widget_init')
  }

  const fixedCount = remediations.filter((r) => r.success).length
  const criticalFails = checks.filter((c) => !c.ok && c.severity === 'critical')
  const ok = criticalFails.length === 0

  const report: SiteHealthBotReport = {
    ok,
    at: new Date().toISOString(),
    checks,
    remediations,
    fixedCount,
  }

  await saveBotReport(report)

  if (!ok) {
    const summary = criticalFails.map((c) => `${c.id}: ${c.message}`).join('\n')
    await notifyAdminsCritical(summary, report).catch(() => {})
  }

  return report
}
