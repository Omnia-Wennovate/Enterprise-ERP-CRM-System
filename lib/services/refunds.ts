'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  CancellationRequest,
  Refund,
  RefundDetail,
  CreateCancellationFormData,
  ProcessRefundFormData,
  CancellationRequestStatus,
  RefundStatus,
} from '@/types/finance'
import { calculateTotalPaid } from './payments'

// Create cancellation request
export async function createCancellationRequest(
  formData: CreateCancellationFormData
): Promise<CancellationRequest> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { data, error } = await supabase
    .from('cancellation_requests')
    .insert([
      {
        booking_id: formData.booking_id,
        requested_by: user?.id,
        reason: formData.reason,
        status: 'requested',
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to create cancellation request: ${error.message}`)

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: formData.booking_id,
      event_type: 'cancellation_requested',
      description: `Cancellation requested: ${formData.reason}`,
      created_by: user?.id,
    },
  ])

  return data
}

// Get cancellation requests
export async function getCancellationRequests(): Promise<CancellationRequest[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cancellation_requests')
    .select('*')
    .order('requested_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch cancellation requests: ${error.message}`)
  return data || []
}

// Get cancellation request by ID
export async function getCancellationRequestById(id: string): Promise<CancellationRequest | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cancellation_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch cancellation request: ${error.message}`)
  }

  return data || null
}

// Approve cancellation request
export async function approveCancellationRequest(cancellationId: string): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  // Update cancellation status
  const { data: cancellation, error: updateError } = await supabase
    .from('cancellation_requests')
    .update({
      status: 'approved',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', cancellationId)
    .select()
    .single()

  if (updateError) throw new Error(`Failed to approve cancellation: ${updateError.message}`)

  // Update booking status to cancelled
  await supabase
    .from('bookings')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', cancellation.booking_id)

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: cancellation.booking_id,
      event_type: 'cancellation_approved',
      description: 'Cancellation request approved',
      created_by: user?.id,
    },
  ])
}

// Reject cancellation request
export async function rejectCancellationRequest(cancellationId: string): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { error } = await supabase
    .from('cancellation_requests')
    .update({
      status: 'rejected',
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', cancellationId)

  if (error) throw new Error(`Failed to reject cancellation: ${error.message}`)
}

// Create refund from cancellation
export async function createRefund(formData: ProcessRefundFormData): Promise<Refund> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  // Verify cancellation exists and is approved
  const { data: cancellation, error: cancellationError } = await supabase
    .from('cancellation_requests')
    .select('*')
    .eq('id', formData.cancellation_id)
    .eq('status', 'approved')
    .single()

  if (cancellationError) throw new Error(`Cancellation not found or not approved`)

  // Create refund
  const { data, error } = await supabase
    .from('refunds')
    .insert([
      {
        cancellation_id: formData.cancellation_id,
        invoice_id: formData.invoice_id,
        refund_amount: formData.refund_amount,
        supplier_penalty: formData.supplier_penalty || 0,
        status: 'pending',
        notes: formData.notes || null,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to create refund: ${error.message}`)

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: cancellation.booking_id,
      event_type: 'refund_initiated',
      description: `Refund initiated: ${data.net_refund}`,
      created_by: user?.id,
    },
  ])

  return data
}

// Get refunds
export async function getRefunds(): Promise<Refund[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('refunds')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch refunds: ${error.message}`)
  return data || []
}

// Get refund by ID with details
export async function getRefundDetail(refundId: string): Promise<RefundDetail | null> {
  const supabase = await createClient()

  const { data: refund, error: refundError } = await supabase
    .from('refunds')
    .select('*')
    .eq('id', refundId)
    .single()

  if (refundError && refundError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch refund: ${refundError.message}`)
  }

  if (!refund) return null

  // Get related invoice and cancellation info
  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number, total_amount, booking_id')
    .eq('id', refund.invoice_id)
    .single()

  const { data: cancellation } = await supabase
    .from('cancellation_requests')
    .select('booking_id, reason')
    .eq('id', refund.cancellation_id)
    .single()

  // Get booking info
  const { data: booking } = await supabase
    .from('bookings')
    .select('booking_reference')
    .eq('id', invoice?.booking_id)
    .single()

  // Get customer info
  const { data: customer } = await supabase
    .from('customers')
    .select('company_name')
    .eq('id', (await supabase.from('bookings').select('customer_id').eq('id', invoice?.booking_id).single()).data?.customer_id)
    .single()

  // Calculate payments received
  const paymentsReceived = await calculateTotalPaid(refund.invoice_id)

  return {
    ...refund,
    booking_reference: booking?.booking_reference,
    invoice_number: invoice?.invoice_number,
    original_invoice_total: invoice?.total_amount,
    payments_received: paymentsReceived,
    customer_name: customer?.company_name,
    cancellation_reason: cancellation?.reason,
  }
}

// Update refund status
export async function updateRefundStatus(refundId: string, status: RefundStatus): Promise<void> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const updates: any = { status }
  if (status === 'approved') {
    updates.approved_by = user?.id
  }
  if (status === 'paid') {
    updates.paid_date = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('refunds')
    .update(updates)
    .eq('id', refundId)

  if (error) throw new Error(`Failed to update refund: ${error.message}`)

  // Get refund for timeline
  const { data: refund } = await supabase
    .from('refunds')
    .select('cancellation_id')
    .eq('id', refundId)
    .single()

  if (refund) {
    const { data: cancellation } = await supabase
      .from('cancellation_requests')
      .select('booking_id')
      .eq('id', refund.cancellation_id)
      .single()

    if (cancellation) {
      await supabase.from('booking_timeline_events').insert([
        {
          booking_id: cancellation.booking_id,
          event_type: 'refund_status_updated',
          description: `Refund status updated to ${status}`,
          created_by: user?.id,
        },
      ])
    }
  }
}

// Mark multiple refunds as paid
export async function markRefundsAsPaid(refundIds: string[]): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('refunds')
    .update({ status: 'paid', paid_date: today })
    .in('id', refundIds)

  if (error) throw new Error(`Failed to mark refunds as paid: ${error.message}`)
}
