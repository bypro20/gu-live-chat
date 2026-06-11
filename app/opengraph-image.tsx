import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Gu Chat — Canlı destek ve chatbot platformu'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 72,
          background: 'linear-gradient(135deg, #0B1220 0%, #1E3A8A 45%, #2563EB 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 36 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
            }}
          >
            💬
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 800, letterSpacing: -2 }}>
            <span>Gu </span>
            <span style={{ color: '#93C5FD' }}>Chat</span>
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, lineHeight: 1.25, maxWidth: 900 }}>
          Canlı destek, AI chatbot ve WhatsApp — tek platformda
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: '#BFDBFE' }}>
          guchat.org · Ücretsiz başlayın · Türkiye&apos;de üretildi
        </div>
      </div>
    ),
    { ...size }
  )
}
