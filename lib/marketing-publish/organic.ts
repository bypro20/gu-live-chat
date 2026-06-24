import type { ContentTask } from '@/lib/organic-marketing/types'
import type { MarketingPublishCredentials } from './credentials'

export type DirectPublishResult = {
  ok: boolean
  platform?: string
  externalId?: string
  error?: string
}

export function formatSocialPostText(task: ContentTask): string {
  const lines = [task.title, '', task.hook, '', task.body, '', task.cta]
  if (task.landingUrl) lines.push('', task.landingUrl)
  if (task.hashtags?.length) {
    lines.push('', task.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '))
  }
  return lines.join('\n')
}

export async function publishToFacebookPage(
  creds: MarketingPublishCredentials,
  task: ContentTask
): Promise<DirectPublishResult> {
  const { metaPageId, metaPageAccessToken } = creds
  if (!metaPageId || !metaPageAccessToken) {
    return { ok: false, error: 'Facebook sayfa tokeni yok' }
  }

  const message = formatSocialPostText(task)
  const body = new URLSearchParams({ message, access_token: metaPageAccessToken })
  if (task.landingUrl) body.set('link', task.landingUrl)

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${metaPageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20000),
    })
    const data = (await res.json()) as { id?: string; error?: { message?: string } }
    if (!res.ok || data.error) {
      return { ok: false, error: data.error?.message || `Facebook ${res.status}` }
    }
    return { ok: true, platform: 'facebook', externalId: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Facebook hatası' }
  }
}

export async function publishToInstagram(
  creds: MarketingPublishCredentials,
  task: ContentTask
): Promise<DirectPublishResult> {
  const { metaInstagramBusinessId, metaPageAccessToken, shareImageUrl } = creds
  if (!metaInstagramBusinessId || !metaPageAccessToken || !shareImageUrl) {
    return { ok: false, error: 'Instagram Business veya görsel URL yok' }
  }

  const caption = formatSocialPostText(task).slice(0, 2200)

  try {
    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/${metaInstagramBusinessId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          image_url: shareImageUrl,
          caption,
          access_token: metaPageAccessToken,
        }),
        signal: AbortSignal.timeout(30000),
      }
    )
    const created = (await createRes.json()) as { id?: string; error?: { message?: string } }
    if (!createRes.ok || !created.id) {
      return { ok: false, error: created.error?.message || 'Instagram media oluşturulamadı' }
    }

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${metaInstagramBusinessId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: created.id,
          access_token: metaPageAccessToken,
        }),
        signal: AbortSignal.timeout(30000),
      }
    )
    const published = (await publishRes.json()) as { id?: string; error?: { message?: string } }
    if (!publishRes.ok || published.error) {
      return { ok: false, error: published.error?.message || 'Instagram yayınlanamadı' }
    }
    return { ok: true, platform: 'instagram', externalId: published.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Instagram hatası' }
  }
}

export async function publishToLinkedIn(
  creds: MarketingPublishCredentials,
  task: ContentTask
): Promise<DirectPublishResult> {
  const { linkedinAccessToken, linkedinAuthorUrn } = creds
  if (!linkedinAccessToken || !linkedinAuthorUrn) {
    return { ok: false, error: 'LinkedIn token veya author URN yok' }
  }

  const text = formatSocialPostText(task).slice(0, 3000)
  const payload = {
    author: linkedinAuthorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }

  try {
    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${linkedinAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    })
    const data = (await res.json()) as { id?: string; message?: string; status?: number }
    if (!res.ok) {
      return { ok: false, error: data.message || `LinkedIn ${res.status}` }
    }
    return { ok: true, platform: 'linkedin', externalId: data.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'LinkedIn hatası' }
  }
}

export async function publishToX(
  creds: MarketingPublishCredentials,
  task: ContentTask
): Promise<DirectPublishResult> {
  const token = creds.xBearerToken
  if (!token) return { ok: false, error: 'X bearer token yok' }

  const text = formatSocialPostText(task).slice(0, 280)
  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000),
    })
    const data = (await res.json()) as { data?: { id?: string }; detail?: string; title?: string }
    if (!res.ok) {
      return { ok: false, error: data.detail || data.title || `X ${res.status}` }
    }
    return { ok: true, platform: 'x', externalId: data.data?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'X hatası' }
  }
}

export async function publishOrganicToPlatform(
  task: ContentTask,
  creds: MarketingPublishCredentials
): Promise<DirectPublishResult> {
  switch (task.channel) {
    case 'instagram':
      return publishToInstagram(creds, task)
    case 'linkedin':
      return publishToLinkedIn(creds, task)
    case 'x':
      return publishToX(creds, task)
    case 'tiktok':
      return { ok: false, error: 'TikTok API henüz bağlı değil' }
    default:
      return publishToFacebookPage(creds, task)
  }
}
