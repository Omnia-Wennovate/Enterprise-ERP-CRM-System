'use server'

import { createClient } from '@/lib/supabase/server'
import type { Payment, RecordPaymentFormData } from '@/types/finance'
import { recalculateInvoiceStatus } from './invoices'

// Get all payments
export async function getPayments(): Promise<Payment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`)
  return data || []
}

// Get payments for specific invoice
export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`)
  return data || []
}

// Get payments with filters
export async function getPaymentsFiltered(
  method?: string,
  startDate?: string,
  endDate?: string,
  limit = 50,
  offset = 0
): Promise<{ data: Payment[]; total: number }> {
  const supabase = await createClient()

  let query = supabase.from('payments').select('*', { count: 'exact' })

  if (method) {
  const supabase = createClient()
    query = query.eq('payment_method', method)
  }

  if (startDate) {
    query = query.gte('payment_date', startDate)
  }

  if (endDate) {
    query = query.lte('payment_date', endDate)
  }

  const { data, error, count } = await query
    .order('payment_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`)
  return { data: data || [], total: count || 0 }
}

// Record payment for invoice
export async function recordPayment(formData: RecordPaymentFormData): Promise<Payment> {
  const supabase = createClient()
  const supabase = await createClient()

  // Verify invoice exists
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, total_amount')
    .eq('id', formData.invoice_id)
    .single()

  if (invoiceError) throw new Error(`Invoice not found`)

  // Check payment amount doesn't exceed invoice total
  const { data: existingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', formData.invoice_id)

  const totalPaid = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0) + formData.amount
  if (totalPaid > invoice.total_amount) {
    throw new Error(`Payment amount exceeds invoice total. Maximum: ${invoice.total_amount - totalPaid + formData.amount}`)
  }

  // Create payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([
      {
        invoice_id: formData.invoice_id,
        amount: formData.amount,
        payment_method: formData.payment_method,
        payment_date: formData.payment_date,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select()
    .single()

  if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`)

  // Recalculate invoice status
  await recalculateInvoiceStatus(formData.invoice_id)

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: (await supabase
        .from('invoices')
        .select('booking_id')
        .eq('id', formData.invoice_id)
        .single()).data?.booking_id,
      event_type: 'payment_received',
      description: `Payment of ${formData.amount} received for invoice`,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    },
  ])

  return payment
}

// Get payment by ID
export async function getPaymentById(paymentId: string): Promise<Payment | null> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch payment: ${error.message}`)
  }

  return data || null
}

// Calculate total paid for invoice
export async function calculateTotalPaid(invoiceId: string): Promise<number> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  if (error) throw new Error(`Failed to calculate total paid: ${error.message}`)
  return (data || []).reduce((sum, p) => sum + p.amount, 0)
}

// Get payment methods summary
export async function getPaymentMethodsSummary(): Promise<{ method: string; count: number; total: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('payment_method, amount')

  if (error) throw new Error(`Failed to get payment methods summary: ${error.message}`)

  const summary: { [key: string]: { count: number; total: number } } = {}

  ;(data || []).forEach((payment) => {
    if (!summary[payment.payment_method]) {
  const supabase = createClient()
      summary[payment.payment_method] = { count: 0, total: 0 }
    }
    summary[payment.payment_method].count += 1
    summary[payment.payment_method].total += payment.amount
  })

  return Object.entries(summary).map(([method, stats]) => ({
    method,
    ...stats,
  }))
}

// Export payments to CSV
export async function exportPaymentsToCSV(payments: Payment[]): Promise<string> {
  const supabase = createClient()
  const headers = ['Date', 'Invoice ID', 'Amount', 'Method', 'Reference', 'Notes', 'Recorded By']
  const rows = payments.map((payment) => [
    payment.payment_date,
    payment.invoice_id,
    payment.amount.toString(),
    payment.payment_method,
    payment.reference_number || '',
    payment.notes || '',
    payment.recorded_by || '',
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csv
}
