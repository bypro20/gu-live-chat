'use client'

import { getVisitorsMessages, visitorsDateLocale } from '@/lib/visitors-i18n'
import { useVisitorUiLocale } from './use-visitor-ui-locale'

export function useVisitorsI18n() {
  const locale = useVisitorUiLocale()
  return {
    ...getVisitorsMessages(locale),
    locale,
    dateLocale: visitorsDateLocale(locale),
  }
}
