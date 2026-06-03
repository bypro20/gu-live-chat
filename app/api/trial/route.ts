import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { startTrial, isTrialActive, getTrialInfo } from '@/lib/trial'

// POST /api/trial — Start trial for a website
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const body = await req.json()
  const { websiteId } = body as { websiteId: string }

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  // Check if trial already used
  const trialInfo = await getTrialInfo(websiteId)
  if (trialInfo.trialUsed) {
    return NextResponse.json({ error: 'Deneme süresi zaten kullanılmış' }, { status: 400 })
  }

  if (trialInfo.isTrialing) {
    return NextResponse.json({ error: 'Deneme süresi zaten aktif' }, { status: 400 })
  }

  try {
    const result = await startTrial(websiteId)
    return NextResponse.json({
      success: true,
      trialEndsAt: result.trialEndsAt,
      trialPlan: result.trialPlan,
    })
  } catch (error) {
    console.error('Failed to start trial:', error)
    return NextResponse.json({ error: 'Deneme süresi başlatılamadı' }, { status: 500 })
  }
}

// GET /api/trial — Get trial info for a website
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const websiteId = searchParams.get('websiteId')

  if (!websiteId) {
    return NextResponse.json({ error: 'websiteId gerekli' }, { status: 400 })
  }

  const trialInfo = await getTrialInfo(websiteId)

  return NextResponse.json(trialInfo)
}