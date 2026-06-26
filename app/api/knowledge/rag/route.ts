import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveWebsite } from '@/lib/website-resolve'
import {
  countArticleChunks,
  countKnowledgeChunks,
  deleteKnowledgeSourceRow,
  getKnowledgeSource,
  listKnowledgeSources,
} from '@/lib/ai/rag/db'
import { createKnowledgeSource, indexKnowledgeSource, reindexAllArticles } from '@/lib/ai/rag/ingest'

async function assertMember(websitePublicId: string, userId: string) {
  const website = await resolveWebsite(websitePublicId)
  if (!website) return null
  const member = await prisma.teamMember.findFirst({
    where: { websiteId: website.id, userId },
  })
  if (!member) return null
  return website
}

/** GET /api/knowledge/rag?websiteId= — list RAG sources */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const websiteId = req.nextUrl.searchParams.get('websiteId')
  if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

  const website = await assertMember(websiteId, session.user.id)
  if (!website) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

  const [sources, chunkCount, articleChunks] = await Promise.all([
    listKnowledgeSources(website.id),
    countKnowledgeChunks(website.id),
    countArticleChunks(website.id),
  ])

  return NextResponse.json({ sources, chunkCount, articleChunks })
}

/** POST /api/knowledge/rag — add URL/text source or reindex articles */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const websiteId = body.websiteId as string
    if (!websiteId) return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })

    const website = await assertMember(websiteId, session.user.id)
    if (!website) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    if (body.action === 'reindex-articles') {
      const result = await reindexAllArticles(website.id)
      return NextResponse.json({ success: true, ...result })
    }

    const type = body.type as 'URL' | 'TEXT' | 'FILE'
    const name = (body.name as string)?.trim()
    if (!type || !name) {
      return NextResponse.json({ error: 'type ve name gerekli' }, { status: 400 })
    }

    if (type === 'URL' && !body.url?.trim()) {
      return NextResponse.json({ error: 'url gerekli' }, { status: 400 })
    }
    if ((type === 'TEXT' || type === 'FILE') && !body.textContent?.trim()) {
      return NextResponse.json({ error: 'textContent gerekli' }, { status: 400 })
    }

    const result = await createKnowledgeSource({
      websiteId: website.id,
      type,
      name,
      url: body.url?.trim(),
      textContent: body.textContent?.trim(),
      fileName: body.fileName?.trim(),
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[RAG POST]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kaynak eklenemedi' },
      { status: 500 }
    )
  }
}

/** DELETE /api/knowledge/rag?sourceId= */
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const sourceId = req.nextUrl.searchParams.get('sourceId')
  if (!sourceId) return NextResponse.json({ error: 'sourceId gerekli' }, { status: 400 })

  const source = await getKnowledgeSource(sourceId)
  if (!source) return NextResponse.json({ error: 'Kaynak bulunamadı' }, { status: 404 })

  const pub = await prisma.website.findUnique({ where: { id: source.websiteId }, select: { websiteId: true } })
  const website = pub ? await assertMember(pub.websiteId, session.user.id) : null
  if (!website || website.id !== source.websiteId) {
    return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })
  }

  await deleteKnowledgeSourceRow(sourceId)
  return NextResponse.json({ success: true })
}

/** PATCH /api/knowledge/rag — reindex single source */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  try {
    const { sourceId } = await req.json()
    if (!sourceId) return NextResponse.json({ error: 'sourceId gerekli' }, { status: 400 })

    const source = await getKnowledgeSource(sourceId)
    if (!source) return NextResponse.json({ error: 'Kaynak bulunamadı' }, { status: 404 })

    const pub = await prisma.website.findUnique({ where: { id: source.websiteId }, select: { websiteId: true } })
    const website = pub ? await assertMember(pub.websiteId, session.user.id) : null
    if (!website) return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 })

    const result = await indexKnowledgeSource(sourceId)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Yeniden indekslenemedi' },
      { status: 500 }
    )
  }
}
