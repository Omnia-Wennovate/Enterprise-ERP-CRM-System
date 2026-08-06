'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Admin client — bypasses RLS for payroll write operations
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayrollEmployee {
  id: string
  employee_id: string | null
  first_name: string
  last_name: string | null
  email: string
  department: string | null
  position: string | null
  job_title: string | null
  basic_salary: number
  allowances: number
  employment_status: string | null
  commission_eligible: boolean
  payroll_type: string | null
  avatar_url: string | null
}

export interface PayrollRecord {
  id: string
  employee_id: string
  period_month: number
  period_year: number
  basic_salary: number
  allowances: number
  bonuses: number
  commission_amount: number
  deductions: number
  tax: number
  net_salary: number
  status: 'draft' | 'approved' | 'paid'
  approved_by: string | null
  paid_date: string | null
  payslip_url: string | null
  created_at: string
  updated_at: string
  // Joined
  employee?: PayrollEmployee
}

export interface PayrollKPIs {
  totalMonthlyPayroll: number
  totalEmployees: number
  employeesPaid: number
  pendingPayroll: number
  draftPayroll: number
  approvedPayroll: number
  budgetUsedPercent: number
  bonusTotal: number
  allowancesTotal: number
  deductionsTotal: number
  taxTotal: number
  overtimeCost: number
  commissionCost: number
  averageSalary: number
  highestSalary: number
  lowestSalary: number
  netPayroll: number
  grossPayroll: number
  payrollGrowth: number
  prevMonthPayroll: number
}

export interface DepartmentPayroll {
  department: string
  headcount: number
  totalPayroll: number
  averageSalary: number
  totalBonuses: number
  topEarner: string
  topEarnerSalary: number
}

export interface PayrollInsight {
  type: 'positive' | 'warning' | 'info'
  message: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WORKING_DAYS = 22
const HOURS_PER_DAY = 8
const TAX_RATE = 0.15
const OVERTIME_MULTIPLIER = 1.5
const LATE_PENALTY_MULTIPLIER = 1.0

function getDailyRate(salary: number) {
  return salary / WORKING_DAYS
}

function getHourlyRate(salary: number) {
  return getDailyRate(salary) / HOURS_PER_DAY
}

// ─── Active Employees ─────────────────────────────────────────────────────────

export async function getActiveEmployees(): Promise<PayrollEmployee[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, employee_id, first_name, last_name, email, department, position,
      job_title, basic_salary, allowances, employment_status,
      commission_eligible, payroll_type, avatar_url, is_active
    `)
    .eq('is_active', true)
    .order('first_name')

  if (error) throw new Error(`Failed to fetch employees: ${error.message}`)
  return (data || []) as PayrollEmployee[]
}

// ─── Get Payroll for Period ───────────────────────────────────────────────────

export async function getPayrollByPeriod(
  month: number,
  year: number
): Promise<PayrollRecord[]> {
  const supabase = getAdminClient()

  const { data: payrollData, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('period_month', month)
    .eq('period_year', year)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch payroll: ${error.message}`)
  if (!payrollData || payrollData.length === 0) return []

  // Join with employee profiles
  const employeeIds = payrollData.map((p) => p.employee_id)
  const { data: employees } = await supabase
    .from('profiles')
    .select(`
      id, employee_id, first_name, last_name, email, department, position,
      job_title, basic_salary, allowances, employment_status,
      commission_eligible, payroll_type, avatar_url, is_active
    `)
    .in('id', employeeIds)

  const empMap = new Map((employees || []).map((e) => [e.id, e]))

  return payrollData.map((p) => ({
    ...p,
    employee: empMap.get(p.employee_id),
  })) as PayrollRecord[]
}

// ─── Payroll History ──────────────────────────────────────────────────────────

export async function getPayrollHistory(limit = 12): Promise<{ month: number; year: number; total: number; count: number; status: string }[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('payroll')
    .select('period_month, period_year, net_salary, status')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(limit * 20) // Fetch more to group

  if (error || !data) return []

  // Group by month/year
  const grouped = new Map<string, { month: number; year: number; total: number; count: number; statuses: string[] }>()
  for (const row of data) {
    const key = `${row.period_year}-${row.period_month}`
    if (!grouped.has(key)) {
      grouped.set(key, { month: row.period_month, year: row.period_year, total: 0, count: 0, statuses: [] })
    }
    const g = grouped.get(key)!
    g.total += Number(row.net_salary) || 0
    g.count++
    g.statuses.push(row.status)
  }

  return Array.from(grouped.values())
    .slice(0, limit)
    .map((g) => ({
      month: g.month,
      year: g.year,
      total: g.total,
      count: g.count,
      status: g.statuses.every((s) => s === 'paid') ? 'paid' : g.statuses.some((s) => s === 'approved') ? 'approved' : 'draft',
    }))
}

// ─── Generate Payroll ─────────────────────────────────────────────────────────

export async function generatePayrollForPeriod(
  month: number,
  year: number,
  forceRegenerate = false
): Promise<{ success: boolean; message: string; count: number }> {
  const supabase = getAdminClient()

  // 1. Check for existing payroll
  const { data: existing } = await supabase
    .from('payroll')
    .select('id')
    .eq('period_month', month)
    .eq('period_year', year)
    .limit(1)

  if (existing && existing.length > 0 && !forceRegenerate) {
    return {
      success: false,
      message: `Payroll already generated for ${getMonthName(month)} ${year}. Enable force regenerate to override.`,
      count: 0,
    }
  }

  // 2. Get all active employees
  const { data: employees, error: empError } = await supabase
    .from('profiles')
    .select(`
      id, first_name, last_name, basic_salary, allowances,
      employment_status, commission_eligible, is_active
    `)
    .eq('is_active', true)

  if (empError || !employees || employees.length === 0) {
    return { success: false, message: 'No active employees found.', count: 0 }
  }

  // 3. Date range for the period
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

  const employeeIds = employees.map((e) => e.id)

  // 4. Fetch attendance for the period
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('employee_id, overtime_minutes, late_minutes, status')
    .in('employee_id', employeeIds)
    .gte('date', startDate)
    .lte('date', endDate)

  // 5. Fetch approved unpaid leave
  const { data: leaveTypesData } = await supabase
    .from('leave_types')
    .select('id, is_paid')

  const unpaidLeaveTypeIds = (leaveTypesData || [])
    .filter((lt) => !lt.is_paid)
    .map((lt) => lt.id)

  const { data: leaveData } = await supabase
    .from('leave_requests')
    .select('employee_id, days_requested, leave_type_id, status')
    .in('employee_id', employeeIds)
    .in('status', ['approved', 'hr_approved'])
    .gte('start_date', startDate)
    .lte('end_date', endDate)

  // 6. Fetch commissions for the period (agent_id field)
  const { data: commissionsData } = await supabase
    .from('commissions')
    .select('agent_id, commission_amount, period_month, period_year')
    .in('agent_id', employeeIds)
    .eq('period_month', month)
    .eq('period_year', year)

  // 7. Fetch performance bonuses
  const { data: perfData } = await supabase
    .from('performance_reviews')
    .select('employee_id, kpi_score, achievement_percent')
    .in('employee_id', employeeIds)
    .eq('period_month', month)
    .eq('period_year', year)

  // 8. Build lookup maps
  const attendanceMap = new Map<string, { overtime: number; late: number }>()
  for (const a of attendanceData || []) {
    const existing = attendanceMap.get(a.employee_id) || { overtime: 0, late: 0 }
    attendanceMap.set(a.employee_id, {
      overtime: existing.overtime + (Number(a.overtime_minutes) || 0),
      late: existing.late + (Number(a.late_minutes) || 0),
    })
  }

  const commissionMap = new Map<string, number>()
  for (const c of commissionsData || []) {
    const existing = commissionMap.get(c.agent_id) || 0
    commissionMap.set(c.agent_id, existing + (Number(c.commission_amount) || 0))
  }

  const unpaidLeaveMap = new Map<string, number>()
  for (const lr of leaveData || []) {
    if (unpaidLeaveTypeIds.includes(lr.leave_type_id)) {
      const existing = unpaidLeaveMap.get(lr.employee_id) || 0
      unpaidLeaveMap.set(lr.employee_id, existing + (Number(lr.days_requested) || 0))
    }
  }

  const perfMap = new Map<string, { kpi_score: number; achievement_percent: number }>()
  for (const p of perfData || []) {
    perfMap.set(p.employee_id, {
      kpi_score: Number(p.kpi_score) || 0,
      achievement_percent: Number(p.achievement_percent) || 0,
    })
  }

  // 9. Compute payroll per employee
  const payrollRows = employees.map((emp) => {
    const basicSalary = Number(emp.basic_salary) || 0
    const allowances = Number(emp.allowances) || 0
    const hourlyRate = getHourlyRate(basicSalary)
    const dailyRate = getDailyRate(basicSalary)

    const att = attendanceMap.get(emp.id) || { overtime: 0, late: 0 }
    const overtimePay = (att.overtime / 60) * hourlyRate * OVERTIME_MULTIPLIER
    const latePenalty = (att.late / 60) * hourlyRate * LATE_PENALTY_MULTIPLIER

    const commissionAmount = commissionMap.get(emp.id) || 0
    const unpaidLeaveDays = unpaidLeaveMap.get(emp.id) || 0
    const unpaidLeaveDeduction = unpaidLeaveDays * dailyRate

    // Bonus: 5% of basic if achievement_percent >= 100, prorated otherwise
    const perf = perfMap.get(emp.id)
    const bonusMultiplier = perf ? Math.min(perf.achievement_percent / 100, 1.5) : 0
    const bonuses = basicSalary > 0 && bonusMultiplier > 0 ? basicSalary * 0.05 * bonusMultiplier : 0

    const gross = basicSalary + allowances + overtimePay + commissionAmount + bonuses
    const tax = gross * TAX_RATE
    const deductions = latePenalty + unpaidLeaveDeduction
    const netSalary = gross - tax - deductions

    return {
      employee_id: emp.id,
      period_month: month,
      period_year: year,
      basic_salary: Math.round(basicSalary * 100) / 100,
      allowances: Math.round(allowances * 100) / 100,
      bonuses: Math.round(bonuses * 100) / 100,
      commission_amount: Math.round(commissionAmount * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      status: 'draft' as const,
    }
  })

  // 10. Delete existing and insert fresh (if force regenerate)
  if (forceRegenerate && existing && existing.length > 0) {
    await supabase.from('payroll').delete().eq('period_month', month).eq('period_year', year)
  }

  // 11. Upsert payroll records
  const { error: insertError } = await supabase.from('payroll').insert(payrollRows)

  if (insertError) {
    return { success: false, message: `Failed to generate payroll: ${insertError.message}`, count: 0 }
  }

  return {
    success: true,
    message: `Successfully generated payroll for ${getMonthName(month)} ${year} — ${payrollRows.length} employees processed.`,
    count: payrollRows.length,
  }
}

// ─── Update Payroll Status ────────────────────────────────────────────────────

export async function updatePayrollStatus(
  employeeId: string,
  month: number,
  year: number,
  status: 'draft' | 'approved' | 'paid',
  approvedBy?: string
): Promise<void> {
  const supabase = getAdminClient()
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'approved' && approvedBy) updates.approved_by = approvedBy
  if (status === 'paid') updates.paid_date = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('payroll')
    .update(updates)
    .eq('employee_id', employeeId)
    .eq('period_month', month)
    .eq('period_year', year)

  if (error) throw new Error(`Failed to update payroll status: ${error.message}`)
}

// ─── Bulk Update Status ───────────────────────────────────────────────────────

export async function bulkUpdatePayrollStatus(
  month: number,
  year: number,
  status: 'approved' | 'paid'
): Promise<void> {
  const supabase = getAdminClient()
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'paid') updates.paid_date = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('payroll')
    .update(updates)
    .eq('period_month', month)
    .eq('period_year', year)

  if (error) throw new Error(`Failed to bulk update payroll: ${error.message}`)
}

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getPayrollKPIs(month: number, year: number): Promise<PayrollKPIs> {
  const supabase = getAdminClient()

  const [currentPayroll, prevPayroll, allEmployees] = await Promise.all([
    supabase.from('payroll').select('*').eq('period_month', month).eq('period_year', year),
    supabase.from('payroll').select('net_salary').eq('period_month', month === 1 ? 12 : month - 1).eq('period_year', month === 1 ? year - 1 : year),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const records = currentPayroll.data || []
  const prevRecords = prevPayroll.data || []

  const totalMonthlyPayroll = records.reduce((s, r) => s + Number(r.net_salary), 0)
  const prevMonthPayroll = prevRecords.reduce((s, r) => s + Number(r.net_salary), 0)
  const payrollGrowth = prevMonthPayroll > 0 ? ((totalMonthlyPayroll - prevMonthPayroll) / prevMonthPayroll) * 100 : 0

  const netSalaries = records.map((r) => Number(r.net_salary)).filter((s) => s > 0)
  const grossValues = records.map((r) => Number(r.basic_salary) + Number(r.allowances) + Number(r.bonuses) + Number(r.commission_amount))

  return {
    totalMonthlyPayroll,
    totalEmployees: allEmployees.count || 0,
    employeesPaid: records.filter((r) => r.status === 'paid').length,
    pendingPayroll: records.filter((r) => r.status === 'draft').length,
    draftPayroll: records.filter((r) => r.status === 'draft').length,
    approvedPayroll: records.filter((r) => r.status === 'approved').length,
    budgetUsedPercent: 0, // No budget table — set to 0
    bonusTotal: records.reduce((s, r) => s + Number(r.bonuses), 0),
    allowancesTotal: records.reduce((s, r) => s + Number(r.allowances), 0),
    deductionsTotal: records.reduce((s, r) => s + Number(r.deductions), 0),
    taxTotal: records.reduce((s, r) => s + Number(r.tax), 0),
    overtimeCost: 0, // Embedded in net_salary
    commissionCost: records.reduce((s, r) => s + Number(r.commission_amount), 0),
    averageSalary: netSalaries.length > 0 ? netSalaries.reduce((s, v) => s + v, 0) / netSalaries.length : 0,
    highestSalary: netSalaries.length > 0 ? Math.max(...netSalaries) : 0,
    lowestSalary: netSalaries.length > 0 ? Math.min(...netSalaries) : 0,
    netPayroll: totalMonthlyPayroll,
    grossPayroll: grossValues.reduce((s, v) => s + v, 0),
    payrollGrowth,
    prevMonthPayroll,
  }
}

// ─── Department Breakdown ─────────────────────────────────────────────────────

export async function getDepartmentPayroll(month: number, year: number): Promise<DepartmentPayroll[]> {
  const supabase = getAdminClient()

  const { data: payroll } = await supabase
    .from('payroll')
    .select('employee_id, net_salary, bonuses')
    .eq('period_month', month)
    .eq('period_year', year)

  if (!payroll || payroll.length === 0) return []

  const empIds = payroll.map((p) => p.employee_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, department')
    .in('id', empIds)

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]))

  const deptMap = new Map<string, { count: number; total: number; bonuses: number; earners: { name: string; salary: number }[] }>()

  for (const p of payroll) {
    const emp = profileMap.get(p.employee_id)
    const dept = emp?.department || 'Unassigned'
    const salary = Number(p.net_salary) || 0
    const bonus = Number(p.bonuses) || 0

    if (!deptMap.has(dept)) deptMap.set(dept, { count: 0, total: 0, bonuses: 0, earners: [] })
    const d = deptMap.get(dept)!
    d.count++
    d.total += salary
    d.bonuses += bonus
    d.earners.push({ name: `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim(), salary })
  }

  return Array.from(deptMap.entries()).map(([dept, d]) => {
    const topEarner = d.earners.sort((a, b) => b.salary - a.salary)[0]
    return {
      department: dept,
      headcount: d.count,
      totalPayroll: d.total,
      averageSalary: d.count > 0 ? d.total / d.count : 0,
      totalBonuses: d.bonuses,
      topEarner: topEarner?.name || '—',
      topEarnerSalary: topEarner?.salary || 0,
    }
  }).sort((a, b) => b.totalPayroll - a.totalPayroll)
}

// ─── Monthly Trend ────────────────────────────────────────────────────────────

export async function getMonthlyTrend(monthsBack = 6): Promise<{ label: string; total: number; month: number; year: number }[]> {
  const supabase = getAdminClient()
  const results = []

  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth() + 1
    const y = d.getFullYear()

    const { data } = await supabase
      .from('payroll')
      .select('net_salary')
      .eq('period_month', m)
      .eq('period_year', y)

    results.push({
      label: `${getMonthName(m).slice(0, 3)} ${y}`,
      total: (data || []).reduce((s, r) => s + Number(r.net_salary), 0),
      month: m,
      year: y,
    })
  }

  return results
}

// ─── Payroll Insights ─────────────────────────────────────────────────────────

export async function getPayrollInsights(month: number, year: number): Promise<PayrollInsight[]> {
  const supabase = getAdminClient()
  const insights: PayrollInsight[] = []

  const { data: current } = await supabase.from('payroll').select('*').eq('period_month', month).eq('period_year', year)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const { data: prev } = await supabase.from('payroll').select('net_salary').eq('period_month', prevMonth).eq('period_year', prevYear)

  if (!current || current.length === 0) {
    insights.push({ type: 'info', message: `No payroll generated yet for ${getMonthName(month)} ${year}.` })
    return insights
  }

  const currentTotal = current.reduce((s, r) => s + Number(r.net_salary), 0)
  const prevTotal = (prev || []).reduce((s, r) => s + Number(r.net_salary), 0)

  if (prevTotal > 0) {
    const change = ((currentTotal - prevTotal) / prevTotal) * 100
    if (Math.abs(change) > 0.01) {
      insights.push({
        type: change > 0 ? 'warning' : 'positive',
        message: `Payroll ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to ${getMonthName(prevMonth)}.`,
      })
    }
  }

  const bonusTotal = current.reduce((s, r) => s + Number(r.bonuses), 0)
  if (bonusTotal > 0) {
    insights.push({ type: 'positive', message: `Total bonuses for ${getMonthName(month)}: $${bonusTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })}.` })
  }

  const commissionTotal = current.reduce((s, r) => s + Number(r.commission_amount), 0)
  if (commissionTotal > 0) {
    insights.push({ type: 'info', message: `Commissions contributed $${commissionTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} to this month's payroll.` })
  }

  const taxTotal = current.reduce((s, r) => s + Number(r.tax), 0)
  const grossTotal = current.reduce((s, r) => s + Number(r.basic_salary) + Number(r.allowances) + Number(r.bonuses) + Number(r.commission_amount), 0)
  if (grossTotal > 0) {
    insights.push({ type: 'info', message: `Tax withholdings total $${taxTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${((taxTotal / grossTotal) * 100).toFixed(1)}% effective rate).` })
  }

  const paidCount = current.filter((r) => r.status === 'paid').length
  if (paidCount === current.length) {
    insights.push({ type: 'positive', message: `All ${paidCount} employees have been paid for ${getMonthName(month)} ${year}.` })
  } else {
    const unpaidCount = current.length - paidCount
    insights.push({ type: 'warning', message: `${unpaidCount} employee${unpaidCount > 1 ? 's' : ''} still pending payment for ${getMonthName(month)}.` })
  }

  return insights
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString('en-US', { month: 'long' })
}
