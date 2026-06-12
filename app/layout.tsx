import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/lib/toast'
import { buildMetadata, PAGE_SEO } from '@/lib/seo'
import { SiteAnalytics } from '@/components/marketing/site-analytics'
import { NativeAppBootstrap } from '@/components/app/native-app-bootstrap'
import { AttributionBootstrap } from '@/components/marketing/attribution-bootstrap'
import { NATIVE_SHELL_SCRIPT } from '@/lib/native-shell-script'
import { getServerLocaleContext } from '@/lib/locale-server'
import { getSiteUrl } from '@/lib/site-config'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  ...buildMetadata(PAGE_SEO.home),
  metadataBase: new URL(getSiteUrl()),
  applicationName: 'Gu Live Chat',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  authors: [{ name: 'Gu Live Chat', url: getSiteUrl() }],
  creator: 'Gu Live Chat',
  publisher: 'Gu Live Chat',
  formatDetection: { email: false, address: false, telephone: false },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { locale } = await getServerLocaleContext()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-[family-name:var(--font-jakarta)] min-h-full bg-background text-foreground antialiased`}>
        <Script id="native-shell" strategy="beforeInteractive">
          {NATIVE_SHELL_SCRIPT}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <NativeAppBootstrap />
            <AttributionBootstrap />
            {children}
            <SiteAnalytics />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
