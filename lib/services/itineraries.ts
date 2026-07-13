import { createClient } from '@/lib/supabase/client'
import type {
  Itinerary,
  ItineraryWithBooking,
  ItineraryDay,
  ItineraryItem,
  ItineraryComment,
  ItineraryVersion,
  ItineraryKPIs,
  ItineraryFilters,
  ItineraryStatus,
} from '@/types/itinerary'

// ============================================================================
// ITINERARIES — CRUD
// ============================================================================

export async function getItineraries(filters?: Partial<ItineraryFilters>) {
  const supabase = createClient()
  let query = supabase
    .from('itineraries')
    .select(`
      *,
      booking:bookings(
        id, booking_reference, customer_name, destination,
        trip_start_date, trip_end_date, status, total_cost,
        currency, num_travelers, assigned_to_name
      )
    `)
    .eq('is_template', false)
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.travelType && filters.travelType !== 'all') {
    query = query.eq('travel_type', filters.travelType)
  }
  if (filters?.country) {
    query = query.ilike('destination_country', `%${filters.country}%`)
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,destination_city.ilike.%${filters.search}%,destination_country.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as ItineraryWithBooking[]
}

export async function getItineraryById(id: string): Promise<ItineraryWithBooking | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itineraries')
    .select(`
      *,
      booking:bookings(
        id, booking_reference, customer_name, destination,
        trip_start_date, trip_end_date, status, total_cost,
        currency, num_travelers, assigned_to_name
      )
    `)
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (!data) return null

  // Fetch days with items
  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('itinerary_id', id)
    .order('sort_order', { ascending: true })

  if (daysError) throw daysError

  // Fetch items for all days
  const dayIds = (days || []).map((d: ItineraryDay) => d.id)
  let items: ItineraryItem[] = []
  if (dayIds.length > 0) {
    const { data: itemsData, error: itemsError } = await supabase
      .from('itinerary_items')
      .select('*')
      .in('day_id', dayIds)
      .order('sort_order', { ascending: true })

    if (itemsError) throw itemsError
    items = (itemsData || []) as ItineraryItem[]
  }

  // Attach items to their days
  const daysWithItems = (days || []).map((day: ItineraryDay) => ({
    ...day,
    items: items.filter((item) => item.day_id === day.id),
  }))

  // Fetch travelers if booking exists
  let travelers: ItineraryWithBooking['travelers'] = []
  if (data.booking_id) {
    const { data: travelersData } = await supabase
      .from('booking_travelers')
      .select('id, first_name, last_name, nationality, passport_number, passport_expiry')
      .eq('booking_id', data.booking_id)
    travelers = travelersData || []
  }

  return {
    ...data,
    days: daysWithItems,
    travelers,
  } as ItineraryWithBooking
}

export async function createItinerary(
  itinerary: Partial<Itinerary>
): Promise<Itinerary> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itineraries')
    .insert([{
      title: itinerary.title || 'New Itinerary',
      booking_id: itinerary.booking_id || null,
      status: itinerary.status || 'draft',
      destination_country: itinerary.destination_country,
      destination_city: itinerary.destination_city,
      base_currency: itinerary.base_currency || 'USD',
      local_currency: itinerary.local_currency,
      timezone: itinerary.timezone || 'UTC',
      travel_type: itinerary.travel_type || 'leisure',
      created_by: itinerary.created_by,
      assigned_to: itinerary.assigned_to,
      assigned_to_name: itinerary.assigned_to_name,
      notes: itinerary.notes,
      share_token: crypto.randomUUID().slice(0, 8),
    }])
    .select()
    .single()

  if (error) throw error
  return data as Itinerary
}

export async function updateItinerary(
  id: string,
  updates: Partial<Itinerary>
): Promise<Itinerary> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itineraries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Itinerary
}

export async function deleteItinerary(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('itineraries').delete().eq('id', id)
  if (error) throw error
}

// ============================================================================
// ITINERARY DAYS — CRUD
// ============================================================================

export async function addDay(itineraryId: string, dayNumber: number, date?: string, title?: string): Promise<ItineraryDay> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_days')
    .insert([{
      itinerary_id: itineraryId,
      day_number: dayNumber,
      date: date || null,
      title: title || `Day ${dayNumber}`,
      sort_order: dayNumber,
    }])
    .select()
    .single()

  if (error) throw error
  return data as ItineraryDay
}

export async function updateDay(id: string, updates: Partial<ItineraryDay>): Promise<ItineraryDay> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_days')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ItineraryDay
}

export async function deleteDay(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('itinerary_days').delete().eq('id', id)
  if (error) throw error
}

// ============================================================================
// ITINERARY ITEMS — CRUD + Reorder
// ============================================================================

export async function addItem(item: Partial<ItineraryItem>): Promise<ItineraryItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert([{
      day_id: item.day_id,
      type: item.type || 'custom',
      time: item.time,
      title: item.title || 'New Activity',
      description: item.description,
      sort_order: item.sort_order || 0,
      location: item.location,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      supplier_name: item.supplier_name,
      supplier_contact: item.supplier_contact,
      booking_reference: item.booking_reference,
      voucher_number: item.voucher_number,
      cost: item.cost || 0,
      currency: item.currency || 'USD',
      status: item.status || 'pending',
      start_time: item.start_time,
      end_time: item.end_time,
      duration_minutes: item.duration_minutes,
      timezone: item.timezone,
      metadata: item.metadata || {},
      notes: item.notes,
      contact_phone: item.contact_phone,
      contact_email: item.contact_email,
    }])
    .select()
    .single()

  if (error) throw error
  return data as ItineraryItem
}

export async function updateItem(id: string, updates: Partial<ItineraryItem>): Promise<ItineraryItem> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ItineraryItem
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('itinerary_items').delete().eq('id', id)
  if (error) throw error
}

export async function reorderItems(dayId: string, itemIds: string[]): Promise<void> {
  const supabase = createClient()
  // Update sort_order for each item
  const updates = itemIds.map((id, index) =>
    supabase
      .from('itinerary_items')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('day_id', dayId)
  )
  await Promise.all(updates)
}

export async function moveItemToDay(itemId: string, newDayId: string, newSortOrder: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('itinerary_items')
    .update({ day_id: newDayId, sort_order: newSortOrder, updated_at: new Date().toISOString() })
    .eq('id', itemId)
  if (error) throw error
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getComments(itineraryId: string): Promise<ItineraryComment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_comments')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as ItineraryComment[]
}

export async function addComment(comment: Partial<ItineraryComment>): Promise<ItineraryComment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_comments')
    .insert([comment])
    .select()
    .single()

  if (error) throw error
  return data as ItineraryComment
}

// ============================================================================
// VERSIONS
// ============================================================================

export async function saveVersion(itineraryId: string, snapshot: unknown, createdBy: string, summary?: string): Promise<ItineraryVersion> {
  const supabase = createClient()

  // Get current version number
  const { data: existing } = await supabase
    .from('itinerary_versions')
    .select('version_number')
    .eq('itinerary_id', itineraryId)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = existing && existing.length > 0 ? existing[0].version_number + 1 : 1

  const { data, error } = await supabase
    .from('itinerary_versions')
    .insert([{
      itinerary_id: itineraryId,
      version_number: nextVersion,
      snapshot,
      change_summary: summary,
      created_by: createdBy,
    }])
    .select()
    .single()

  if (error) throw error

  // Update itinerary version number
  await supabase.from('itineraries').update({ version: nextVersion }).eq('id', itineraryId)

  return data as ItineraryVersion
}

export async function getVersions(itineraryId: string): Promise<ItineraryVersion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itinerary_versions')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('version_number', { ascending: false })

  if (error) throw error
  return (data || []) as ItineraryVersion[]
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function getTemplates() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('itineraries')
    .select('*')
    .eq('is_template', true)
    .order('template_name', { ascending: true })

  if (error) throw error
  return (data || []) as Itinerary[]
}

export async function saveAsTemplate(itineraryId: string, templateName: string): Promise<void> {
  const supabase = createClient()

  // Get full itinerary
  const itinerary = await getItineraryById(itineraryId)
  if (!itinerary) throw new Error('Itinerary not found')

  // Create template (clone without traveler-specific data)
  const { data: template, error: templateError } = await supabase
    .from('itineraries')
    .insert([{
      title: itinerary.title,
      is_template: true,
      template_name: templateName,
      destination_country: itinerary.destination_country,
      destination_city: itinerary.destination_city,
      timezone: itinerary.timezone,
      travel_type: itinerary.travel_type,
      base_currency: itinerary.base_currency,
      local_currency: itinerary.local_currency,
      notes: itinerary.notes,
      status: 'draft',
    }])
    .select()
    .single()

  if (templateError) throw templateError

  // Clone days
  if (itinerary.days) {
    for (const day of itinerary.days) {
      const { data: newDay, error: dayError } = await supabase
        .from('itinerary_days')
        .insert([{
          itinerary_id: template.id,
          day_number: day.day_number,
          title: day.title,
          sort_order: day.sort_order,
          description: day.description,
          city: day.city,
          country: day.country,
        }])
        .select()
        .single()

      if (dayError) throw dayError

      // Clone items (strip booking-specific data)
      if (day.items) {
        for (const item of day.items) {
          await supabase.from('itinerary_items').insert([{
            day_id: newDay.id,
            type: item.type,
            time: item.time,
            title: item.title,
            description: item.description,
            sort_order: item.sort_order,
            location: item.location,
            duration_minutes: item.duration_minutes,
            metadata: item.metadata,
            // Strip: booking_reference, voucher_number, traveler_ids, cost
          }])
        }
      }
    }
  }
}

export async function createFromTemplate(templateId: string, bookingId: string, startDate: string): Promise<Itinerary> {
  const template = await getItineraryById(templateId)
  if (!template) throw new Error('Template not found')

  // Create new itinerary
  const newItinerary = await createItinerary({
    title: template.title,
    booking_id: bookingId,
    destination_country: template.destination_country,
    destination_city: template.destination_city,
    timezone: template.timezone,
    travel_type: template.travel_type,
    base_currency: template.base_currency,
    local_currency: template.local_currency,
    notes: template.notes,
  })

  const supabase = createClient()
  const start = new Date(startDate)

  // Clone days with adjusted dates
  if (template.days) {
    for (const day of template.days) {
      const dayDate = new Date(start)
      dayDate.setDate(dayDate.getDate() + day.day_number - 1)

      const { data: newDay } = await supabase
        .from('itinerary_days')
        .insert([{
          itinerary_id: newItinerary.id,
          day_number: day.day_number,
          date: dayDate.toISOString().split('T')[0],
          title: day.title,
          sort_order: day.sort_order,
          description: day.description,
          city: day.city,
          country: day.country,
        }])
        .select()
        .single()

      if (newDay && day.items) {
        for (const item of day.items) {
          await supabase.from('itinerary_items').insert([{
            day_id: newDay.id,
            type: item.type,
            time: item.time,
            title: item.title,
            description: item.description,
            sort_order: item.sort_order,
            location: item.location,
            duration_minutes: item.duration_minutes,
            metadata: item.metadata,
            status: 'pending',
          }])
        }
      }
    }
  }

  return newItinerary
}

// ============================================================================
// DASHBOARD KPIs
// ============================================================================

export async function getKPIs(): Promise<ItineraryKPIs> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // All itineraries (non-template)
  const { data: all } = await supabase
    .from('itineraries')
    .select('id, status, booking_id')
    .eq('is_template', false)

  const itineraries = all || []
  const active = itineraries.filter(i => !['completed', 'cancelled'].includes(i.status))
  const pending = itineraries.filter(i => ['review', 'customer_review'].includes(i.status))
  const completed = itineraries.filter(i => i.status === 'completed')

  // Get bookings for date-based KPIs
  const bookingIds = itineraries
    .filter(i => i.booking_id)
    .map(i => i.booking_id!)

  let todayDep = 0
  let todayArr = 0
  let upcoming = 0
  let travelers = 0
  const countries = new Set<string>()

  if (bookingIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, trip_start_date, trip_end_date, destination, num_travelers')
      .in('id', bookingIds)

    if (bookings) {
      for (const b of bookings) {
        if (b.trip_start_date === today) todayDep++
        if (b.trip_end_date === today) todayArr++
        if (b.trip_start_date > today) upcoming++
        travelers += b.num_travelers || 0
        if (b.destination) countries.add(b.destination)
      }
    }
  }

  return {
    totalActive: active.length,
    upcomingTrips: upcoming,
    totalTravelers: travelers,
    totalCountries: countries.size,
    todayDepartures: todayDep,
    todayArrivals: todayArr,
    pendingApproval: pending.length,
    completedTrips: completed.length,
  }
}

// ============================================================================
// BOOKINGS LIST — for linking
// ============================================================================

export async function getAvailableBookings() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('id, booking_reference, customer_name, destination, trip_start_date, trip_end_date, num_travelers, currency')
    .in('status', ['confirmed', 'processing', 'pending'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ============================================================================
// MONTHLY CHART DATA
// ============================================================================

export async function getMonthlyData() {
  const supabase = createClient()
  const { data } = await supabase
    .from('itineraries')
    .select('created_at, status')
    .eq('is_template', false)
    .order('created_at', { ascending: true })

  if (!data) return []

  const months: Record<string, { month: string; count: number; completed: number }> = {}
  for (const it of data) {
    const d = new Date(it.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    if (!months[key]) months[key] = { month: label, count: 0, completed: 0 }
    months[key].count++
    if (it.status === 'completed') months[key].completed++
  }

  return Object.values(months).slice(-12)
}
