import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gu Live Chat',
  description: 'Canlı Destek',
}

/** Embed iframe: html/body tam yükseklik — portal içeriği görünür kalsın */
const EMBED_SHELL_CSS = `
  html, body {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: #ffffff;
    color-scheme: light;
  }
  body { position: relative; }
`

export default function WidgetLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EMBED_SHELL_CSS }} />
      <div
        data-widget-root
        style={{
          colorScheme: 'light',
          color: '#1f2937',
          background: '#ffffff',
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </>
  )
}