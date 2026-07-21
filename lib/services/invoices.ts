'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Invoice,
  InvoiceLineItem,
  InvoiceDetail,
  CreateInvoiceFormData,
  InvoiceStatus,
} from '@/types/finance'

// Generate unique invoice number
export async function generateInvoiceNumber(): Promise<string> {
  const supabase = await createClient()
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  // Get count of invoices created today
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-${month}-${day}`)
    .lte('created_at', `${year}-${month}-${day}T23:59:59`)

  const sequence = String((count || 0) + 1).padStart(4, '0')
  return `INV-${year}-${sequence}`
}

// Get all invoices
export async function getInvoices(): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)
  return data || []
}

// Get invoices with filters
export async function getInvoicesFiltered(
  status?: InvoiceStatus,
  search?: string,
  limit = 50,
  offset = 0
): Promise<{ data: Invoice[]; total: number }> {
  const supabase = await createClient()

  let query = supabase.from('invoices').select('*', { count: 'exact' })

  if (status) {
  const supabase = createClient()
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,customer_id.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)
  return { data: data || [], total: count || 0 }
}

// Get single invoice with full details
export async function getInvoiceById(id: string): Promise<InvoiceDetail | null> {
  const supabase = await createClient()

  // Fetch invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()

  if (invoiceError && invoiceError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch invoice: ${invoiceError.message}`)
  }

  if (!invoice) return null

  // Fetch line items
  const { data: lineItems, error: itemsError } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)

  if (itemsError) throw new Error(`Failed to fetch line items: ${itemsError.message}`)

  // Fetch payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', id)

  if (paymentsError) throw new Error(`Failed to fetch payments: ${paymentsError.message}`)

  // Calculate outstanding balance
  const paidAmount = (payments || []).reduce((sum, p) => sum + p.amount, 0)
  const outstandingBalance = invoice.total_amount - paidAmount

  // Fetch customer and booking info
  const { data: customer } = await supabase
    .from('customers')
    .select('company_name')
    .eq('id', invoice.customer_id)
    .single()

  const { data: booking } = await supabase
    .from('bookings')
    .select('booking_reference')
    .eq('id', invoice.booking_id)
    .single()

  return {
    ...invoice,
    line_items: lineItems || [],
    payments: payments || [],
    outstanding_balance: outstandingBalance,
    customer_name: customer?.company_name,
    booking_reference: booking?.booking_reference,
  }
}

// Create invoice with line items
export async function createInvoice(formData: CreateInvoiceFormData): Promise<Invoice> {
  const supabase = await createClient()
  const invoiceNumber = await generateInvoiceNumber()

  // Fetch booking and customer info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('customer_id, total_revenue')
    .eq('id', formData.booking_id)
    .single()

  if (bookingError) throw new Error(`Booking not found: ${bookingError.message}`)

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([
      {
        invoice_number: invoiceNumber,
        booking_id: formData.booking_id,
        customer_id: booking.customer_id,
        amount: formData.amount,
        tax: formData.tax,
        due_date: formData.due_date,
        issued_date: new Date().toISOString().split('T')[0],
        status: 'draft',
      },
    ])
    .select()
    .single()

  if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`)

  // Create line items
  if (formData.line_items.length > 0) {
    const { error: itemsError } = await supabase.from('invoice_line_items').insert(
      formData.line_items.map((item) => ({
        invoice_id: invoice.id,
        ...item,
      }))
    )

    if (itemsError) {
      // Rollback invoice
      await supabase.from('invoices').delete().eq('id', invoice.id)
      throw new Error(`Failed to create line items: ${itemsError.message}`)
    }
  }

  // Create timeline event
  await supabase.from('booking_timeline_events').insert([
    {
      booking_id: formData.booking_id,
      event_type: 'invoice_generated',
      description: `Invoice ${invoiceNumber} generated`,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    },
  ])

  return invoice
}

// Update invoice status
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (error) throw new Error(`Failed to update invoice status: ${error.message}`)
}

// Calculate invoice status based on payments
export async function recalculateInvoiceStatus(invoiceId: string): Promise<void> {
  const supabase = await createClient()

  // Fetch invoice and payments
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('id', invoiceId)
    .single()

  if (invoiceError) throw new Error(`Invoice not found`)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', invoiceId)

  const paidAmount = (payments || []).reduce((sum, p) => sum + p.amount, 0)
  const outstanding = invoice.total_amount - paidAmount

  let newStatus: InvoiceStatus = 'draft'
  if (outstanding === 0) {
    newStatus = 'paid'
  } else if (outstanding < invoice.total_amount && outstanding > 0) {
    newStatus = 'partially_paid'
  } else if (new Date() > new Date(invoice.due_date)) {
    newStatus = 'overdue'
  }

  await updateInvoiceStatus(invoiceId, newStatus)
}

// Send invoice (update status to sent)
export async function sendInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (error) throw new Error(`Failed to send invoice: ${error.message}`)
}

// Cancel invoice
export async function cancelInvoice(invoiceId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)

  if (error) throw new Error(`Failed to cancel invoice: ${error.message}`)
}

// Export invoices to CSV
export async function exportInvoicesToCSV(invoices: Invoice[]): Promise<string> {
  const supabase = createClient()
  const headers = ['Invoice Number', 'Booking ID', 'Customer ID', 'Amount', 'Tax', 'Total', 'Status', 'Due Date', 'Created At']
  const rows = invoices.map((inv) => [
    inv.invoice_number,
    inv.booking_id,
    inv.customer_id,
    inv.amount.toString(),
    inv.tax.toString(),
    inv.total_amount.toString(),
    inv.status,
    inv.due_date,
    inv.created_at,
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csv
}
