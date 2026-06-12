import { useLocale } from '@/components/marketing/locale-provider'
import { getDashboardMessages } from '@/lib/dashboard-i18n'

export function useDashboardI18n() {
  const { locale } = useLocale()
  const messages = getDashboardMessages(locale)
  return {
    ...messages,
    locale,
    dateLocale: locale === 'en' ? 'en-US' : 'tr-TR',
  }
}
