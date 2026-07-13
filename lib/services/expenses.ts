'use server'

import { createClient } from '@/lib/supabase/server'
import type { Expense, AddExpenseFormData } from '@/types/finance'

export async function getExpenses(): Promise<Expense[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)
  return data || []
}

export async function getExpensesByBooking(bookingId: string): Promise<Expense[]> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('booking_id', bookingId)
    .order('expense_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)
  return data || []
}

export async function addExpense(formData: AddExpenseFormData): Promise<Expense> {
  const supabase = createClient()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        booking_id: formData.booking_id || null,
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        expense_date: formData.expense_date,
        receipt_url: formData.receipt_url || null,
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to add expense: ${error.message}`)
  return data
}

export async function getTotalExpensesByBooking(bookingId: string): Promise<number> {
  const supabase = createClient()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('booking_id', bookingId)

  if (error) throw new Error(`Failed to calculate expenses: ${error.message}`)
  return (data || []).reduce((sum, e) => sum + e.amount, 0)
}

export async function getExpensesByCategory(): Promise<{ category: string; total: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('category, amount')

  if (error) throw new Error(`Failed to get expenses by category: ${error.message}`)

  const summary: { [key: string]: number } = {}
  ;(data || []).forEach((expense) => {
    summary[expense.category] = (summary[expense.category] || 0) + expense.amount
  })

  return Object.entries(summary).map(([category, total]) => ({ category, total }))
}
