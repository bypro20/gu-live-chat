import type { AdCampaignTask } from '@/lib/paid-marketing/types'
import type { MarketingPublishCredentials } from './credentials'

export type PaidLaunchResult = {
  ok: boolean
  channel: string
  taskId: string
  externalId?: string
  mode?: 'meta_paused' | 'meta_active' | 'skipped'
  error?: string
}

function metaObjective(objective: string): string {
  const o = objective.toLowerCase()
  if (o.includes('traffic') || o.includes('trafik')) return 'OUTCOME_TRAFFIC'
  if (o.includes('lead')) return 'OUTCOME_LEADS'
  return 'OUTCOME_AWARENESS'
}

export async function launchMetaAdCampaign(
  creds: MarketingPublishCredentials,
  task: AdCampaignTask
): Promise<PaidLaunchResult> {
  const { metaAdAccountId, metaPageAccessToken } = creds
  if (!metaAdAccountId || !metaPageAccessToken) {
    return {
      ok: false,
      channel: task.channel,
      taskId: task.id,
      error: 'Meta reklam hesabı veya token yok',
    }
  }

  const actId = metaAdAccountId.startsWith('act_') ? metaAdAccountId : `act_${metaAdAccountId}`
  const token = metaPageAccessToken
  const budget = Math.max(100, Math.round(task.dailyBudgetTry * 100))
  const headline = task.creative.headlines[0] || task.campaignName
  const body = task.creative.primaryText || task.creative.descriptions[0] || task.campaignName

  try {
    const campaignRes = await fetch(`https://graph.facebook.com/v21.0/${actId}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: `[GuBot] ${task.campaignName}`,
        objective: metaObjective(task.objective),
        status: 'PAUSED',
        special_ad_categories: '[]',
        access_token: token,
      }),
      signal: AbortSignal.timeout(25000),
    })
    const campaign = (await campaignRes.json()) as { id?: string; error?: { message?: string } }
    if (!campaign.id) {
      return {
        ok: false,
        channel: task.channel,
        taskId: task.id,
        error: campaign.error?.message || 'Meta kampanya oluşturulamadı',
      }
    }

    const adSetRes = await fetch(`https://graph.facebook.com/v21.0/${actId}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: `[GuBot] ${task.campaignName} set`,
        campaign_id: campaign.id,
        daily_budget: String(budget),
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: JSON.stringify({ geo_locations: { countries: ['TR'] } }),
        status: 'PAUSED',
        access_token: token,
      }),
      signal: AbortSignal.timeout(25000),
    })
    const adSet = (await adSetRes.json()) as { id?: string; error?: { message?: string } }
    if (!adSet.id) {
      return {
        ok: false,
        channel: task.channel,
        taskId: task.id,
        error: adSet.error?.message || 'Meta ad set oluşturulamadı',
      }
    }

    const creativeRes = await fetch(`https://graph.facebook.com/v21.0/${actId}/adcreatives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: `[GuBot] ${task.campaignName} creative`,
        object_story_spec: JSON.stringify({
          page_id: creds.metaPageId,
          link_data: {
            link: task.landingUrl,
            message: body,
            name: headline,
            call_to_action: { type: 'LEARN_MORE' },
          },
        }),
        access_token: token,
      }),
      signal: AbortSignal.timeout(25000),
    })
    const creative = (await creativeRes.json()) as { id?: string; error?: { message?: string } }
    if (!creative.id) {
      return {
        ok: false,
        channel: task.channel,
        taskId: task.id,
        error: creative.error?.message || 'Meta creative oluşturulamadı',
      }
    }

    const adRes = await fetch(`https://graph.facebook.com/v21.0/${actId}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        name: `[GuBot] ${task.campaignName} ad`,
        adset_id: adSet.id,
        creative: JSON.stringify({ creative_id: creative.id }),
        status: 'PAUSED',
        access_token: token,
      }),
      signal: AbortSignal.timeout(25000),
    })
    const ad = (await adRes.json()) as { id?: string; error?: { message?: string } }
    if (!ad.id) {
      return {
        ok: false,
        channel: task.channel,
        taskId: task.id,
        error: ad.error?.message || 'Meta reklam oluşturulamadı',
      }
    }

    return {
      ok: true,
      channel: task.channel,
      taskId: task.id,
      externalId: ad.id,
      mode: 'meta_paused',
    }
  } catch (e) {
    return {
      ok: false,
      channel: task.channel,
      taskId: task.id,
      error: e instanceof Error ? e.message : 'Meta reklam hatası',
    }
  }
}

export async function launchPaidCampaign(
  task: AdCampaignTask,
  creds: MarketingPublishCredentials
): Promise<PaidLaunchResult> {
  if (task.status === 'launched' || task.status === 'skipped') {
    return {
      ok: true,
      channel: task.channel,
      taskId: task.id,
      mode: 'skipped',
    }
  }

  if (task.channel === 'meta_feed' || task.channel === 'meta_retarget') {
    return launchMetaAdCampaign(creds, task)
  }

  if (task.channel === 'google_search') {
    return {
      ok: false,
      channel: task.channel,
      taskId: task.id,
      error: 'Google Ads API anahtarı yok — kampanya metni hazır, otomatik kopya e-postada',
    }
  }

  if (task.channel === 'linkedin') {
    return {
      ok: false,
      channel: task.channel,
      taskId: task.id,
      error: 'LinkedIn Ads API henüz bağlı değil — metin hazır',
    }
  }

  return { ok: false, channel: task.channel, taskId: task.id, error: 'Bilinmeyen kanal' }
}
