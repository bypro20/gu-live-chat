import { useLocale } from '@/components/marketing/locale-provider'
import { getDashboardMessages } from '@/lib/dashboard-i18n'
import { getSettingsMessages, settingsDateLocale } from '@/lib/settings-i18n'

export function useSettingsI18n() {
  const { locale } = useLocale()
  const dashboard = getDashboardMessages(locale)
  const settings = getSettingsMessages(locale)
  return {
    ...settings,
    common: {
      ...dashboard.common,
      ...settings.common,
    },
    locale,
    dateLocale: settingsDateLocale(locale),
  }
}
