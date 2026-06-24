export type MarketingChannel = 'blog' | 'instagram' | 'linkedin' | 'tiktok' | 'x'

export type ContentTaskStatus = 'draft' | 'approved' | 'published' | 'skipped'

export type ContentTaskType = 'post' | 'reel' | 'carousel' | 'article' | 'story'

export type TargetAudience = {
  id: string
  name: string
  description: string
  painPoints: string[]
  channels: MarketingChannel[]
  keywords: string[]
}

export type OrganicStrategy = {
  id: string
  audienceId: string
  title: string
  tactics: string[]
  contentIdeas: string[]
  postingFrequency: string
  kpis: string[]
}

export type ContentTask = {
  id: string
  date: string
  channel: MarketingChannel
  type: ContentTaskType
  title: string
  hook: string
  body: string
  cta: string
  hashtags?: string[]
  landingUrl?: string
  status: ContentTaskStatus
  audienceId?: string
  generatedAt: string
}

export type OrganicMarketingPlan = {
  version: number
  generatedAt: string
  source: 'ai' | 'seed' | 'manual'
  productBrief: string
  audiences: TargetAudience[]
  strategies: OrganicStrategy[]
  calendar: ContentTask[]
}

export type GenerateStrategyResult = {
  plan: OrganicMarketingPlan
  aiUsed: boolean
  message: string
}
