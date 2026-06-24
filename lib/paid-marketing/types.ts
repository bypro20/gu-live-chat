export type PaidChannel = 'google_search' | 'meta_feed' | 'meta_retarget' | 'linkedin'

export type AdTaskStatus = 'draft' | 'ready' | 'launched' | 'paused' | 'skipped'

export type AdCreative = {
  headlines: string[]
  descriptions: string[]
  primaryText?: string
  callToAction: string
}

export type KeywordGroup = {
  matchType: 'exact' | 'phrase' | 'broad'
  keywords: string[]
  negativeKeywords: string[]
}

export type PaidAudience = {
  id: string
  name: string
  description: string
  channels: PaidChannel[]
  interests: string[]
  jobTitles: string[]
  locations: string[]
}

export type PaidCampaignBlueprint = {
  id: string
  audienceId: string
  name: string
  channel: PaidChannel
  objective: string
  dailyBudgetTry: number
  landingPath: string
  utmCampaign: string
}

export type AdCampaignTask = {
  id: string
  date: string
  channel: PaidChannel
  audienceId: string
  campaignName: string
  objective: string
  dailyBudgetTry: number
  landingUrl: string
  creative: AdCreative
  keywords?: KeywordGroup
  targetingNotes: string
  status: AdTaskStatus
  tip: string
}

export type PaidMarketingPlan = {
  version: number
  updatedAt: string
  audiences: PaidAudience[]
  campaigns: PaidCampaignBlueprint[]
  calendar: AdCampaignTask[]
}
