'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  Expense,
  ExpenseWithRelations,
  ExpenseKPIs,
  ExpenseChartData,
  CreateExpenseFormData,
  AddExpenseFormData,
} from '@/types/finance'
import {
  notifyExpenseSubmitted,
} from '@/lib/services/expense-notifications'

// ── Generate unique expense number ─────────────────────────────────────────────

export async function generateExpenseNumber(): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  const { count } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })

  const sequence = String((count || 0) + 1).padStart(6, '0')
  return `EXP-${year}-${sequence}`
}

// ── Get expenses (basic — existing callers) ───────────────────────────────────

export async function getExpenses(): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)
  return data || []
}

// ── Get expenses by booking ───────────────────────────────────────────────────

export async function getExpensesByBooking(bookingId: string): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('booking_id', bookingId)
    .order('expense_date', { ascending: false })

  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)
  return data || []
}

// ── Get expenses with full relations ──────────────────────────────────────────

export async function getExpensesWithRelations(params?: {
  search?: string
  category?: string
  department?: string
  status?: string
  approval_status?: string
  payment_method?: string
  currency?: string
  vendor_id?: string
  booking_id?: string
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  limit?: number
  offset?: number
}): Promise<{ data: ExpenseWithRelations[]; total: number }> {
  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select(
      `
      *,
      vendors!fk_expenses_vendor(name),
      profiles!expenses_recorded_by_fkey(first_name, last_name),
      bookings!expenses_booking_id_fkey(booking_reference),
      expense_attachments(id)
    `,
      { count: 'exact' }
    )
    .order('expense_date', { ascending: false })

  if (params?.category) query = query.ilike('category', `%${params.category}%`)
  if (params?.department) query = query.ilike('department', params.department)
  if (params?.status) query = query.eq('status', params.status)
  if (params?.approval_status) query = query.eq('approval_status', params.approval_status)
  if (params?.payment_method) query = query.eq('payment_method', params.payment_method)
  if (params?.currency) query = query.eq('currency', params.currency)
  if (params?.vendor_id) query = query.eq('vendor_id', params.vendor_id)
  if (params?.booking_id) query = query.eq('booking_id', params.booking_id)
  if (params?.date_from) query = query.gte('expense_date', params.date_from)
  if (params?.date_to) query = query.lte('expense_date', params.date_to)
  if (params?.amount_min) query = query.gte('amount', params.amount_min)
  if (params?.amount_max) query = query.lte('amount', params.amount_max)
  if (params?.search) {
    query = query.or(
      `expense_number.ilike.%${params.search}%,description.ilike.%${params.search}%,payment_reference.ilike.%${params.search}%`
    )
  }

  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) throw new Error(`Failed to fetch expenses: ${error.message}`)

  const rows: ExpenseWithRelations[] = (data || []).map((row: Record<string, unknown>) => {
    const vendor = row.vendors as { name?: string } | null
    const profile = row.profiles as { first_name?: string; last_name?: string } | null
    const booking = row.bookings as { booking_reference?: string } | null
    const attachments = row.expense_attachments as unknown[]
    return {
      ...row,
      vendor_name: vendor?.name ?? null,
      employee_name: profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
        : null,
      booking_reference: booking?.booking_reference ?? null,
      attachment_count: attachments?.length ?? 0,
    } as ExpenseWithRelations
  })

  return { data: rows, total: count || 0 }
}

// ── Get single expense with all details ───────────────────────────────────────

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select(
      `
      *,
      vendors!fk_expenses_vendor(name, email, phone, contact_person),
      profiles!expenses_recorded_by_fkey(first_name, last_name),
      bookings!expenses_booking_id_fkey(booking_reference, destination),
      expense_attachments(id, file_name, file_url, file_size, file_type, page_order, created_at),
      expense_approvals(id, step, approver_role, status, comments, approved_at, created_at),
      expense_splits(id, department, project, booking_id, split_amount, split_percent)
    `
    )
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116')
    throw new Error(`Failed to fetch expense: ${error.message}`)
  if (!data) return null

  const vendor = data.vendors as Record<string, unknown> | null
  const profile = data.profiles as { first_name?: string; last_name?: string } | null

  return {
    ...data,
    vendor_name: (vendor?.name as string) ?? null,
    employee_name: profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : null,
  } as ExpenseWithRelations
}

// ── Create expense (full enterprise form) ─────────────────────────────────────

export async function createExpense(formData: CreateExpenseFormData & {
  submission_source?: 'finance' | 'department'
  trip_reference?: string
}): Promise<Expense> {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  const expenseNumber = await generateExpenseNumber()

  const { splits, submission_source, trip_reference, ...expenseData } = formData as typeof formData & { submission_source?: string; trip_reference?: string }

  // ── SERVER-SIDE ENFORCEMENT for Department Expenses ──
  let finalDepartment = expenseData.department || null
  let finalEmployeeId = expenseData.employee_id || userId || null

  if (submission_source === 'department') {
    const effectiveUserId = userId || expenseData.employee_id
    
    if (!effectiveUserId) {
      console.warn("Demo Mode Fallback: No user ID provided. Trusting client data for demo.")
      finalDepartment = expenseData.department || 'General'
      finalEmployeeId = null
    } else {
      // Look up real department and identity from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department')
        .eq('id', effectiveUserId)
        .single()
        
      if (profileError || !profile) {
        console.warn("Demo Mode Fallback: Profile not found in database. Trusting client data for demo.")
        finalDepartment = expenseData.department || 'General'
        finalEmployeeId = effectiveUserId
      } else {
        if (!profile.department || profile.department.trim() === '') {
          throw new Error("You do not have a department assigned in your profile. Please contact HR.")
        }
        finalDepartment = profile.department
        finalEmployeeId = effectiveUserId
      }
    }
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        expense_number: expenseNumber,
        booking_id: expenseData.booking_id || null,
        category: expenseData.category,
        description: expenseData.description,
        amount: expenseData.amount,
        expense_date: expenseData.expense_date,
        recorded_by: userId,
        vendor_id: expenseData.vendor_id || null,
        employee_id: finalEmployeeId,
        department: finalDepartment,
        project: expenseData.project || null,
        currency: expenseData.currency || 'USD',
        exchange_rate: expenseData.exchange_rate || 1,
        original_currency: expenseData.original_currency || null,
        original_amount: expenseData.original_amount || null,
        tax: expenseData.tax || 0,
        discount: expenseData.discount || 0,
        payment_method: expenseData.payment_method || null,
        payment_reference: expenseData.payment_reference || null,
        status: expenseData.status || 'unpaid',
        approval_status: expenseData.approval_status || 'pending',
        notes: expenseData.notes || null,
        policy_exceeded: expenseData.policy_exceeded || false,
        submission_source: submission_source || 'finance',
        trip_reference: trip_reference || null,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to create expense: ${error.message}`)

  // Insert splits if provided
  if (splits && splits.length > 0) {
    const { error: splitError } = await supabase.from('expense_splits').insert(
      splits.map((s) => ({
        expense_id: data.id,
        department: s.department || null,
        project: s.project || null,
        booking_id: s.booking_id || null,
        split_amount: s.split_amount,
        split_percent: s.split_percent || null,
      }))
    )
    if (splitError) throw new Error(`Failed to create splits: ${splitError.message}`)
  }

  // ── Approval chain creation with threshold routing ─────────────────────────
  // Below threshold → skip Dept Manager (step 1), start at Finance Officer (step 2)
  // At/above threshold → full 4-step chain
  let approvalSteps = [
    { expense_id: data.id, step: 1, approver_role: 'Department Manager', status: 'pending' },
    { expense_id: data.id, step: 2, approver_role: 'Finance Officer', status: 'pending' },
    { expense_id: data.id, step: 3, approver_role: 'Finance Manager', status: 'pending' },
    { expense_id: data.id, step: 4, approver_role: 'Director', status: 'pending' },
  ]

  try {
    const { data: settings } = await supabase
      .from('finance_settings')
      .select('approval_threshold_amount')
      .limit(1)
      .single()

    const threshold = settings?.approval_threshold_amount ?? 5000

    if ((expenseData.amount || 0) < threshold) {
      // Below threshold: route directly to Finance Officer (skip Dept Manager)
      // Mark step 1 as not_required so the chain still exists for audit visibility
      approvalSteps = [
        { expense_id: data.id, step: 1, approver_role: 'Department Manager', status: 'not_required' as any },
        { expense_id: data.id, step: 2, approver_role: 'Finance Officer', status: 'pending' },
        { expense_id: data.id, step: 3, approver_role: 'Finance Manager', status: 'pending' },
        { expense_id: data.id, step: 4, approver_role: 'Director', status: 'pending' },
      ]
    }
  } catch {
    // finance_settings might not exist yet — use full chain
  }

  const { error: approvalError } = await supabase.from('expense_approvals').insert(approvalSteps)
  if (approvalError) {
    console.warn('Failed to create approval chain:', approvalError.message)
  }

  // ── Notify Finance of new submission (non-fatal) ───────────────────────────
  if (submission_source === 'department' || expenseData.department) {
    try {
      let submitterName = 'An employee'
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single()
        if (profile) {
          submitterName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || submitterName
        }
      }
      const deptLabel = expenseData.department ? ` from ${expenseData.department}` : ''
      await notifyExpenseSubmitted(
        expenseNumber,
        data.id,
        `${submitterName}${deptLabel}`
      )
    } catch {
      // Non-fatal
    }
  }

  return data
}

// ── addExpense (legacy compatibility) ─────────────────────────────────────────

export async function addExpense(formData: AddExpenseFormData): Promise<Expense> {
  return createExpense({
    expense_date: formData.expense_date,
    category: formData.category,
    description: formData.description,
    amount: formData.amount,
    booking_id: formData.booking_id,
    currency: 'USD',
  })
}

// ── Update expense ────────────────────────────────────────────────────────────

export async function updateExpense(id: string, updates: Partial<CreateExpenseFormData>): Promise<void> {
  const supabase = await createClient()
  const { splits, ...updateData } = updates

  const { error } = await supabase
    .from('expenses')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`Failed to update expense: ${error.message}`)
}

// ── Delete expense ────────────────────────────────────────────────────────────

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete expense: ${error.message}`)
}

// ── Duplicate expense ─────────────────────────────────────────────────────────

export async function duplicateExpense(id: string): Promise<Expense> {
  const supabase = await createClient()
  const { data: original, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !original) throw new Error('Expense not found')

  const expenseNumber = await generateExpenseNumber()
  const { data, error: insertError } = await supabase
    .from('expenses')
    .insert([
      {
        ...original,
        id: undefined,
        expense_number: expenseNumber,
        expense_date: new Date().toISOString().split('T')[0],
        status: 'unpaid',
        approval_status: 'pending',
        created_at: undefined,
        updated_at: undefined,
      },
    ])
    .select()
    .single()

  if (insertError) throw new Error(`Failed to duplicate expense: ${insertError.message}`)
  return data
}

// ── Archive expense ───────────────────────────────────────────────────────────

export async function archiveExpense(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`Failed to archive expense: ${error.message}`)
}

// ── Mark expense as paid ──────────────────────────────────────────────────────

export async function markExpensePaid(id: string, paymentReference?: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({
      status: 'paid',
      payment_reference: paymentReference || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`Failed to mark expense as paid: ${error.message}`)
}

// ── Get KPIs ──────────────────────────────────────────────────────────────────

export async function getExpenseKPIs(): Promise<ExpenseKPIs> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'
  const year = today.slice(0, 4)

  const { data: all } = await supabase.from('expenses').select('amount, tax, status, approval_status, expense_date')

  const exps = all || []
  const total_amount = exps.reduce((s, e) => s + (e.amount || 0), 0)
  const total_records = exps.length
  const monthly_amount = exps
    .filter((e) => e.expense_date >= monthStart)
    .reduce((s, e) => s + (e.amount || 0), 0)
  const today_amount = exps
    .filter((e) => e.expense_date === today)
    .reduce((s, e) => s + (e.amount || 0), 0)
  const pending_approval = exps.filter((e) => e.approval_status === 'pending').length
  const approved = exps.filter((e) => e.approval_status === 'approved').length
  const rejected = exps.filter((e) => e.approval_status === 'rejected').length
  const paid = exps.filter((e) => e.status === 'paid').length
  const unpaid = exps.filter((e) => e.status === 'unpaid').length
  const reimbursed = exps.filter((e) => e.status === 'reimbursed').length
  const average_expense = total_records > 0 ? total_amount / total_records : 0
  const largest_expense = exps.reduce((max, e) => Math.max(max, e.amount || 0), 0)
  const tax_deductible_amount = exps.reduce((s, e) => s + (e.tax || 0), 0)

  // Budget data
  const { data: budgets } = await supabase
    .from('expense_budgets')
    .select('budget_amount')
    .eq('period_year', parseInt(year))
    .eq('period_month', new Date().getMonth() + 1)

  const budget_total = (budgets || []).reduce((s, b) => s + b.budget_amount, 0)
  const budget_remaining = budget_total - monthly_amount
  const budget_utilization_percent = budget_total > 0 ? (monthly_amount / budget_total) * 100 : 0

  return {
    total_amount,
    total_records,
    monthly_amount,
    today_amount,
    pending_approval,
    approved,
    rejected,
    paid,
    unpaid,
    reimbursed,
    average_expense,
    largest_expense,
    budget_total,
    budget_remaining,
    budget_utilization_percent,
    tax_deductible_amount,
  }
}

// ── Get chart data ────────────────────────────────────────────────────────────

export async function getExpenseChartData(): Promise<ExpenseChartData> {
  const supabase = await createClient()

  const { data: all } = await supabase
    .from('expenses')
    .select(
      `amount, category, department, payment_method, currency, expense_date, vendor_id,
       vendors!fk_expenses_vendor(name)`
    )

  const exps = all || []

  // Monthly trend (last 12 months)
  const monthlyMap: Record<string, number> = {}
  exps.forEach((e) => {
    const month = (e.expense_date || '').slice(0, 7)
    if (month) monthlyMap[month] = (monthlyMap[month] || 0) + (e.amount || 0)
  })
  const monthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({ month, amount }))

  // By category
  const catMap: Record<string, number> = {}
  exps.forEach((e) => {
    if (e.category) catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0)
  })
  const by_category = Object.entries(catMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12)

  // By department
  const deptMap: Record<string, number> = {}
  exps.forEach((e) => {
    const dept = e.department || 'Unassigned'
    deptMap[dept] = (deptMap[dept] || 0) + (e.amount || 0)
  })
  const by_department = Object.entries(deptMap)
    .map(([department, amount]) => ({ department, amount }))
    .sort((a, b) => b.amount - a.amount)

  // By vendor
  const vendorMap: Record<string, number> = {}
  exps.forEach((e) => {
    const vendor = (e.vendors as { name?: string } | null)?.name || 'No Vendor'
    vendorMap[vendor] = (vendorMap[vendor] || 0) + (e.amount || 0)
  })
  const by_vendor = Object.entries(vendorMap)
    .map(([vendor, amount]) => ({ vendor, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  // By payment method
  const pmMap: Record<string, number> = {}
  exps.forEach((e) => {
    const method = e.payment_method || 'Unspecified'
    pmMap[method] = (pmMap[method] || 0) + (e.amount || 0)
  })
  const by_payment_method = Object.entries(pmMap).map(([method, amount]) => ({ method, amount }))

  // Budget vs actual (current month)
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const { data: budgets } = await supabase
    .from('expense_budgets')
    .select('budget_amount, department')
    .eq('period_year', year)
    .eq('period_month', month)

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const budget_vs_actual = (budgets || []).map((b) => {
    const spent = exps
      .filter(
        (e) =>
          (!b.department || e.department === b.department) &&
          (e.expense_date || '') >= monthStart
      )
      .reduce((s, e) => s + (e.amount || 0), 0)
    return { period: b.department || `Month ${month}/${year}`, budget: b.budget_amount, actual: spent }
  })

  return { monthly, by_category, by_department, by_vendor, by_payment_method, budget_vs_actual }
}

// ── getTotalExpensesByBooking (existing — keep) ───────────────────────────────

export async function getTotalExpensesByBooking(bookingId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('booking_id', bookingId)

  if (error) throw new Error(`Failed to calculate expenses: ${error.message}`)
  return (data || []).reduce((sum, e) => sum + e.amount, 0)
}

// ── getExpensesByCategory (existing — keep) ────────────────────────────────────

export async function getExpensesByCategory(): Promise<{ category: string; total: number }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('expenses').select('category, amount')

  if (error) throw new Error(`Failed to get expenses by category: ${error.message}`)

  const summary: Record<string, number> = {}
  ;(data || []).forEach((expense) => {
    summary[expense.category] = (summary[expense.category] || 0) + expense.amount
  })

  return Object.entries(summary).map(([category, total]) => ({ category, total }))
}
