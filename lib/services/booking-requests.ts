import { createClient } from '@/lib/supabase/client'
import { logConverted } from './lead-activities'
import type { LeadWithAgent } from '@/types/leads'

// ============================================================================
// BOOKING REQUESTS — Sales hands a converted lead to Operations
// Sales never creates bookings; Operations gets a notification that opens
// the New Booking form pre-filled from the lead.
// ============================================================================

export type BookingRequestResult =
  | { status: 'sent'; recipients: number }
  | { status: 'already_sent' }
  | { status: 'no_operations_staff' }

export async function requestBookingFromLead(
  lead: LeadWithAgent,
  requester: { id?: string; full_name?: string } | null
): Promise<BookingRequestResult> {
  const supabase = createClient()

  // Operations staff: the operations role, anyone in the Operations department,
  // or an Operations Manager/Officer by position (e.g. admins who run Operations)
  const { data: staff, error: staffError } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_active', true)
    .or('role.eq.operations,department.ilike.operations,position.ilike.%operations%')

  if (staffError) throw staffError

  const recipients = (staff ?? []).map((p) => p.id).filter((id) => id !== requester?.id)
  if (recipients.length === 0) return { status: 'no_operations_staff' }

  const dates = [lead.travel_date, lead.return_date]
    .filter(Boolean)
    .map((d) => new Date(d as string).toLocaleDateString())
    .join(' – ')
  const details = [lead.destination, dates].filter(Boolean).join(', ')
  const requesterName = requester?.full_name || 'Sales'

  // One request per lead per person: the (recipient_id, type, related_to_id) unique
  // constraint drops repeats, so only newly created rows come back
  const { data: inserted, error } = await supabase
    .from('notifications')
    .upsert(
      recipients.map((recipientId) => ({
        title: `Booking Request: ${lead.lead_name}`,
        message: `${requesterName} converted this lead to a booking${details ? ` — ${details}` : ''}. Click to create the booking.`,
        type: 'booking_request',
        recipient_id: recipientId,
        related_to_id: lead.id,
        related_to_type: 'booking_request',
        is_read: false,
      })),
      { onConflict: 'recipient_id,type,related_to_id', ignoreDuplicates: true }
    )
    .select('id')

  if (error) throw error
  if (!inserted || inserted.length === 0) return { status: 'already_sent' }

  await logConverted(lead.id, lead.lead_name, 'booking', requester?.id).catch(() => {})
  return { status: 'sent', recipients: inserted.length }
}

export function bookingRequestMessage(result: BookingRequestResult, leadName: string): string {
  switch (result.status) {
    case 'sent':
      return `Booking request for "${leadName}" sent to the Operations team.`
    case 'already_sent':
      return `A booking request for "${leadName}" was already sent to Operations.`
    case 'no_operations_staff':
      return 'No active Operations staff were found to send the booking request to.'
  }
}
