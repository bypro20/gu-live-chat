'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { LocaleContext } from '@/lib/locale-server'
import { getMessages, type FullMessageTree } from '@/lib/messages'
import type { SiteLocale } from '@/lib/regional-config'

type LocaleState = LocaleContext & {
  messages: FullMessageTree
  setLocale: (locale: SiteLocale) => Promise<void>
}

function buildState(ctx: LocaleContext): Omit<LocaleState, 'setLocale'> {
  return {
    ...ctx,
    messages: getMessages(ctx.locale),
  }
}

const FALLBACK = buildState({
  country: 'TR',
  region: 'TR',
  locale: 'tr',
  currency: 'TRY',
  paymentProvider: 'iyzico',
  intlLocale: 'tr-TR',
})

const LocaleCtx = createContext<LocaleState>({ ...FALLBACK, setLocale: async () => {} })

export function LocaleProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial?: LocaleContext | null
}) {
  const router = useRouter()
  const [ctx, setCtx] = useState<Omit<LocaleState, 'setLocale'>>(() =>
    initial ? buildState(initial) : FALLBACK
  )

  useEffect(() => {
    document.documentElement.lang = ctx.locale
  }, [ctx.locale])

  useEffect(() => {
    fetch('/api/locale')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LocaleContext | null) => {
        if (!data) return
        setCtx(buildState(data))
      })
      .catch(() => {})
  }, [])

  const setLocale = useCallback(async (locale: SiteLocale) => {
    const res = await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
    if (!res.ok) return
    const data = (await res.json()) as LocaleContext
    setCtx(buildState(data))
    router.refresh()
  }, [router])

  const value = useMemo(() => ({ ...ctx, setLocale }), [ctx, setLocale])

  return <LocaleCtx.Provider value={value}>{children}</LocaleCtx.Provider>
}

export function useLocale() {
  return useContext(LocaleCtx)
}

export function useT() {
  return useContext(LocaleCtx).messages
}
