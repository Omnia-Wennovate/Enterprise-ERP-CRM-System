'use server'

import { createClient } from '@/lib/supabase/server'
import type { Booking, BookingTraveler, BookingChecklist, BookingTimelineEvent, BookingNote } from '@/types'

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch bookings: ${error.message}`)
  return data || []
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch booking: ${error.message}`)
  return data || null
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
  const supabase = await createClient()
  
  // Start transaction by creating booking
  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert([booking])
    .select()
    .single()

  if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`)
  if (!newBooking) throw new Error('No booking returned after creation')

  // Create auto-generated checklist items
  const checklistItems = [
    { item_name: 'Confirm customer details', category: 'Pre-Booking', is_completed: false },
    { item_name: 'Collect passport copies', category: 'Documentation', is_completed: false },
    { item_name: 'Process payment', category: 'Financial', is_completed: false },
    { item_name: 'Issue booking confirmation', category: 'Communications', is_completed: false },
    { item_name: 'Arrange airport transfers', category: 'Logistics', is_completed: false },
    { item_name: 'Send itinerary to customer', category: 'Communications', is_completed: false },
    { item_name: 'Confirm hotel reservations', category: 'Accommodations', is_completed: false },
    { item_name: 'Arrange travel insurance', category: 'Insurance', is_completed: false },
    { item_name: 'Prepare travel documents', category: 'Documentation', is_completed: false },
    { item_name: 'Conduct pre-trip briefing', category: 'Briefing', is_completed: false },
    { item_name: 'Final payment confirmation', category: 'Financial', is_completed: false },
    { item_name: 'Send welcome package', category: 'Communications', is_completed: false },
  ]

  const { error: checklistError } = await supabase
    .from('booking_checklists')
    .insert(
      checklistItems.map(item => ({
        ...item,
        booking_id: newBooking.id,
      }))
    )

  if (checklistError) {
    // Rollback: delete the booking if checklist creation fails
    await supabase.from('bookings').delete().eq('id', newBooking.id)
    throw new Error(`Failed to create checklist items: ${checklistError.message}`)
  }

  // Create timeline event
  const { error: timelineError } = await supabase
    .from('booking_timeline_events')
    .insert([
      {
        booking_id: newBooking.id,
        event_type: 'created',
        description: 'Booking created in system',
        created_by: booking.created_by,
      },
    ])

  if (timelineError) {
    // Rollback: delete booking and checklist if timeline creation fails
    await supabase.from('booking_checklists').delete().eq('booking_id', newBooking.id)
    await supabase.from('bookings').delete().eq('id', newBooking.id)
    throw new Error(`Failed to create timeline event: ${timelineError.message}`)
  }

  return newBooking
}

export async function updateBooking(
  id: string,
  updates: Partial<Booking>
): Promise<Booking> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update booking: ${error.message}`)
  return data
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Failed to delete booking: ${error.message}`)
}

export async function getTravelers(bookingId: string): Promise<BookingTraveler[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_travelers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch travelers: ${error.message}`)
  return data || []
}

export async function addTraveler(traveler: Omit<BookingTraveler, 'id' | 'created_at'>): Promise<BookingTraveler> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_travelers')
    .insert([traveler])
    .select()
    .single()

  if (error) throw new Error(`Failed to add traveler: ${error.message}`)
  return data
}

export async function getChecklist(bookingId: string): Promise<BookingChecklist[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_checklists')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch checklist: ${error.message}`)
  return data || []
}

export async function updateChecklistItem(
  id: string,
  updates: Partial<BookingChecklist>
): Promise<BookingChecklist> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_checklists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update checklist item: ${error.message}`)
  
  // Get the checklist item to know the booking_id for timeline event
  if (data) {
    // Create timeline event for the checklist update
    const eventDescription = updates.is_completed
      ? `Completed checklist item: ${updates.item_name || 'Unknown'}`
      : `Updated checklist item: ${updates.item_name || 'Unknown'}`

    await supabase.from('booking_timeline_events').insert([
      {
        booking_id: data.booking_id,
        event_type: 'checklist_updated',
        description: eventDescription,
      },
    ])
  }

  return data
}

export async function getTimeline(bookingId: string): Promise<BookingTimelineEvent[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_timeline_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('event_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch timeline: ${error.message}`)
  return data || []
}

export async function getBookingNotes(bookingId: string): Promise<BookingNote[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_notes')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch notes: ${error.message}`)
  return data || []
}

export async function addNote(note: Omit<BookingNote, 'id' | 'created_at' | 'updated_at'>): Promise<BookingNote> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('booking_notes')
    .insert([note])
    .select()
    .single()

  if (error) throw new Error(`Failed to add note: ${error.message}`)
  return data
}
