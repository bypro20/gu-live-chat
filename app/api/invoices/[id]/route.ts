import { NextRequest, NextResponse } from 'next/server'
import { requireWebsiteAccess, isErrorResponse } from '@/lib/middleware'
import { prisma } from '@/lib/db'

// GET /api/invoices/[id] — Get single invoice detail
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireWebsiteAccess(req)

  if (isErrorResponse(access)) return access

  const { website } = access
  const { id } = await params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  })

  if (!invoice || invoice.websiteId !== website.id) {
    return NextResponse.json({ error: 'Fatura bulunamadı' }, { status: 404 })
  }

  return NextResponse.json({ invoice })
}