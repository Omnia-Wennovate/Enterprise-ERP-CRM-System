'use server'

import { createClient } from '@/lib/supabase/server'
import type { Vendor, CreateVendorFormData } from '@/types/finance'

// ── Get all vendors ───────────────────────────────────────────────────────────

export async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(`Failed to fetch vendors: ${error.message}`)

  // Enrich with computed stats
  const vendors = data || []
  const enriched = await Promise.all(
    vendors.map(async (v) => {
      const { data: expData } = await supabase
        .from('expenses')
        .select('amount, status, expense_date')
        .eq('vendor_id', v.id)
        .order('expense_date', { ascending: false })

      const exps = expData || []
      const total_expenses = exps.length
      const total_paid = exps
        .filter((e) => e.status === 'paid')
        .reduce((s, e) => s + (e.amount || 0), 0)
      const last_transaction = exps[0]?.expense_date ?? null

      return { ...v, total_expenses, total_paid, last_transaction }
    })
  )

  return enriched
}

// ── Create vendor ─────────────────────────────────────────────────────────────

export async function createVendor(formData: CreateVendorFormData): Promise<Vendor> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .insert([{ ...formData }])
    .select()
    .single()

  if (error) throw new Error(`Failed to create vendor: ${error.message}`)
  return data
}

// ── Update vendor ─────────────────────────────────────────────────────────────

export async function updateVendor(id: string, formData: Partial<CreateVendorFormData>): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to update vendor: ${error.message}`)
}

// ── Delete vendor (soft delete) ───────────────────────────────────────────────

export async function deleteVendor(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('vendors')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(`Failed to delete vendor: ${error.message}`)
}
