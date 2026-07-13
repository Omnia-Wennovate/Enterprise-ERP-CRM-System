'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupplierPayment, MarkSupplierPaymentFormData, SupplierPaymentStatus } from '@/types/finance'

export async function getSupplierPayments(): Promise<SupplierPayment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch supplier payments: ${error.message}`)
  return data || []
}

export async function getSupplierPaymentsByBooking(bookingId: string): Promise<SupplierPayment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch supplier payments: ${error.message}`)
  return data || []
}

export async function getTotalSupplierPaymentsByBooking(bookingId: string): Promise<number> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('amount')
    .eq('booking_id', bookingId)
    .eq('status', 'paid')

  if (error) throw new Error(`Failed to calculate supplier payments: ${error.message}`)
  return (data || []).reduce((sum, p) => sum + p.amount, 0)
}

export async function markSupplierPaymentAsPaid(formData: MarkSupplierPaymentFormData): Promise<void> {
  const supabase = createClient()
  const supabase = await createClient()

  const { error } = await supabase
    .from('supplier_payments')
    .update({
      status: 'paid',
      paid_date: formData.payment_date,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number || null,
      recorded_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', formData.supplier_payment_id)

  if (error) throw new Error(`Failed to mark payment as paid: ${error.message}`)

  // Record in supplier performance
  const { data: payment } = await supabase
    .from('supplier_payments')
    .select('supplier_id, due_date')
    .eq('id', formData.supplier_payment_id)
    .single()

  if (payment) {
    const onTime = new Date(formData.payment_date) <= new Date(payment.due_date || new Date())
    await supabase.from('supplier_performance').insert([
      {
        supplier_id: payment.supplier_id,
        on_time: onTime,
        issue_reported: false,
      },
    ])
  }
}

export async function getSupplierPaymentsByStatus(status: SupplierPaymentStatus): Promise<SupplierPayment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .eq('status', status)
    .order('due_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch supplier payments: ${error.message}`)
  return data || []
}

export async function getOverdueSupplierPayments(): Promise<SupplierPayment[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch overdue payments: ${error.message}`)
  return data || []
}
