import { syncProductionSchema } from '@/lib/db-schema-sync'
import { appendDailyContentTask } from './generator'
import {
  getOrganicAutomationConfig,
  recordAutomationRun,
  saveOrganicAutomationConfig,
} from './automation-config'
import { autoPublishBlogArticle, shouldPublishBlogToday } from './blog-publisher'
import { dispatchSocialContent } from './social-dispatcher'
import { ensureOrganicPlanInitialized, getOrganicMarketingPlan, saveOrganicMarketingPlan } from './storage'
import type { ContentTask } from './types'

export type AutoRunnerReport = {
  ok: boolean
  at: string
  enabled: boolean
  blog?: { published: boolean; slug?: string; url?: string; error?: string }
  social: Array<{ channel: string; taskId: string; ok: boolean; via: string; error?: string }>
  tasksCreated: number
  summary: string
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function socialTasksForToday(calendar: ContentTask[]) {
  return calendar.filter(
    (t) => t.date === todayIso() && t.channel !== 'blog' && t.status !== 'skipped' && t.status !== 'published'
  )
}

export async function runOrganicMarketingAutomation(): Promise<AutoRunnerReport> {
  const at = new Date().toISOString()

  await syncProductionSchema().catch(() => {})
  await ensureOrganicPlanInitialized()

  const config = await getOrganicAutomationConfig()
  if (!config.enabled) {
    return {
      ok: true,
      at,
      enabled: false,
      social: [],
      tasksCreated: 0,
      summary: 'Otomasyon kapalı',
    }
  }

  const plan = await getOrganicMarketingPlan()
  let tasksCreated = 0
  const socialResults: AutoRunnerReport['social'] = []

  // 1) Günlük içerik görevi üret (sosyal kanallar için)
  const beforeCount = plan.calendar.filter((t) => t.date === todayIso()).length
  if (beforeCount < 3) {
    const task = await appendDailyContentTask()
    if (task) tasksCreated++
  }

  const freshPlan = await getOrganicMarketingPlan()

  // 2) Blog otomatik yayın (interval)
  let blogResult: AutoRunnerReport['blog']
  if (config.autoPublishBlog && (await shouldPublishBlogToday(config.blogIntervalDays))) {
    const blogTask = freshPlan.calendar.find(
      (t) => t.date === todayIso() && t.channel === 'blog' && t.status !== 'published'
    )
    const published = await autoPublishBlogArticle(blogTask)
    blogResult = {
      published: published.ok,
      slug: published.slug,
      url: published.url,
      error: published.error,
    }
    if (published.ok) {
      await saveOrganicAutomationConfig({ lastBlogPublishedAt: at })
      if (blogTask) {
        blogTask.status = 'published'
        await saveOrganicMarketingPlan(freshPlan)
      }
    }
  }

  // 3) Sosyal içerik dağıt
  if (config.autoDispatchSocial) {
    const toDispatch = socialTasksForToday(freshPlan.calendar).slice(0, 2)

    for (const task of toDispatch) {
      const result = await dispatchSocialContent(task, config.webhookUrl, config.notifyEmail)
      socialResults.push({
        channel: result.channel,
        taskId: result.taskId,
        ok: result.ok,
        via: result.via,
        error: result.error,
      })

      if (result.ok && result.via !== 'skipped') {
        task.status = 'published'
      } else if (result.via === 'skipped' && task.status === 'draft') {
        task.status = 'approved'
      }
    }

    if (toDispatch.length) {
      await saveOrganicMarketingPlan(freshPlan)
    }
  }

  const parts = [
    tasksCreated ? `${tasksCreated} görev üretildi` : null,
    blogResult?.published ? `Blog: ${blogResult.url}` : blogResult?.error ? `Blog hata: ${blogResult.error}` : null,
    socialResults.length
      ? `Sosyal: ${socialResults.filter((s) => s.ok).length}/${socialResults.length} gönderildi`
      : null,
  ].filter(Boolean)

  const summary = parts.join(' · ') || 'Kontrol tamam — yeni işlem yok'
  await recordAutomationRun(summary)

  return {
    ok: true,
    at,
    enabled: true,
    blog: blogResult,
    social: socialResults,
    tasksCreated,
    summary,
  }
}
