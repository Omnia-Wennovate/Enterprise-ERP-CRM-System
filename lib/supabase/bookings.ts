import { createClient } from './client'
import { createServerClient } from './server'
import type { Booking, BookingTraveler, BookingChecklist, BookingTimelineEvent, BookingNote } from '@/types'

// Client-side operations
export async function getBookings(limit: number = 50) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Booking[]
}

export async function getBookingById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single()

  if (error) throw error
  return data as Booking
}

export async function getBookingsByStatus(status: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('bookings').insert([booking]).select().single()

  if (error) throw error
  return data as Booking
}

export async function updateBooking(id: string, updates: Partial<Booking>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Booking
}

export async function deleteBooking(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('bookings').delete().eq('id', id)

  if (error) throw error
}

// Travelers
export async function getTravelers(bookingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_travelers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as BookingTraveler[]
}

export async function addTraveler(traveler: Omit<BookingTraveler, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('booking_travelers').insert([traveler]).select().single()

  if (error) throw error
  return data as BookingTraveler
}

export async function updateTraveler(id: string, updates: Partial<BookingTraveler>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_travelers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as BookingTraveler
}

// Checklists
export async function getChecklist(bookingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_checklists')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as BookingChecklist[]
}

export async function addChecklistItem(item: Omit<BookingChecklist, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_checklists')
    .insert([item])
    .select()
    .single()

  if (error) throw error
  return data as BookingChecklist
}

export async function updateChecklistItem(id: string, updates: Partial<BookingChecklist>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_checklists')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as BookingChecklist
}

// Timeline
export async function getTimeline(bookingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_timeline_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('event_date', { ascending: false })

  if (error) throw error
  return data as BookingTimelineEvent[]
}

export async function addTimelineEvent(event: Omit<BookingTimelineEvent, 'id' | 'created_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_timeline_events')
    .insert([event])
    .select()
    .single()

  if (error) throw error
  return data as BookingTimelineEvent
}

// Notes
export async function getBookingNotes(bookingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_notes')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as BookingNote[]
}

export async function addBookingNote(note: Omit<BookingNote, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('booking_notes').insert([note]).select().single()

  if (error) throw error
  return data as BookingNote
}

export async function updateBookingNote(id: string, updates: Partial<BookingNote>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('booking_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as BookingNote
}
