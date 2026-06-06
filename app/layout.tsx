import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { ToastProvider } from '@/lib/toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'),
  title: {
    default: 'Gu Chat — Profesyonel Canlı Destek Platformu',
    template: '%s | Gu Chat',
  },
  description:
    'Web sitenize ekleyebileceğiniz profesyonel canlı destek sistemi. Gerçek zamanlı mesajlaşma, AI asistan ve analitik — Türk yapımı.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full bg-background text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
