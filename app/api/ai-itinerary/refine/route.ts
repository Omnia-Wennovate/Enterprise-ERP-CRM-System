// ============================================================================
// AI ITINERARY REFINEMENT — API Route
// POST /api/ai-itinerary/refine
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { refineActivity } from '@/lib/services/ai-itinerary'
import type { AIRefineMode, AIGeneratedItem } from '@/types/ai-itinerary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { item, mode, context } = body as {
      item: AIGeneratedItem
      mode: AIRefineMode
      context?: { dayNumber: number; destination: string; travelStyle?: string }
    }

    if (!item || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: item, mode' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())

    const { item: refined, provider, model } = await refineActivity(
      item,
      mode,
      context,
      controller.signal
    )

    return NextResponse.json({ item: refined, provider, model })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Refinement cancelled' }, { status: 499 })
    }
    console.error('AI refinement error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Refinement failed' },
      { status: 500 }
    )
  }
}
