// ============================================================================
// AI IMPORT SERVICE — Phase X
// "Accept AI Plan" → writes directly to existing itinerary tables
// No temporary data — direct insert into production tables
// ============================================================================

import { createClient } from '@/lib/supabase/client'
import type { AIGeneratedItinerary, AIGeneratedDay, AIGeneratedItem } from '@/types/ai-itinerary'
import type { Itinerary, ItineraryItem } from '@/types/itinerary'

// ── Accept AI Plan ───────────────────────────────────────────────────────────

export async function acceptAIPlan(
  generatedItinerary: AIGeneratedItinerary,
  formData: {
    title?: string
    bookingId?: string
    baseCurrency?: string
    localCurrency?: string
    timezone?: string
    notes?: string
  },
  userId: string,
  generationId?: string
): Promise<string> {
  const supabase = createClient()

  // 1. Create the itinerary via existing table
  const { createItinerary } = await import('./itineraries')
  const itinerary = await createItinerary({
    title: formData.title || generatedItinerary.suggestedTitle,
    booking_id: formData.bookingId || null,
    status: 'draft',
    destination_country: generatedItinerary.destinationCountry,
    destination_city: generatedItinerary.destinationCity,
    base_currency: formData.baseCurrency || generatedItinerary.baseCurrency || 'USD',
    local_currency: formData.localCurrency || generatedItinerary.localCurrency || null,
    timezone: formData.timezone || generatedItinerary.timezone || 'UTC',
    travel_type: generatedItinerary.travelType || 'leisure',
    notes: buildItineraryNotes(generatedItinerary, formData.notes),
    total_cost: generatedItinerary.costEstimate?.total || 0,
    created_by: userId,
    assigned_to: userId,
    emergency_police: generatedItinerary.emergencyContacts?.police || null,
    emergency_ambulance: generatedItinerary.emergencyContacts?.ambulance || null,
    emergency_embassy: generatedItinerary.emergencyContacts?.embassy || null,
    emergency_embassy_phone: generatedItinerary.emergencyContacts?.embassyPhone || null,
  } as Partial<Itinerary>)

  // 2. Create days and items
  const { addDay } = await import('./itineraries')
  const { addItem } = await import('./itineraries')

  for (const genDay of generatedItinerary.days) {
    const day = await addDay(
      itinerary.id,
      genDay.dayNumber,
      genDay.date,
      genDay.title
    )

    // Update day with extra fields
    if (genDay.description || genDay.city || genDay.country || genDay.weatherNote) {
      const { updateDay } = await import('./itineraries')
      await updateDay(day.id, {
        description: genDay.description || null,
        city: genDay.city || null,
        country: genDay.country || null,
        weather_note: genDay.weatherNote || null,
      })
    }

    // 3. Create items for this day
    for (let i = 0; i < genDay.items.length; i++) {
      const genItem = genDay.items[i]
      await addItem(mapAIItemToItineraryItem(genItem, day.id, i, formData.baseCurrency || 'USD'))
    }
  }

  // 4. Update AI generation record if we have one
  if (generationId) {
    try {
      await supabase
        .from('ai_itinerary_generations')
        .update({
          status: 'accepted',
          itinerary_id: itinerary.id,
        })
        .eq('id', generationId)
    } catch {
      // Non-critical — don't fail the import if tracking table doesn't exist yet
      console.warn('Could not update AI generation record')
    }
  }

  return itinerary.id
}

// ── Map AI Item to Itinerary Item ────────────────────────────────────────────

function mapAIItemToItineraryItem(
  genItem: AIGeneratedItem,
  dayId: string,
  sortOrder: number,
  baseCurrency: string
): Partial<ItineraryItem> {
  // Build supplier name with "Suggested:" prefix for unconfirmed
  const supplierName = genItem.supplierName
    ? (genItem.isSupplierConfirmed
        ? genItem.supplierName
        : `Suggested: ${genItem.supplierName}`)
    : null

  // Build metadata based on type
  const metadata: Record<string, unknown> = {
    is_ai_suggested: true,
    is_supplier_confirmed: genItem.isSupplierConfirmed || false,
    ai_time_slot: genItem.timeSlot,
    ...(genItem.metadata || {}),
  }

  // Add type-specific metadata
  if (genItem.type === 'hotel' && genItem.supplierName) {
    metadata.hotel_name = genItem.supplierName
    metadata.star_rating = 0
    metadata.room_type = ''
    metadata.breakfast_included = false
    metadata.wifi_included = true
    metadata.address = genItem.address || ''
  } else if (genItem.type === 'flight') {
    metadata.airline = ''
    metadata.flight_number = ''
    metadata.departure_code = ''
    metadata.arrival_code = ''
    metadata.departure_airport = genItem.location || ''
    metadata.arrival_airport = ''
    metadata.cabin_class = ''
  } else if (genItem.type === 'transfer') {
    metadata.vehicle_type = ''
    metadata.pickup_location = genItem.location || ''
    metadata.dropoff_location = ''
  }

  return {
    day_id: dayId,
    type: genItem.type,
    title: genItem.title,
    description: genItem.description || null,
    sort_order: sortOrder,
    time: genItem.startTime || null,
    start_time: genItem.startTime || null,
    end_time: genItem.endTime || null,
    duration_minutes: genItem.durationMinutes || null,
    location: genItem.location || null,
    address: genItem.address || null,
    supplier_name: supplierName,
    cost: genItem.costEstimate || 0,
    currency: genItem.costCurrency || baseCurrency,
    status: 'pending',
    notes: genItem.notes || null,
    metadata,
  }
}

// ── Build Notes ──────────────────────────────────────────────────────────────

function buildItineraryNotes(
  itinerary: AIGeneratedItinerary,
  existingNotes?: string
): string {
  const parts: string[] = []

  if (existingNotes) parts.push(existingNotes)
  
  parts.push('--- AI GENERATED ITINERARY NOTES ---')
  
  if (itinerary.tripSummary) {
    parts.push(`\nTrip Summary:\n${itinerary.tripSummary}`)
  }
  if (itinerary.visaNotes) {
    parts.push(`\nVisa Notes:\n${itinerary.visaNotes}`)
  }
  if (itinerary.packingTips?.length) {
    parts.push(`\nPacking Tips:\n${itinerary.packingTips.map(t => `• ${t}`).join('\n')}`)
  }
  if (itinerary.weatherSuggestions) {
    parts.push(`\nWeather:\n${itinerary.weatherSuggestions}`)
  }
  if (itinerary.localCustoms?.length) {
    parts.push(`\nLocal Customs:\n${itinerary.localCustoms.map(c => `• ${c}`).join('\n')}`)
  }
  if (itinerary.shoppingAreas?.length) {
    parts.push(`\nShopping Areas:\n${itinerary.shoppingAreas.map(a => `• ${a}`).join('\n')}`)
  }
  if (itinerary.freeTimeRecommendations?.length) {
    parts.push(`\nFree Time Suggestions:\n${itinerary.freeTimeRecommendations.map(r => `• ${r}`).join('\n')}`)
  }
  if (itinerary.emergencyNotes) {
    parts.push(`\nEmergency Info:\n${itinerary.emergencyNotes}`)
  }

  parts.push('\n⚠️ Cost estimates are AI-generated approximations. Replace with real supplier quotes before booking.')
  parts.push('⚠️ Suppliers marked "Suggested:" are AI recommendations. Confirm with actual suppliers before booking.')

  return parts.join('\n')
}

// ── Update Itinerary with Regenerated Day ────────────────────────────────────

export async function applyRegeneratedDay(
  itineraryId: string,
  dayId: string,
  newDay: AIGeneratedDay,
  baseCurrency: string
): Promise<void> {
  const supabase = createClient()

  // Update the day metadata
  const { updateDay } = await import('./itineraries')
  await updateDay(dayId, {
    title: newDay.title,
    description: newDay.description || null,
    city: newDay.city || null,
    country: newDay.country || null,
    weather_note: newDay.weatherNote || null,
  })

  // Delete existing items for this day
  const { error: deleteError } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('day_id', dayId)

  if (deleteError) throw deleteError

  // Insert new items
  const { addItem } = await import('./itineraries')
  for (let i = 0; i < newDay.items.length; i++) {
    await addItem(mapAIItemToItineraryItem(newDay.items[i], dayId, i, baseCurrency))
  }
}
