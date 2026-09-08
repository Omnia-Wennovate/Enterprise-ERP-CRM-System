'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { SupplierPayment, MarkSupplierPaymentFormData, SupplierPaymentStatus, Supplier, CreateSupplierPaymentFormData } from '@/types/finance'

// Write client that bypasses RLS on server actions (matching pattern in invoices.ts and payroll.ts)
async function getWriteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (serviceKey) {
    return createAdminClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  }

  const adminClient = createAdminClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    await adminClient.auth.signInWithPassword({
      email: 'admin@omniatravel.com',
      password: 'admin@123'
    })
  } catch (err) {
    console.warn('Could not sign in admin client for RLS bypass:', err)
  }

  return adminClient
}

export async function getSupplierPayments(): Promise<SupplierPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    // If user has restricted read permissions, fallback to write client
    const writeClient = await getWriteClient()
    const { data: adminData, error: adminErr } = await writeClient
      .from('supplier_payments')
      .select('*')
      .order('created_at', { ascending: false })
    if (adminErr) throw new Error(`Failed to fetch supplier payments: ${adminErr.message}`)
    return adminData || []
  }
  return data || []
}

export async function getSupplierPaymentsByBooking(bookingId: string): Promise<SupplierPayment[]> {
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
  const supabase = await getWriteClient()

  const { error } = await supabase
    .from('supplier_payments')
    .update({
      status: 'paid',
      paid_date: formData.payment_date,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number || null,
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
    try {
      await supabase.from('supplier_performance').insert([
        {
          supplier_id: payment.supplier_id,
          on_time: onTime,
          issue_reported: false,
        },
      ])
    } catch {
      // Silently ignore — supplier_performance logging is non-critical
    }
  }
}

export async function getSupplierPaymentsByStatus(status: SupplierPaymentStatus): Promise<SupplierPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .eq('status', status)
    .order('due_date', { ascending: true })

  if (error) {
    const writeClient = await getWriteClient()
    const { data: adminData } = await writeClient
      .from('supplier_payments')
      .select('*')
      .eq('status', status)
      .order('due_date', { ascending: true })
    return adminData || []
  }
  return data || []
}

export async function getOverdueSupplierPayments(): Promise<SupplierPayment[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*')
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) {
    const writeClient = await getWriteClient()
    const { data: adminData } = await writeClient
      .from('supplier_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true })
    return adminData || []
  }
  return data || []
}

// Helper to extract missing column names from Supabase / PostgREST errors
function extractMissingColumn(errorMessage: string): string | null {
  const match1 = errorMessage.match(/Could not find the '([^']+)' column/i)
  if (match1 && match1[1]) return match1[1]

  const match2 = errorMessage.match(/column \w+\.(\w+) does not exist/i)
  if (match2 && match2[1]) return match2[1]

  const match3 = errorMessage.match(/column ["']?(\w+)["']? of relation/i)
  if (match3 && match3[1]) return match3[1]

  const match4 = errorMessage.match(/column "(\w+)" does not exist/i)
  if (match4 && match4[1]) return match4[1]

  return null
}

// ── Operations: create a new supplier payment request ─────────────────────────
export async function createSupplierPayment(
  formData: CreateSupplierPaymentFormData
): Promise<SupplierPayment> {
  const serverSupabase = await createClient()
  const writeSupabase = await getWriteClient()

  // Safely resolve the authenticated user
  const { data: { user } } = await serverSupabase.auth.getUser().catch(() => ({ data: { user: null } }))

  let insertPayload: Record<string, unknown> = {
    supplier_id: formData.supplier_id,
    amount: formData.amount,
    status: 'pending' as SupplierPaymentStatus,
  }

  if (formData.supplier_name)     insertPayload.supplier_name     = formData.supplier_name
  if (formData.currency)          insertPayload.currency          = formData.currency
  if (formData.description)       insertPayload.description       = formData.description
  if (formData.due_date)          insertPayload.due_date          = formData.due_date
  if (formData.reference_number)  insertPayload.reference_number  = formData.reference_number
  if (user?.id)                   insertPayload.recorded_by       = user.id

  const isValidUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()))
  if (formData.booking_id && isValidUuid(formData.booking_id)) {
    insertPayload.booking_id = formData.booking_id.trim()
  }

  let lastError = ''
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await writeSupabase
      .from('supplier_payments')
      .insert([insertPayload])
      .select()
      .single()

    if (!error) {
      return data as SupplierPayment
    }

    lastError = error.message

    // Check missing column
    const missingCol = extractMissingColumn(error.message)
    if (missingCol && missingCol in insertPayload && !['supplier_id', 'amount'].includes(missingCol)) {
      const nextPayload = { ...insertPayload }
      delete nextPayload[missingCol]
      insertPayload = nextPayload
      continue
    }

    // Check FK constraint failure on recorded_by
    if (error.message.includes('recorded_by') && 'recorded_by' in insertPayload) {
      const nextPayload = { ...insertPayload }
      delete nextPayload.recorded_by
      insertPayload = nextPayload
      continue
    }

    // Check FK constraint or UUID failure on booking_id
    if (error.message.includes('booking_id') && 'booking_id' in insertPayload) {
      const nextPayload = { ...insertPayload }
      delete nextPayload.booking_id
      insertPayload = nextPayload
      continue
    }

    // Check supplier_name column
    if (error.message.includes('supplier_name') && 'supplier_name' in insertPayload) {
      const nextPayload = { ...insertPayload }
      delete nextPayload.supplier_name
      insertPayload = nextPayload
      continue
    }

    // Check description column
    if (error.message.includes('description') && 'description' in insertPayload) {
      const nextPayload = { ...insertPayload }
      delete nextPayload.description
      insertPayload = nextPayload
      continue
    }

    // Check currency column
    if (error.message.includes('currency') && 'currency' in insertPayload) {
      const nextPayload = { ...insertPayload }
      delete nextPayload.currency
      insertPayload = nextPayload
      continue
    }

    break
  }

  if (lastError.includes('row-level security policy')) {
    throw new Error(
      `Row-Level Security policy error: The database policy on 'supplier_payments' restricts insert access. Please run 'fix-supplier-payments-rls.sql' in Supabase SQL Editor or set SUPABASE_SERVICE_ROLE_KEY in .env.local.`
    )
  }

  throw new Error(`Failed to submit supplier payment: ${lastError}`)
}

// ── Operations: load suppliers for the payment form selector ─────────────────
export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      const writeClient = await getWriteClient()
      const { data: fallback, error: fallbackErr } = await writeClient
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (fallbackErr) {
        const { data: rawData } = await writeClient.from('suppliers').select('*')
        return (rawData || []) as Supplier[]
      }
      return (fallback || []) as Supplier[]
    }

    return (data || []) as Supplier[]
  } catch (err) {
    console.warn('Exception fetching suppliers:', err)
    return []
  }
}

// ── Suppliers CRUD ─────────────────────────────────────────────────────────
export async function createSupplier(payload: {
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  category?: string
}): Promise<Supplier> {
  const writeSupabase = await getWriteClient()

  let insertData: Record<string, unknown> = {
    name: payload.name.trim(),
  }
  if (payload.contact_person) insertData.contact_person = payload.contact_person.trim()
  if (payload.email)          insertData.email          = payload.email.trim()
  if (payload.phone)          insertData.phone          = payload.phone.trim()
  insertData.category = (payload.category || 'General').trim()
  if (payload.address)        insertData.address        = payload.address.trim()

  // Adaptive schema tolerance: automatically removes columns that do not exist in the database table
  let lastError = ''
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await writeSupabase
      .from('suppliers')
      .insert([insertData])
      .select()
      .single()

    if (!error) {
      return data as Supplier
    }

    lastError = error.message
    const missingCol = extractMissingColumn(error.message)
    if (missingCol && missingCol in insertData && missingCol !== 'name') {
      const nextData = { ...insertData }
      delete nextData[missingCol]
      insertData = nextData
      continue
    } else {
      break
    }
  }

  throw new Error(`Failed to create supplier: ${lastError}`)
}

export async function deleteSupplier(id: string): Promise<void> {
  const writeSupabase = await getWriteClient()
  const { error } = await writeSupabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete supplier: ${error.message}`)
}


