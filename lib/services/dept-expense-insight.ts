'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns a plain-language spending insight sentence for a department,
 * comparing this month's total to last month's total per category.
 * Purely templated from real database queries — no AI.
 */
export async function getDeptSpendingInsight(department: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const thisYear = now.getFullYear()
    const thisMonth = now.getMonth() + 1
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1
    const lastYear = thisMonth === 1 ? thisYear - 1 : thisYear

    const thisStart = `${thisYear}-${String(thisMonth).padStart(2, '0')}-01`
    const thisEnd = `${thisYear}-${String(thisMonth).padStart(2, '0')}-31`
    const lastStart = `${lastYear}-${String(lastMonth).padStart(2, '0')}-01`
    const lastEnd = `${lastYear}-${String(lastMonth).padStart(2, '0')}-31`

    const [{ data: thisData }, { data: lastData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('amount, category')
        .ilike('department', department)
        .gte('expense_date', thisStart)
        .lte('expense_date', thisEnd),
      supabase
        .from('expenses')
        .select('amount, category')
        .ilike('department', department)
        .gte('expense_date', lastStart)
        .lte('expense_date', lastEnd),
    ])

    const thisTotal = (thisData || []).reduce((s, e) => s + (e.amount || 0), 0)
    const lastTotal = (lastData || []).reduce((s, e) => s + (e.amount || 0), 0)

    // Find top category this month
    const catMap: Record<string, number> = {}
    ;(thisData || []).forEach((e) => {
      if (e.category) catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0)
    })
    const topCatEntry = Object.entries(catMap).sort(([, a], [, b]) => b - a)[0]

    if (lastTotal === 0 && thisTotal === 0) return null

    // Compare this month vs last month
    if (lastTotal === 0) {
      return `${department} submitted ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(thisTotal)} in expenses this month — first submission period recorded.`
    }

    const diffPct = Math.round(((thisTotal - lastTotal) / lastTotal) * 100)
    const direction = diffPct >= 0 ? 'more' : 'less'
    const absPct = Math.abs(diffPct)

    const monthName = new Date(thisYear, thisMonth - 1, 1).toLocaleString('en-US', { month: 'long' })

    if (topCatEntry && absPct >= 5) {
      return `${department} has submitted ${absPct}% ${direction} in total expenses in ${monthName} compared to last month — highest spend in ${topCatEntry[0]}.`
    }

    if (absPct >= 5) {
      return `${department} has submitted ${absPct}% ${direction} in total expenses in ${monthName} compared to last month.`
    }

    // Spending is roughly flat
    return `${department} expense spending in ${monthName} is roughly on par with last month.`
  } catch {
    return null
  }
}

/**
 * Returns KPI summary for a specific department's expenses.
 */
export async function getDeptExpenseSummary(department: string): Promise<{
  total: number
  total_amount: number
  pending: number
  approved: number
  approved_amount: number
  rejected: number
}> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('expenses')
      .select('amount, approval_status')
      .eq('department', department)

    const rows = data || []
    const total = rows.length
    const total_amount = rows.reduce((s, e) => s + (e.amount || 0), 0)
    const pending = rows.filter((e) => e.approval_status === 'pending').length
    const approved = rows.filter((e) => e.approval_status === 'approved').length
    const approved_amount = rows
      .filter((e) => e.approval_status === 'approved')
      .reduce((s, e) => s + (e.amount || 0), 0)
    const rejected = rows.filter((e) => e.approval_status === 'rejected').length

    return { total, total_amount, pending, approved, approved_amount, rejected }
  } catch {
    return { total: 0, total_amount: 0, pending: 0, approved: 0, approved_amount: 0, rejected: 0 }
  }
}

/**
 * Returns live budget utilization for dept+category for the current month.
 * Used for the non-blocking budget indicator at submission time.
 */
export async function getDeptBudgetIndicator(
  department: string,
  category: string
): Promise<{ budget: number; spent: number; percent: number; has_budget: boolean } | null> {
  try {
    const supabase = await createClient()
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`

    const { data: budgetData } = await supabase
      .from('expense_budgets')
      .select('budget_amount')
      .eq('department', department)
      .eq('period_month', month)
      .eq('period_year', year)
      .limit(1)

    const budget = budgetData?.[0]?.budget_amount ?? 0
    if (budget === 0) {
      // Try category-level budget (no department filter)
      const { data: catBudget } = await supabase
        .from('expense_budgets')
        .select('budget_amount')
        .ilike('category', category)
        .eq('period_month', month)
        .eq('period_year', year)
        .limit(1)

      const catAmt = catBudget?.[0]?.budget_amount ?? 0
      if (catAmt === 0) return { budget: 0, spent: 0, percent: 0, has_budget: false }

      const { data: spentData } = await supabase
        .from('expenses')
        .select('amount')
        .ilike('department', department)
        .ilike('category', category)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)

      const spent = (spentData || []).reduce((s, e) => s + (e.amount || 0), 0)
      return { budget: catAmt, spent, percent: catAmt > 0 ? (spent / catAmt) * 100 : 0, has_budget: true }
    }

    const { data: spentData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('department', department)
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd)

    const spent = (spentData || []).reduce((s, e) => s + (e.amount || 0), 0)
    return { budget, spent, percent: (spent / budget) * 100, has_budget: true }
  } catch {
    return null
  }
}
