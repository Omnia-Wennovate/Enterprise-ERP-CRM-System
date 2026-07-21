// ============================================================================
// AI REGENERATE — API Route
// POST /api/ai-itinerary/regenerate
// Regenerate single day / time slot / category
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { regenerateDay, regenerateTimeSlot, regenerateCategory } from '@/lib/services/ai-itinerary'
import type { AIGeneratedItinerary } from '@/types/ai-itinerary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { generatedItinerary, target, instructions } = body as {
      generatedItinerary: AIGeneratedItinerary
      target: {
        type: 'day' | 'time_slot' | 'category'
        dayNumber?: number
        timeSlot?: 'morning' | 'afternoon' | 'evening'
        category?: 'hotels' | 'restaurants' | 'tours' | 'transport' | 'shopping'
      }
      instructions?: string
    }

    if (!generatedItinerary || !target?.type) {
      return NextResponse.json(
        { error: 'Missing required fields: generatedItinerary, target' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())

    switch (target.type) {
      case 'day': {
        if (!target.dayNumber) {
          return NextResponse.json({ error: 'dayNumber required for day regeneration' }, { status: 400 })
        }
        const { day, provider, model } = await regenerateDay(
          generatedItinerary, target.dayNumber, instructions, controller.signal
        )
        return NextResponse.json({ type: 'day', day, provider, model })
      }

      case 'time_slot': {
        if (!target.dayNumber || !target.timeSlot) {
          return NextResponse.json({ error: 'dayNumber and timeSlot required' }, { status: 400 })
        }
        const { items, provider, model } = await regenerateTimeSlot(
          generatedItinerary, target.dayNumber, target.timeSlot, instructions, controller.signal
        )
        return NextResponse.json({ type: 'time_slot', items, provider, model })
      }

      case 'category': {
        if (!target.category) {
          return NextResponse.json({ error: 'category required' }, { status: 400 })
        }
        const { replacements, provider, model } = await regenerateCategory(
          generatedItinerary, target.category, instructions, controller.signal
        )
        return NextResponse.json({ type: 'category', replacements, provider, model })
      }

      default:
        return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Regeneration cancelled' }, { status: 499 })
    }
    console.error('AI regeneration error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Regeneration failed' },
      { status: 500 }
    )
  }
}
