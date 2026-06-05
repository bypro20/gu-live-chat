import { NextRequest, NextResponse } from 'next/server'
import { requireWebsiteAccess, isErrorResponse } from '@/lib/middleware'
import { getWebsiteInvoices } from '@/lib/invoice'

// GET /api/invoices — List invoices for a website
export async function GET(req: NextRequest) {
  const access = await requireWebsiteAccess(req)

  if (isErrorResponse(access)) return access

  const { website } = access

  const invoices = await getWebsiteInvoices(website.id)

  return NextResponse.json({ invoices })
}