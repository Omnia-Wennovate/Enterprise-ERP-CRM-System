// ============================================================================
// AI ITINERARY GENERATION — API Route
// POST /api/ai-itinerary/generate
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { AIItineraryPromptSchema } from '@/types/ai-itinerary'
import { generateAIItinerary } from '@/lib/services/ai-itinerary'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parseResult = AIItineraryPromptSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const prompt = parseResult.data

    // Create AbortController for cancellation support
    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())

    // Generate itinerary
    const { itinerary, provider, model } = await generateAIItinerary(prompt, controller.signal)

    // Store generation record
    let generationId: string | null = null
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('ai_itinerary_generations')
        .insert([{
          prompt: body,
          result: itinerary,
          provider,
          model,
          status: 'generated',
          created_by: body.userId || null,
        }])
        .select('id')
        .single()

      if (data) generationId = data.id

      // Also log to history
      await supabase.from('ai_generation_history').insert([{
        generation_id: generationId,
        action: 'generate',
        input: body,
        output: itinerary,
        provider,
        model,
      }])
    } catch {
      // Non-critical — tracking tables may not exist yet
      console.warn('Could not save generation record')
    }

    return NextResponse.json({
      itinerary,
      generationId,
      provider,
      model,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return NextResponse.json({ error: 'Generation cancelled' }, { status: 499 })
    }
    console.error('AI generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
