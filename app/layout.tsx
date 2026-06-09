import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/lib/toast'
import { buildMetadata, PAGE_SEO } from '@/lib/seo'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  ...buildMetadata(PAGE_SEO.home),
  metadataBase: new URL('https://guchat.org'),
  authors: [{ name: 'Gu Chat', url: 'https://guchat.org' }],
  creator: 'Gu Chat',
  publisher: 'Gu Chat',
  formatDetection: { email: false, address: false, telephone: false },
  category: 'technology',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-[family-name:var(--font-jakarta)] min-h-full bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
