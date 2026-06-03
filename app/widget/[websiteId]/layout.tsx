import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gu Live Chat',
  description: 'Canlı Destek',
}

// Widget layout: Force light mode for the widget iframe.
// Prevents white-on-white text when the system uses dark mode.
export default function WidgetLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div
      data-widget-root
      style={{
        colorScheme: 'light',
        color: '#1f2937',
        background: '#ffffff',
        width: '100%',
        height: '100%',
      }}
    >
      {children}
    </div>
  )
}