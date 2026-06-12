import { NextResponse } from 'next/server'
import { isIyzicoConfigured } from '@/lib/iyzico'

export async function GET() {
  return NextResponse.json({
    iyzico: isIyzicoConfigured(),
  })
}
