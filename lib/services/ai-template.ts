// ============================================================================
// AI TEMPLATE SERVICE — Phase X
// Save/load AI itinerary templates for reuse
// ============================================================================

import { createClient } from '@/lib/supabase/client'
import type { AITemplate, AIGeneratedItinerary } from '@/types/ai-itinerary'

// ── Save Template ────────────────────────────────────────────────────────────

export async function saveAsAITemplate(
  itineraryId: string,
  name: string,
  description?: string,
  tags?: string[]
): Promise<AITemplate> {
  const supabase = createClient()

  // Fetch the itinerary with days and items
  const { getItineraryById } = await import('./itineraries')
  const itinerary = await getItineraryById(itineraryId)
  if (!itinerary) throw new Error('Itinerary not found')

  // Convert to template data format
  const templateData: AIGeneratedItinerary = {
    tripSummary: itinerary.notes || `${itinerary.title} template`,
    destinationCountry: itinerary.destination_country || '',
    destinationCity: itinerary.destination_city || '',
    travelType: itinerary.travel_type as AIGeneratedItinerary['travelType'],
    suggestedTitle: itinerary.title,
    baseCurrency: itinerary.base_currency,
    localCurrency: itinerary.local_currency || undefined,
    timezone: itinerary.timezone,
    days: (itinerary.days || []).map(day => ({
      dayNumber: day.day_number,
      title: day.title || `Day ${day.day_number}`,
      description: day.description || undefined,
      city: day.city || undefined,
      country: day.country || undefined,
      weatherNote: day.weather_note || undefined,
      items: (day.items || []).map(item => ({
        type: item.type as AIGeneratedItinerary['days'][0]['items'][0]['type'],
        title: item.title,
        description: item.description || undefined,
        timeSlot: getTimeSlot(item.start_time || item.time) as 'morning' | 'afternoon' | 'evening' | 'all_day',
        startTime: item.start_time || item.time || undefined,
        endTime: item.end_time || undefined,
        durationMinutes: item.duration_minutes || undefined,
        location: item.location || undefined,
        address: item.address || undefined,
        supplierName: item.supplier_name || undefined,
        isAiSuggested: false,
        isSupplierConfirmed: !!item.supplier_name,
        costEstimate: item.cost || undefined,
        costCurrency: item.currency || undefined,
        notes: item.notes || undefined,
        metadata: item.metadata as Record<string, unknown> || undefined,
      })),
    })),
    costEstimate: {
      hotels: 0, flights: 0, meals: 0, transport: 0,
      tours: 0, shopping: 0, visa: 0, insurance: 0,
      taxes: 0, miscellaneous: 0, total: itinerary.total_cost || 0,
      baseCurrency: itinerary.base_currency,
    },
  }

  const { data, error } = await supabase
    .from('ai_template_library')
    .insert([{
      name,
      description: description || null,
      destination_country: itinerary.destination_country,
      destination_city: itinerary.destination_city,
      travel_type: itinerary.travel_type,
      duration_days: itinerary.days?.length || 0,
      template_data: templateData,
      tags: tags || [],
      source_itinerary_id: itineraryId,
      created_by: itinerary.created_by,
    }])
    .select()
    .single()

  if (error) throw error
  return data as AITemplate
}

// ── Get Templates ────────────────────────────────────────────────────────────

export async function getAITemplates(
  destination?: string,
  travelType?: string
): Promise<AITemplate[]> {
  const supabase = createClient()
  let query = supabase
    .from('ai_template_library')
    .select('*')
    .order('usage_count', { ascending: false })

  if (destination) {
    query = query.or(
      `destination_country.ilike.%${destination}%,destination_city.ilike.%${destination}%`
    )
  }
  if (travelType) {
    query = query.eq('travel_type', travelType)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as AITemplate[]
}

// ── Delete Template ──────────────────────────────────────────────────────────

export async function deleteAITemplate(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('ai_template_library')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Increment Usage Count ────────────────────────────────────────────────────

export async function incrementTemplateUsage(id: string): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase
    .from('ai_template_library')
    .select('usage_count')
    .eq('id', id)
    .single()

  if (data) {
    await supabase
      .from('ai_template_library')
      .update({ usage_count: (data.usage_count || 0) + 1 })
      .eq('id', id)
  }
}

// ── Helper ───────────────────────────────────────────────────────────────────

function getTimeSlot(time?: string | null): string {
  if (!time) return 'morning'
  const hour = parseInt(time.split(':')[0])
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
