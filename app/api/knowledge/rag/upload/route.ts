import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resolveWebsite } from '@/lib/website-resolve'
import { prisma } from '@/lib/db'
import { extractPdfText } from '@/lib/ai/pdf-extract'
import { createKnowledgeSource } from '@/lib/ai/rag/ingest'

/** POST /api/knowledge/rag/upload — PDF dosyası ile RAG eğitimi */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const websiteId = form.get('websiteId') as string
    const name = (form.get('name') as string)?.trim()
    const file = form.get('file')

    if (!websiteId || !name || !(file instanceof File)) {
      return NextResponse.json({ error: 'websiteId, name ve file gerekli' }, { status: 400 })
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Yalnızca PDF desteklenir' }, { status: 400 })
    }

    const website = await resolveWebsite(websiteId)
    if (!website) return NextResponse.json({ error: 'Site bulunamadı' }, { status: 404 })

    const member = await prisma.teamMember.findFirst({
      where: { websiteId: website.id, userId: session.user.id },
    })
    if (!member) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = extractPdfText(buffer)

    const result = await createKnowledgeSource({
      websiteId: website.id,
      type: 'FILE',
      name,
      textContent: text,
      fileName: file.name,
    })

    return NextResponse.json({ success: true, ...result, chars: text.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF yüklenemedi' },
      { status: 500 }
    )
  }
}
