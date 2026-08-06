'use server'

import { createClient } from '@/lib/supabase/server'
import type { ExpenseBudget } from '@/types/finance'

// ── Get all budgets with utilization ─────────────────────────────────────────

export async function getExpenseBudgets(year?: number, month?: number): Promise<ExpenseBudget[]> {
  const supabase = await createClient()
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? (now.getMonth() + 1)

  const { data, error } = await supabase
    .from('expense_budgets')
    .select('*')
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth)
    .order('department')

  if (error) throw new Error(`Failed to fetch budgets: ${error.message}`)

  const budgets = data || []

  // Enrich with actual spend
  const enriched = await Promise.all(
    budgets.map(async (b) => {
      let query = supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`)
        .lte('expense_date', `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`)

      if (b.department) query = query.eq('department', b.department)
      if (b.category) query = query.ilike('category', b.category)

      const { data: expData } = await query
      const spent = (expData || []).reduce((s: number, e: { amount: number }) => s + (e.amount || 0), 0)
      const remaining = b.budget_amount - spent
      const utilization_percent = b.budget_amount > 0 ? (spent / b.budget_amount) * 100 : 0

      return { ...b, spent, remaining, utilization_percent }
    })
  )

  return enriched
}

// ── Create budget ─────────────────────────────────────────────────────────────

export async function createExpenseBudget(params: {
  department?: string
  category?: string
  period_month: number
  period_year: number
  budget_amount: number
}): Promise<ExpenseBudget> {
  const supabase = await createClient()
  const userId = (await supabase.auth.getUser()).data.user?.id

  const { data, error } = await supabase
    .from('expense_budgets')
    .upsert([{ ...params, created_by: userId }], {
      onConflict: 'department,category,period_month,period_year',
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create budget: ${error.message}`)
  return data
}

// ── Update budget ─────────────────────────────────────────────────────────────

export async function updateExpenseBudget(id: string, budget_amount: number): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expense_budgets')
    .update({ budget_amount })
    .eq('id', id)

  if (error) throw new Error(`Failed to update budget: ${error.message}`)
}

// ── Delete budget ─────────────────────────────────────────────────────────────

export async function deleteExpenseBudget(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expense_budgets').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete budget: ${error.message}`)
}

// ── Get total budget utilization ──────────────────────────────────────────────

export async function getTotalBudgetUtilization(
  year: number,
  month: number
): Promise<{ total_budget: number; total_spent: number; utilization: number }> {
  const supabase = await createClient()

  const { data: budgets } = await supabase
    .from('expense_budgets')
    .select('budget_amount')
    .eq('period_year', year)
    .eq('period_month', month)

  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte('expense_date', `${year}-${String(month).padStart(2, '0')}-31`)

  const total_budget = (budgets || []).reduce((s: number, b: { budget_amount: number }) => s + b.budget_amount, 0)
  const total_spent = (expenses || []).reduce((s: number, e: { amount: number }) => s + e.amount, 0)
  const utilization = total_budget > 0 ? (total_spent / total_budget) * 100 : 0

  return { total_budget, total_spent, utilization }
}
