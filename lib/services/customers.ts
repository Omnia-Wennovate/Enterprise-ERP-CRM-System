'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateAge } from '@/lib/utils/age'
import type { Customer } from '@/types'

export { calculateAge }

// ── Params ─────────────────────────────────────────────────────────────────────

export interface CustomerParams {
  search?: string
  customer_type?: string
  is_active?: boolean
  limit?: number
  offset?: number
}

export interface CustomerInput {
  company_name: string
  contact_name: string
  email: string
  phone: string
  mobile?: string
  address?: string
  city?: string
  country?: string
  customer_type: 'leisure' | 'corporate' | 'tour_operator' | 'travel_agency'
  annual_value?: number
  is_active?: boolean
  notes?: string
  date_of_birth?: string | null
}

// ── Get list of customers ─────────────────────────────────────────────────────

export async function getCustomers(
  params?: CustomerParams
): Promise<{ data: Customer[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('is_active', params?.is_active ?? true)
    .order('created_at', { ascending: false })

  if (params?.search) {
    query = query.or(
      `company_name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    )
  }

  if (params?.customer_type) {
    query = query.eq('customer_type', params.customer_type)
  }

  const limit = params?.limit ?? 100
  const offset = params?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch customers: ${error.message}`)

  return { data: (data || []) as Customer[], total: count || 0 }
}

// ── Get single customer ───────────────────────────────────────────────────────

export async function getCustomerById(id: string): Promise<Customer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116')
    throw new Error(`Failed to fetch customer: ${error.message}`)

  return data as Customer | null
}

// ── Create customer ───────────────────────────────────────────────────────────

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_name: input.company_name,
      company: input.company_name,
      full_name: input.contact_name,
      contact_name: input.contact_name,
      email: input.email,
      phone: input.phone,
      mobile: input.mobile || null,
      address: input.address || null,
      city: input.city || null,
      country: input.country || null,
      customer_type: input.customer_type,
      annual_value: input.annual_value ?? 0,
      is_active: input.is_active ?? true,
      notes: input.notes || null,
      date_of_birth: input.date_of_birth || null,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create customer: ${error.message}`)
  return data as Customer
}

// ── Update customer ───────────────────────────────────────────────────────────

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>
): Promise<Customer> {
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (input.company_name !== undefined) {
    updatePayload.company_name = input.company_name
    updatePayload.company = input.company_name
  }
  if (input.contact_name !== undefined) {
    updatePayload.contact_name = input.contact_name
    updatePayload.full_name = input.contact_name
  }
  if (input.email !== undefined) updatePayload.email = input.email
  if (input.phone !== undefined) updatePayload.phone = input.phone
  if (input.mobile !== undefined) updatePayload.mobile = input.mobile
  if (input.address !== undefined) updatePayload.address = input.address
  if (input.city !== undefined) updatePayload.city = input.city
  if (input.country !== undefined) updatePayload.country = input.country
  if (input.customer_type !== undefined) updatePayload.customer_type = input.customer_type
  if (input.annual_value !== undefined) updatePayload.annual_value = input.annual_value
  if (input.is_active !== undefined) updatePayload.is_active = input.is_active
  if (input.notes !== undefined) updatePayload.notes = input.notes
  if ('date_of_birth' in input) updatePayload.date_of_birth = input.date_of_birth ?? null

  const { data, error } = await supabase
    .from('customers')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update customer: ${error.message}`)
  return data as Customer
}

// ── Archive customer (soft-delete) ────────────────────────────────────────────

export async function archiveCustomer(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('customers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to archive customer: ${error.message}`)
}
