import { sendEmail, isEmailConfigured } from '@/lib/email'
import type { ContentTask } from './types'

export type SocialDispatchResult = {
  channel: string
  taskId: string
  ok: boolean
  via: 'webhook' | 'email' | 'skipped'
  error?: string
}

function formatPostText(task: ContentTask): string {
  const lines = [task.title, '', task.hook, '', task.body, '', task.cta]
  if (task.landingUrl) lines.push('', task.landingUrl)
  if (task.hashtags?.length) {
    lines.push('', task.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '))
  }
  return lines.join('\n')
}

export async function dispatchSocialContent(
  task: ContentTask,
  webhookUrl: string,
  notifyEmail: string
): Promise<SocialDispatchResult> {
  if (task.channel === 'blog') {
    return { channel: task.channel, taskId: task.id, ok: true, via: 'skipped' }
  }

  const payload = {
    event: 'gulivechat_organic_content',
    site: 'https://www.gulivechat.com',
    channel: task.channel,
    type: task.type,
    date: task.date,
    title: task.title,
    hook: task.hook,
    body: task.body,
    cta: task.cta,
    text: formatPostText(task),
    hashtags: task.hashtags ?? [],
    landingUrl: task.landingUrl,
    taskId: task.id,
  }

  const url = webhookUrl.trim()
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      })
      if (res.ok) {
        return { channel: task.channel, taskId: task.id, ok: true, via: 'webhook' }
      }
      return {
        channel: task.channel,
        taskId: task.id,
        ok: false,
        via: 'webhook',
        error: `Webhook ${res.status}`,
      }
    } catch (e) {
      return {
        channel: task.channel,
        taskId: task.id,
        ok: false,
        via: 'webhook',
        error: e instanceof Error ? e.message : 'Webhook failed',
      }
    }
  }

  if (notifyEmail && isEmailConfigured()) {
    const subject = `[Gu Live Chat] ${task.channel.toUpperCase()} içeriği — ${task.date}`
    const html = `
      <h2>${task.title}</h2>
      <p><em>${task.hook}</em></p>
      <p>${task.body.replace(/\n/g, '<br>')}</p>
      <p><strong>${task.cta}</strong></p>
      ${task.landingUrl ? `<p><a href="${task.landingUrl}">${task.landingUrl}</a></p>` : ''}
      <hr>
      <pre style="white-space:pre-wrap">${formatPostText(task)}</pre>
    `
    const result = await sendEmail({
      to: notifyEmail,
      subject,
      html,
      text: formatPostText(task),
    })
    return {
      channel: task.channel,
      taskId: task.id,
      ok: result.success,
      via: 'email',
      error: result.error,
    }
  }

  return {
    channel: task.channel,
    taskId: task.id,
    ok: true,
    via: 'skipped',
    error: 'Webhook/email yapılandırılmamış — içerik kuyrukta',
  }
}
