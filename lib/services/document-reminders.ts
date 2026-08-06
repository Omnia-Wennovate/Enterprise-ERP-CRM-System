'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateBookingReadiness } from './document-approval'
import type { DocumentReminder } from '@/types/documents'

// Create or update reminders based on booking departure date and missing documents
export async function scheduleDocumentReminders(bookingId: string): Promise<void> {
  const supabase = await createClient()

  // 1. Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('trip_start_date, customer_name')
    .eq('id', bookingId)
    .single()

  if (!booking || !booking.trip_start_date) return

  // 2. Check what's missing
  const readiness = await calculateBookingReadiness(bookingId)
  
  if (readiness.isReadyForTravel) {
    // If ready, clear pending reminders
    await supabase.from('document_reminders').delete().eq('booking_id', bookingId).is('fired_at', null)
    return
  }

  const travelDate = new Date(booking.trip_start_date)
  const today = new Date()
  today.setHours(0,0,0,0)

  const daysUntilTravel = Math.ceil((travelDate.getTime() - today.getTime()) / 86400000)

  // Standard reminder intervals
  const intervals = [60, 30, 14, 7]

  // For each missing document, create future reminders
  for (const missing of readiness.missingDocuments) {
    for (const daysBefore of intervals) {
      // Only schedule if the reminder date is in the future (or today)
      if (daysUntilTravel >= daysBefore) {
        const fireDate = new Date(travelDate)
        fireDate.setDate(fireDate.getDate() - daysBefore)
        
        // Upsert reminder
        await supabase
          .from('document_reminders')
          .upsert({
             booking_id: bookingId,
             document_type: missing.documentType,
             days_before: daysBefore,
             due_fire_at: fireDate.toISOString().split('T')[0],
             escalated: daysBefore <= 7, // Escalate if 7 days or less
          }, { onConflict: 'booking_id, document_type, days_before' })
      }
    }
  }
}

export async function getPendingReminders(bookingId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('document_reminders')
    .select(`
      *,
      bookings!document_reminders_booking_id_fkey(booking_reference, trip_start_date, customer_name)
    `)
    .is('fired_at', null)
    .order('due_fire_at', { ascending: true })

  if (bookingId) query = query.eq('booking_id', bookingId)

  const { data, error } = await query
  if (error) throw error
  return data
}
