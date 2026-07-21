// ============================================================================
// AI QUALITY CHECK — API Route
// POST /api/ai-itinerary/quality-check
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { runQualityCheck } from '@/lib/services/ai-itinerary'
import type { AIGeneratedItinerary, AIItineraryPrompt } from '@/types/ai-itinerary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { itinerary, prompt } = body as {
      itinerary: AIGeneratedItinerary
      prompt: AIItineraryPrompt
    }

    if (!itinerary || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: itinerary, prompt' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())

    const { result, provider, model } = await runQualityCheck(
      itinerary,
      prompt,
      controller.signal
    )

    return NextResponse.json({ qualityCheck: result, provider, model })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Quality check cancelled' }, { status: 499 })
    }
    console.error('AI quality check error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Quality check failed' },
      { status: 500 }
    )
  }
}
