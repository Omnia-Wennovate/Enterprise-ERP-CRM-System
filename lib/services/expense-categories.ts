'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseCategoryConfig } from '@/types/finance'

export async function getExpenseCategories(): Promise<ExpenseCategoryConfig[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name')

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)
  return data || []
}

export async function createExpenseCategory(
  name: string,
  monthly_limit?: number,
  per_transaction_limit?: number,
  daily_per_person_limit?: number
): Promise<ExpenseCategoryConfig> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expense_categories')
    .insert([{ name, monthly_limit, per_transaction_limit, daily_per_person_limit }])
    .select()
    .single()

  if (error) throw new Error(`Failed to create category: ${error.message}`)
  return data
}

export async function updateExpenseCategory(
  id: string,
  updates: Partial<Omit<ExpenseCategoryConfig, 'id' | 'created_at'>>
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_categories')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(`Failed to update category: ${error.message}`)
}

export async function getCategoryPolicyLimit(
  categoryName: string
): Promise<{ per_transaction_limit: number | null; daily_per_person_limit: number | null; monthly_limit: number | null }> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('expense_categories')
    .select('per_transaction_limit, daily_per_person_limit, monthly_limit')
    .ilike('name', categoryName)
    .single()

  return {
    per_transaction_limit: data?.per_transaction_limit ?? null,
    daily_per_person_limit: data?.daily_per_person_limit ?? null,
    monthly_limit: data?.monthly_limit ?? null,
  }
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_categories')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw new Error(`Failed to delete category: ${error.message}`)
}
