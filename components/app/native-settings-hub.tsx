'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import { clearNativeAppMark } from '@/lib/native-app'
import { useActiveWebsite } from '@/lib/hooks/use-active-website'
import { useDashboardI18n } from '@/lib/hooks/use-dashboard-i18n'
import { WebsitePickerSheet } from '@/components/app/website-picker-sheet'

type HubItem = {
  href: string
  label: string
  desc?: string
  icon: React.ReactNode
}

const icons = {
  general: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-1.227-8.365-3.457m16.649 0A8.959 8.959 0 0021 12" />
    </svg>
  ),
  team: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  privacy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  widget: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  channels: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  chatbot: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  ),
  canned: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  plans: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  billing: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  addons: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  knowledge: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  visitors: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

function useNativeHubGroups(): { title: string; items: HubItem[] }[] {
  const d = useDashboardI18n()
  const n = d.nav
  const pt = d.pageTitles

  return useMemo(
    () => [
      {
        title: n.account,
        items: [
          { href: '/settings/general', label: pt.general, desc: d.dashboard.subtitleDefault, icon: icons.general },
          { href: '/settings/team', label: n.team, icon: icons.team },
          { href: '/settings/privacy', label: n.privacy, icon: icons.privacy },
        ],
      },
      {
        title: n.communication,
        items: [
          { href: '/settings/widget', label: n.widget, icon: icons.widget },
          { href: '/settings/channels', label: n.channels, icon: icons.channels },
          { href: '/settings/chatbot', label: d.dashboard.quickChatbot, icon: icons.chatbot },
          { href: '/settings/canned-responses', label: n.cannedResponses, icon: icons.canned },
        ],
      },
      {
        title: n.subscription,
        items: [
          { href: '/settings/plans', label: n.plans, icon: icons.plans },
          { href: '/settings/billing', label: n.billing, icon: icons.billing },
          { href: '/settings/addons', label: n.addonStore, icon: icons.addons },
        ],
      },
      {
        title: n.configuration,
        items: [
          { href: '/settings/knowledge', label: n.knowledge, icon: icons.knowledge },
          { href: '/analytics', label: n.analytics, icon: icons.analytics },
          { href: '/visitors', label: n.visitors, icon: icons.visitors },
        ],
      },
    ],
    [d, n, pt]
  )
}

export function NativeSettingsHub() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { activeWebsite, websites, switchWebsite } = useActiveWebsite()
  const [mounted, setMounted] = useState(false)
  const [websitePickerOpen, setWebsitePickerOpen] = useState(false)
  const groups = useNativeHubGroups()
  const { shell } = useDashboardI18n()

  useEffect(() => { setMounted(true) }, [])

  const userInitial =
    session?.user?.name?.charAt(0)?.toUpperCase() ||
    session?.user?.email?.charAt(0)?.toUpperCase() ||
    '?'

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    clearNativeAppMark()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="native-settings-hub p-4 pb-8">
      <div className="native-profile-card mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground truncate">{session?.user?.name || shell.user}</p>
          <p className="text-sm text-muted-foreground truncate">{session?.user?.email}</p>
          {activeWebsite && (
            <p className="text-xs text-primary font-medium mt-1 truncate">{activeWebsite.name}</p>
          )}
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.title} className="mb-5">
          <h2 className="native-hub-section-title">{group.title}</h2>
          <div className="native-hub-list">
            {group.items.map((item) => (
              <Link key={item.href} href={item.href} className="native-hub-row">
                <span className="native-hub-icon">{item.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-semibold text-foreground">{item.label}</span>
                  {item.desc && (
                    <span className="block text-xs text-muted-foreground truncate mt-0.5">{item.desc}</span>
                  )}
                </span>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="native-hub-action mb-3"
        >
          {theme === 'dark' ? shell.lightTheme : shell.darkTheme}
        </button>
      )}

      {websites.length > 1 && (
        <button
          type="button"
          onClick={() => setWebsitePickerOpen(true)}
          className="native-hub-action mb-3"
        >
          {shell.switchAccount}
        </button>
      )}

      <button type="button" onClick={() => void handleSignOut()} className="native-hub-action native-hub-action--danger">
        {shell.signOut}
      </button>

      <WebsitePickerSheet
        open={websitePickerOpen}
        onClose={() => setWebsitePickerOpen(false)}
        websites={websites}
        activeWebsiteId={activeWebsite?.websiteId}
        onSelect={switchWebsite}
      />
    </div>
  )
}
