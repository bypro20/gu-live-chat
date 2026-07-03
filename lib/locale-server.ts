import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cookies, headers } from 'next/headers'
import {
  COUNTRY_COOKIE,
  GLOBAL_FALLBACK_COUNTRY,
  LOCALE_COOKIE,
  LOCALE_MANUAL_COOKIE,
  REGION_COOKIE,
  defaultLocaleForCountry,
  defaultLocaleForRegion,
  parseAcceptLanguage,
  parseLocale,
  countryPaymentProfile,
  intlLocaleFor,
  resolveRegion,
  type MarketRegion,
  type PaymentCurrency,
  type SiteLocale,
} from './regional-config'

export type LocaleContext = {
  country: string
  region: MarketRegion
  locale: SiteLocale
  currency: PaymentCurrency
  paymentProvider: 'iyzico'
  intlLocale: string
}

type LocaleInput = {
  country: string
  cookieLocale?: string | null
  localeManual?: string | null
  queryLang?: string | null
  acceptLanguage?: string | null
}

function countryFromRequest(req: NextRequest): string {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    req.cookies.get(COUNTRY_COOKIE)?.value ||
    GLOBAL_FALLBACK_COUNTRY
  ).toUpperCase()
}

function buildLocaleContext(input: LocaleInput): LocaleContext {
  const country = input.country.toUpperCase()
  const region = resolveRegion(country)
  const manual = input.localeManual === '1'
  const queryLocale = parseLocale(input.queryLang)
  const cookieLocale = parseLocale(input.cookieLocale)
  const countryLocale = defaultLocaleForCountry(country)
  const browserLocale = parseAcceptLanguage(input.acceptLanguage ?? null)

  const locale =
    queryLocale ||
    (manual && cookieLocale ? cookieLocale : null) ||
    countryLocale ||
    browserLocale ||
    defaultLocaleForRegion(region)

  const profile = countryPaymentProfile(country)
  return {
    country,
    region,
    locale,
    currency: profile.currency,
    paymentProvider: profile.paymentProvider,
    intlLocale: intlLocaleFor(profile.currency, locale),
  }
}

export function detectLocaleContext(req: NextRequest): LocaleContext {
  return buildLocaleContext({
    country: countryFromRequest(req),
    cookieLocale: req.cookies.get(LOCALE_COOKIE)?.value,
    localeManual: req.cookies.get(LOCALE_MANUAL_COOKIE)?.value,
    queryLang: req.nextUrl.searchParams.get('lang'),
    acceptLanguage: req.headers.get('accept-language'),
  })
}

export async function getServerLocaleContext(): Promise<LocaleContext> {
  const cookieStore = await cookies()
  const headersList = await headers()
  const country = (
    headersList.get('x-vercel-ip-country') ||
    headersList.get('cf-ipcountry') ||
    cookieStore.get(COUNTRY_COOKIE)?.value ||
    GLOBAL_FALLBACK_COUNTRY
  ).toUpperCase()

  return buildLocaleContext({
    country,
    cookieLocale: cookieStore.get(LOCALE_COOKIE)?.value,
    localeManual: cookieStore.get(LOCALE_MANUAL_COOKIE)?.value,
    acceptLanguage: headersList.get('accept-language'),
  })
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function applyLocaleCookies(
  res: NextResponse,
  ctx: LocaleContext,
  options?: { manual?: boolean }
): void {
  res.cookies.set(COUNTRY_COOKIE, ctx.country, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  res.cookies.set(REGION_COOKIE, ctx.region, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  res.cookies.set(LOCALE_COOKIE, ctx.locale, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  if (options?.manual) {
    res.cookies.set(LOCALE_MANUAL_COOKIE, '1', { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' })
  }
}

/** @deprecated use applyLocaleCookies */
export function localeCookieHeaders(ctx: LocaleContext): [string, string][] {
  const maxAge = COOKIE_MAX_AGE
  return [
    ['Set-Cookie', `${COUNTRY_COOKIE}=${ctx.country}; Path=/; Max-Age=${maxAge}; SameSite=Lax`],
    ['Set-Cookie', `${REGION_COOKIE}=${ctx.region}; Path=/; Max-Age=${maxAge}; SameSite=Lax`],
    ['Set-Cookie', `${LOCALE_COOKIE}=${ctx.locale}; Path=/; Max-Age=${maxAge}; SameSite=Lax`],
  ]
}

export function readLocaleContextFromCookies(cookieHeader: string | null): Partial<LocaleContext> {
  if (!cookieHeader) return {}
  const get = (name: string) => {
    const m = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return m ? decodeURIComponent(m[1]) : null
  }
  const country = get(COUNTRY_COOKIE) || GLOBAL_FALLBACK_COUNTRY
  const region = resolveRegion(country)
  const manual = get(LOCALE_MANUAL_COOKIE) === '1'
  const cookieLocale = parseLocale(get(LOCALE_COOKIE))
  const locale =
    (manual && cookieLocale ? cookieLocale : null) ||
    defaultLocaleForCountry(country) ||
    defaultLocaleForRegion(region)
  const profile = countryPaymentProfile(country)
  return {
    country,
    region,
    locale,
    currency: profile.currency,
    paymentProvider: profile.paymentProvider,
    intlLocale: intlLocaleFor(profile.currency, locale),
  }
}
