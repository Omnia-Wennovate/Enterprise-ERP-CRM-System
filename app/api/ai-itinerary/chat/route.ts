// ============================================================================
// AI TRAVEL ASSISTANT CHAT — API Route
// POST /api/ai-itinerary/chat
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { chatAssist } from '@/lib/services/ai-itinerary'
import type { AIChatRequest } from '@/types/ai-itinerary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AIChatRequest

    if (!body.message || !body.itineraryContext) {
      return NextResponse.json(
        { error: 'Missing required fields: message, itineraryContext' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())

    const { response, provider, model } = await chatAssist(body, controller.signal)

    return NextResponse.json({ ...response, provider, model })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Chat cancelled' }, { status: 499 })
    }
    console.error('AI chat error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    )
  }
}
