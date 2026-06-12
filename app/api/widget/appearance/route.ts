import { NextResponse } from 'next/server'
import { findWebsiteForWidget } from '@/lib/website-widget-safe'
import { resolveAgentsOnline } from '@/lib/agents-online'

/** GET /api/widget/appearance?websiteId= — Public branding for embed launcher teaser */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const websiteId = searchParams.get('websiteId')
    if (!websiteId) {
      return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
    }

    const website = await findWebsiteForWidget(websiteId)
    if (!website) {
      return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })
    }

    const agentsOnline = (await resolveAgentsOnline(website.websiteId, website.id)) > 0

    return NextResponse.json({
      primaryColor: website.primaryColor || '#1972F5',
      welcomeMessage: website.welcomeMessage || 'Merhaba! 👋 Size nasıl yardımcı olabilirim?',
      avatarUrl: website.avatarUrl || null,
      websiteName: website.name || 'Destek',
      agentsOnline,
    })
  } catch (error) {
    console.error('[widget/appearance]', error)
    return NextResponse.json({ error: 'Yapılandırma alınamadı' }, { status: 500 })
  }
}
