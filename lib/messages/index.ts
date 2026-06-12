import type { SiteLocale } from '@/lib/regional-config'
import { en } from './en'
import { tr, type MessageTree } from './tr'
import { homeEn, footerEn } from './home-en'
import { homeTr, footerTr } from './home-tr'
import type { FooterMessages } from './home-types'
import type { HomeMessages } from './home-types'

export type FullMessageTree = MessageTree & {
  home: HomeMessages
  footerExtended: FooterMessages
}

const baseCatalogs: Record<SiteLocale, MessageTree> = { tr, en }

export function getMessages(locale: SiteLocale): FullMessageTree {
  const base = baseCatalogs[locale] ?? tr
  if (locale === 'en') {
    return { ...base, home: homeEn, footerExtended: footerEn }
  }
  return { ...base, home: homeTr, footerExtended: footerTr }
}

export type { MessageTree, HomeMessages, FooterMessages }
