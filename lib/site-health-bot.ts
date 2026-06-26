import { prisma } from './db'
import { syncProductionSchema } from './db-schema-sync'
import { isEmailConfigured, sendEmail, siteHealthProblemEmail, siteHealthRecoveryEmail } from './email'
import { isFileStorageConfigured } from './file-upload'
import {
  ensureAdminMarketingAccess,
  resolveMarketingWebsiteId,
} from './marketing-website'
import { getSiteHealthAlertEmail, getSiteUrl } from './site-config'
import { findWebsiteForWidget } from './website-widget-safe'

const BOT_STATE_KEY = 'site_health_bot_last_run'
const BOT_ALERT_KEY = 'site_health_bot_last_alert'
const BOT_INCIDENT_KEY = 'site_health_bot_incident'
/** Aynı hata için tekrar bildirim minimum aralığı (ms) */
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000
/** Sorun tespitinden sonra otomatik onarım gecikmesi (ms) */
const REMEDIATION_DELAY_MS = 5 * 60 * 1000

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
  incident?: {
    active: boolean
    firstSeenAt?: string
    remediationDueAt?: string
    autoFixPending?: boolean
  }
}

type IncidentState = {
  fingerprint: string
  firstSeenAt: string
  alertSentAt: string | null
  recoveryEmailSentAt: string | null
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

async function checkPublicHealth(): Promise<HealthCheck> {
  const base = getSiteUrl()
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'GuLiveChat-HealthBot/1' },
      cache: 'no-store',
    })
    const data = (await res.json()) as { ok?: boolean; db?: boolean }
    if (res.ok && data.ok && data.db) {
      return { id: 'public_health', ok: true, severity: 'info', message: 'Public /api/health OK' }
    }
    return {
      id: 'public_health',
      ok: false,
      severity: 'critical',
      message: `Public health başarısız (${res.status}): ${JSON.stringify(data).slice(0, 120)}`,
    }
  } catch (e) {
    return {
      id: 'public_health',
      ok: false,
      severity: 'critical',
      message: `Public health erişilemiyor: ${e instanceof Error ? e.message : 'unknown'}`,
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
      message: 'Marketing sitesi (gulivechat.com widget) bulunamadı',
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
      message: `Marketing site planı ${site.plan} — PRO/BUSINESS bekleniyor`,
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

async function runAllChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []
  checks.push(await checkDatabase())
  checks.push(await checkPublicHealth())
  checks.push(await checkSocketServer())
  checks.push(await checkMarketingSite())

  const marketingId = await resolveMarketingWebsiteId()
  if (marketingId) {
    checks.push(await checkWidgetInit(marketingId))
  }
  checks.push(...checkIntegrations())
  return checks
}

function criticalFingerprint(checks: HealthCheck[]): string {
  return checks
    .filter((c) => !c.ok && c.severity === 'critical')
    .map((c) => `${c.id}:${c.message}`)
    .sort()
    .join('|')
}

async function loadIncident(): Promise<IncidentState | null> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: BOT_INCIDENT_KEY } })
    if (!row?.value) return null
    return JSON.parse(row.value) as IncidentState
  } catch {
    return null
  }
}

async function saveIncident(incident: IncidentState | null): Promise<void> {
  try {
    if (!incident) {
      await prisma.platformSetting.deleteMany({ where: { key: BOT_INCIDENT_KEY } })
      return
    }
    const value = JSON.stringify(incident)
    await prisma.platformSetting.upsert({
      where: { key: BOT_INCIDENT_KEY },
      create: { key: BOT_INCIDENT_KEY, value },
      update: { value },
    })
  } catch {
    /* ignore */
  }
}

async function shouldSendAlert(fingerprint: string): Promise<boolean> {
  if (!fingerprint) return false
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: BOT_ALERT_KEY } })
    if (!row?.value) return true
    const prev = JSON.parse(row.value) as { at: string; fingerprint: string }
    const elapsed = Date.now() - new Date(prev.at).getTime()
    if (prev.fingerprint !== fingerprint) return true
    return elapsed >= ALERT_COOLDOWN_MS
  } catch {
    return true
  }
}

async function markAlertSent(fingerprint: string): Promise<void> {
  try {
    const value = JSON.stringify({ at: new Date().toISOString(), fingerprint })
    await prisma.platformSetting.upsert({
      where: { key: BOT_ALERT_KEY },
      create: { key: BOT_ALERT_KEY, value },
      update: { value },
    })
  } catch {
    /* ignore */
  }
}

async function sendProblemEmail(checks: HealthCheck[]): Promise<void> {
  const problems = checks
    .filter((c) => !c.ok && c.severity === 'critical')
    .map((c) => `${c.id}: ${c.message}`)
  if (problems.length === 0) return

  const template = siteHealthProblemEmail({
    siteUrl: getSiteUrl(),
    problems,
    autoFixInMinutes: REMEDIATION_DELAY_MS / 60_000,
  })
  const result = await sendEmail({
    ...template,
    to: getSiteHealthAlertEmail(),
  })
  if (!result.success) {
    console.warn('[site-health-bot] problem email failed:', result.error)
  }
}

async function sendRecoveryEmail(remediations: Remediation[]): Promise<void> {
  const fixedActions = remediations.filter((r) => r.success).map((r) => r.message)
  const template = siteHealthRecoveryEmail({
    siteUrl: getSiteUrl(),
    fixedActions,
  })
  const result = await sendEmail({
    ...template,
    to: getSiteHealthAlertEmail(),
  })
  if (!result.success) {
    console.warn('[site-health-bot] recovery email failed:', result.error)
  }
}

async function notifyAdminsCritical(summary: string, report: SiteHealthBotReport) {
  const fingerprint = criticalFingerprint(report.checks)
  if (!(await shouldSendAlert(fingerprint))) return

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

  await markAlertSent(fingerprint)
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

async function runAutoRemediations(checks: HealthCheck[]): Promise<{
  checks: HealthCheck[]
  remediations: Remediation[]
}> {
  const remediations: Remediation[] = []

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
  }

  const publicCheck = checks.find((c) => c.id === 'public_health')
  if (publicCheck && !publicCheck.ok && dbOk) {
    if (!remediations.some((r) => r.id === 'schema_sync')) {
      remediations.push(await remediateSchema())
    }
    await replaceCheck('public_health', await checkPublicHealth())
  }

  return { checks, remediations }
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

/** Otomatik kontrol — sorun anında e-posta, 5 dk sonra güvenli onarım. */
export async function runSiteHealthBot(): Promise<SiteHealthBotReport> {
  let checks = await runAllChecks()
  let remediations: Remediation[] = []
  const fingerprint = criticalFingerprint(checks)
  let criticalFails = checks.filter((c) => !c.ok && c.severity === 'critical')
  let incident = await loadIncident()

  if (criticalFails.length === 0) {
    if (incident && !incident.recoveryEmailSentAt) {
      await sendRecoveryEmail(remediations).catch(() => {})
    }
    await saveIncident(null)
  } else {
    const now = Date.now()

    if (!incident || incident.fingerprint !== fingerprint) {
      incident = {
        fingerprint,
        firstSeenAt: new Date().toISOString(),
        alertSentAt: null,
        recoveryEmailSentAt: null,
      }
      await sendProblemEmail(checks).catch(() => {})
      incident.alertSentAt = new Date().toISOString()
      await saveIncident(incident)
    }

    const elapsed = now - new Date(incident.firstSeenAt).getTime()
    const remediationDue = elapsed >= REMEDIATION_DELAY_MS

    if (remediationDue) {
      const result = await runAutoRemediations([...checks])
      checks = result.checks
      remediations = result.remediations
      criticalFails = checks.filter((c) => !c.ok && c.severity === 'critical')

      if (criticalFails.length === 0) {
        await sendRecoveryEmail(remediations).catch(() => {})
        incident.recoveryEmailSentAt = new Date().toISOString()
        await saveIncident(null)
      } else {
        await saveIncident(incident)
      }
    } else {
      await saveIncident(incident)
    }
  }

  const fixedCount = remediations.filter((r) => r.success).length
  const ok = criticalFails.length === 0
  const activeIncident = await loadIncident()

  const report: SiteHealthBotReport = {
    ok,
    at: new Date().toISOString(),
    checks,
    remediations,
    fixedCount,
    incident: activeIncident
      ? {
          active: true,
          firstSeenAt: activeIncident.firstSeenAt,
          remediationDueAt: new Date(
            new Date(activeIncident.firstSeenAt).getTime() + REMEDIATION_DELAY_MS
          ).toISOString(),
          autoFixPending: Date.now() - new Date(activeIncident.firstSeenAt).getTime() < REMEDIATION_DELAY_MS,
        }
      : { active: false },
  }

  await saveBotReport(report)

  if (!ok) {
    const summary = criticalFails.map((c) => `${c.id}: ${c.message}`).join('\n')
    await notifyAdminsCritical(summary, report).catch(() => {})
  }

  return report
}
