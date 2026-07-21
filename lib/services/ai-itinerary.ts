// ============================================================================
// AI ITINERARY SERVICE — Phase X
// Core generation, refinement, quality check, and chat logic
// All AI calls go through the provider abstraction layer
// ============================================================================

import { generateWithFallback } from './ai-provider'
import {
  buildGenerationPrompt,
  buildRefinementPrompt,
  buildQualityCheckPrompt,
  buildChatAssistantPrompt,
  buildRegenerateDayPrompt,
  buildRegenerateSlotPrompt,
  buildRegenerateCategoryPrompt,
} from './ai-prompts'
import {
  AIGeneratedItinerarySchema,
  AIGeneratedItemSchema,
  AIGeneratedDaySchema,
  AIQualityCheckResultSchema,
} from '@/types/ai-itinerary'
import type {
  AIItineraryPrompt,
  AIGeneratedItinerary,
  AIGeneratedItem,
  AIGeneratedDay,
  AIQualityCheckResult,
  AIRefineMode,
  AIChatRequest,
  AIChatResponse,
  AIRegenerateRequest,
} from '@/types/ai-itinerary'

// ── Generate Full Itinerary ──────────────────────────────────────────────────

export async function generateAIItinerary(
  prompt: AIItineraryPrompt,
  signal?: AbortSignal
): Promise<{
  itinerary: AIGeneratedItinerary
  provider: string
  model: string
}> {
  const fullPrompt = buildGenerationPrompt(prompt)
  
  const { result, provider, model } = await generateWithFallback(
    '', // System prompt is embedded in the full prompt for Gemini compatibility
    fullPrompt,
    signal
  )

  // Validate with Zod schema
  const parsed = AIGeneratedItinerarySchema.parse(result)

  // Post-process: ensure all items have AI flags
  for (const day of parsed.days) {
    for (const item of day.items) {
      item.isAiSuggested = true
      if (!item.isSupplierConfirmed) {
        item.isSupplierConfirmed = false
      }
    }
  }

  return { itinerary: parsed, provider, model }
}

// ── Refine Single Activity ───────────────────────────────────────────────────

export async function refineActivity(
  item: AIGeneratedItem,
  mode: AIRefineMode,
  context?: { dayNumber: number; destination: string; travelStyle?: string },
  signal?: AbortSignal
): Promise<{
  item: AIGeneratedItem
  provider: string
  model: string
}> {
  const prompt = buildRefinementPrompt(
    item as unknown as Record<string, unknown>,
    mode,
    context
  )

  const { result, provider, model } = await generateWithFallback('', prompt, signal)
  const parsed = AIGeneratedItemSchema.parse(result)
  
  // Ensure AI flags
  parsed.isAiSuggested = true
  parsed.isSupplierConfirmed = false

  return { item: parsed, provider, model }
}

// ── Quality Check ────────────────────────────────────────────────────────────

export async function runQualityCheck(
  itinerary: AIGeneratedItinerary,
  prompt: AIItineraryPrompt,
  signal?: AbortSignal
): Promise<{
  result: AIQualityCheckResult
  provider: string
  model: string
}> {
  const checkPrompt = buildQualityCheckPrompt(
    itinerary as unknown as Record<string, unknown>,
    prompt as unknown as Record<string, unknown>
  )

  const { result, provider, model } = await generateWithFallback('', checkPrompt, signal)
  
  // Validate with Zod
  const parsed = AIQualityCheckResultSchema.parse(result)
  
  // Add timestamp if missing
  if (!parsed.checkedAt) {
    parsed.checkedAt = new Date().toISOString()
  }

  return { result: parsed, provider, model }
}

// ── Chat Assistant ───────────────────────────────────────────────────────────

export async function chatAssist(
  request: AIChatRequest,
  signal?: AbortSignal
): Promise<{
  response: AIChatResponse
  provider: string
  model: string
}> {
  const prompt = buildChatAssistantPrompt(
    request.message,
    request.itineraryContext as unknown as Record<string, unknown>,
    request.conversationHistory.map(m => ({ role: m.role, content: m.content }))
  )

  const { result, provider, model } = await generateWithFallback('', prompt, signal)
  
  // Parse and validate response
  const response = result as AIChatResponse
  if (!response.message) {
    throw new Error('Invalid chat response: missing message')
  }
  if (!Array.isArray(response.actions)) {
    response.actions = []
  }

  return { response, provider, model }
}

// ── Regenerate Day ───────────────────────────────────────────────────────────

export async function regenerateDay(
  itinerary: AIGeneratedItinerary,
  dayNumber: number,
  instructions?: string,
  signal?: AbortSignal
): Promise<{
  day: AIGeneratedDay
  provider: string
  model: string
}> {
  const prompt = buildRegenerateDayPrompt(
    itinerary as unknown as Record<string, unknown>,
    dayNumber,
    instructions
  )

  const { result, provider, model } = await generateWithFallback('', prompt, signal)
  const parsed = AIGeneratedDaySchema.parse(result)

  // Ensure AI flags on all items
  for (const item of parsed.items) {
    item.isAiSuggested = true
    item.isSupplierConfirmed = false
  }

  return { day: parsed, provider, model }
}

// ── Regenerate Time Slot ─────────────────────────────────────────────────────

export async function regenerateTimeSlot(
  itinerary: AIGeneratedItinerary,
  dayNumber: number,
  timeSlot: 'morning' | 'afternoon' | 'evening',
  instructions?: string,
  signal?: AbortSignal
): Promise<{
  items: AIGeneratedItem[]
  provider: string
  model: string
}> {
  const prompt = buildRegenerateSlotPrompt(
    itinerary as unknown as Record<string, unknown>,
    dayNumber,
    timeSlot,
    instructions
  )

  const { result, provider, model } = await generateWithFallback('', prompt, signal)
  
  // Result should be an array of items
  const rawResult = result as Record<string, unknown>
  const rawItems: unknown[] = Array.isArray(result) ? result : (Array.isArray(rawResult.items) ? rawResult.items : [result])
  const items = rawItems.map((item: unknown) => {
    const parsed = AIGeneratedItemSchema.parse(item)
    parsed.isAiSuggested = true
    parsed.isSupplierConfirmed = false
    return parsed
  })

  return { items, provider, model }
}

// ── Regenerate Category ──────────────────────────────────────────────────────

export async function regenerateCategory(
  itinerary: AIGeneratedItinerary,
  category: 'hotels' | 'restaurants' | 'tours' | 'transport' | 'shopping',
  instructions?: string,
  signal?: AbortSignal
): Promise<{
  replacements: Record<number, AIGeneratedItem[]>
  provider: string
  model: string
}> {
  const prompt = buildRegenerateCategoryPrompt(
    itinerary as unknown as Record<string, unknown>,
    category,
    instructions
  )

  const { result, provider, model } = await generateWithFallback('', prompt, signal)
  
  const raw = result as { replacements: Record<string, unknown[]> }
  const replacements: Record<number, AIGeneratedItem[]> = {}

  for (const [dayNum, items] of Object.entries(raw.replacements || {})) {
    replacements[parseInt(dayNum)] = (items as unknown[]).map((item: unknown) => {
      const parsed = AIGeneratedItemSchema.parse(item)
      parsed.isAiSuggested = true
      parsed.isSupplierConfirmed = false
      return parsed
    })
  }

  return { replacements, provider, model }
}

// ── Cost Estimation (standalone) ─────────────────────────────────────────────

export function calculateCostSummary(itinerary: AIGeneratedItinerary) {
  // Recalculate from items if costEstimate seems off
  let hotels = 0, flights = 0, meals = 0, transport = 0
  let tours = 0, shopping = 0, misc = 0

  for (const day of itinerary.days) {
    for (const item of day.items) {
      const cost = item.costEstimate || 0
      switch (item.type) {
        case 'hotel': hotels += cost; break
        case 'flight': flights += cost; break
        case 'restaurant': meals += cost; break
        case 'transfer':
        case 'train':
        case 'cruise': transport += cost; break
        case 'tour': tours += cost; break
        case 'shopping': shopping += cost; break
        default: misc += cost; break
      }
    }
  }

  const total = hotels + flights + meals + transport + tours + shopping + misc
  
  return {
    ...itinerary.costEstimate,
    hotels,
    flights,
    meals,
    transport,
    tours,
    shopping,
    miscellaneous: misc,
    total,
  }
}
