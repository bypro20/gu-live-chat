import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Gu Live Chat — Canlı destek yazılımı'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #111111 45%, #7f1d1d 100%)',
          color: '#ffffff',
          padding: 48,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>Gu Live Chat</div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.92, textAlign: 'center', maxWidth: 900 }}>
          Canlı destek · AI chatbot · WhatsApp & Instagram tek panelde
        </div>
        <div style={{ fontSize: 26, marginTop: 36, color: '#fca5a5' }}>www.gulivechat.com</div>
      </div>
    ),
    { ...size }
  )
}
