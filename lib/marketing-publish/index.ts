import { getMarketingPublishCredentials } from './credentials'
import { publishOrganicToPlatform } from './organic'
import { launchPaidCampaign, type PaidLaunchResult } from './paid'
import type { ContentTask } from '@/lib/organic-marketing/types'
import type { AdCampaignTask } from '@/lib/paid-marketing/types'
import type { DirectPublishResult } from './organic'

export type { MarketingPublishCredentials } from './credentials'
export { getMarketingPublishCredentials, saveMarketingPublishCredentials, channelPublishReady } from './credentials'
export { formatSocialPostText } from './organic'

export async function autoPublishOrganicContent(task: ContentTask): Promise<DirectPublishResult | null> {
  const creds = await getMarketingPublishCredentials()
  if (!creds.autoPublishSocial) return null
  return publishOrganicToPlatform(task, creds)
}

export async function autoLaunchPaidCampaigns(tasks: AdCampaignTask[]): Promise<PaidLaunchResult[]> {
  const creds = await getMarketingPublishCredentials()
  if (!creds.autoLaunchPaidAds) return []

  const results: PaidLaunchResult[] = []
  for (const task of tasks) {
    if (task.channel !== 'meta_feed' && task.channel !== 'meta_retarget') continue
    results.push(await launchPaidCampaign(task, creds))
  }
  return results
}
