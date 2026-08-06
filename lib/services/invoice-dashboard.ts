'use server'

import { createClient } from '@/lib/supabase/server'

// ── Period helpers ────────────────────────────────────────────────────────────

export type PeriodType = 'weekly' | 'monthly' | '6month' | 'yearly'

export interface DateRange { start: string; end: string }

function getPeriodRanges(period: PeriodType): { current: DateRange; previous: DateRange; label: string; compareLabel: string } {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'weekly') {
    const dow = now.getDay() // 0=Sun
    const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7))
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7)
    const prevSunday = new Date(sunday); prevSunday.setDate(sunday.getDate() - 7)
    return {
      current: { start: fmt(monday), end: fmt(sunday) },
      previous: { start: fmt(prevMonday), end: fmt(prevSunday) },
      label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      compareLabel: 'vs last week',
    }
  }
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      current: { start: fmt(start), end: fmt(end) },
      previous: { start: fmt(prevStart), end: fmt(prevEnd) },
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      compareLabel: 'vs last month',
    }
  }
  if (period === '6month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0)
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 5, 1)
    return {
      current: { start: fmt(start), end: fmt(end) },
      previous: { start: fmt(prevStart), end: fmt(prevEnd) },
      label: 'Last 6 Months',
      compareLabel: 'vs prior 6 months',
    }
  }
  // yearly
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  const prevStart = new Date(now.getFullYear() - 1, 0, 1)
  const prevEnd = new Date(now.getFullYear() - 1, 11, 31)
  return {
    current: { start: fmt(start), end: fmt(end) },
    previous: { start: fmt(prevStart), end: fmt(prevEnd) },
    label: String(now.getFullYear()),
    compareLabel: 'vs last year',
  }
}

// ── KPI types ────────────────────────────────────────────────────────────────

export interface InvoiceKPIs {
  totalRevenue: number
  totalInvoices: number
  draftCount: number
  sentCount: number
  paidCount: number
  partiallyPaidCount: number
  overdueCount: number
  cancelledCount: number
  outstandingBalance: number
  avgInvoiceValue: number
  collectionRate: number
  taxCollected: number
  expectedRevenue: number
  avgPaymentDays: number
  refundAmount: number
  // period comparison
  prevTotalRevenue: number
  prevPaidCount: number
  prevOutstandingBalance: number
  prevCollectionRate: number
  periodLabel: string
  compareLabel: string
}

export interface InvoiceChartData {
  revenueByMonth: Array<{ month: string; revenue: number; invoices: number }>
  byStatus: Array<{ status: string; count: number; amount: number }>
  byCurrency: Array<{ currency: string; count: number; amount: number }>
  paymentMethods: Array<{ method: string; amount: number; count: number }>
  agingBuckets: AgingBucket[]
  cashFlow: Array<{ month: string; inflow: number; outstanding: number }>
  revenueForDay?: Array<{ day: string; revenue: number }> // for weekly view
}

export interface AgingBucket {
  bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+'
  label: string
  totalAmount: number
  invoiceCount: number
  color: string
}

export interface CustomerLeaderboardEntry {
  customerId: string
  customerName: string
  totalRevenue: number
  invoiceCount: number
  avgPaymentDays: number
  outstanding: number
  collectionRate: number
  paidCount: number
}

export interface InvoiceHealthScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  color: string
  factors: { label: string; score: number; weight: number; description: string }[]
  recommendations: string[]
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  invoiceNumber?: string
  amount?: number
  createdAt: string
}

export interface InvoiceWithRelations {
  id: string
  invoice_number: string
  booking_id?: string
  customer_id: string
  customer_name?: string
  booking_reference?: string
  amount: number
  tax: number
  discount: number
  total_amount: number
  status: string
  due_date: string
  issued_date: string
  currency: string
  exchange_rate: number
  priority: string
  tags: string[]
  quotation_id?: string
  is_recurring: boolean
  recurrence_frequency?: string
  approval_status: string
  created_by?: string
  created_at: string
  updated_at: string
  paid_amount?: number
  outstanding?: number
}

// ── Main KPI query (parameterized — one function for all 4 period views) ──────

export async function getInvoiceKPIs(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  periodLabel: string,
  compareLabel: string
): Promise<InvoiceKPIs> {
  const supabase = await createClient()

  // Current period invoices
  const { data: curr } = await supabase
    .from('invoices')
    .select('id, total_amount, amount, tax, status, issued_date, due_date, currency')
    .gte('issued_date', startDate)
    .lte('issued_date', endDate)

  const invoices = curr || []

  // Previous period invoices
  const { data: prev } = await supabase
    .from('invoices')
    .select('id, total_amount, status')
    .gte('issued_date', prevStartDate)
    .lte('issued_date', prevEndDate)

  const prevInvoices = prev || []

  // Payments for current period invoices
  const invoiceIds = invoices.map(i => i.id)
  const { data: payments } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount, payment_date, payment_method').in('invoice_id', invoiceIds)
    : { data: [] }
  const allPayments = payments || []

  // Refunds
  const { data: refunds } = await supabase
    .from('refunds')
    .select('refund_amount, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
  const refundTotal = (refunds || []).reduce((s, r) => s + (r.refund_amount || 0), 0)

  // Compute payment days
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  let totalPaymentDays = 0
  let paymentDaysCount = 0
  for (const inv of paidInvoices) {
    const p = allPayments.filter(pm => pm.invoice_id === inv.id)
    if (p.length > 0) {
      const lastPayment = p.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0]
      const days = Math.abs(Math.floor((new Date(lastPayment.payment_date).getTime() - new Date(inv.issued_date).getTime()) / 86400000))
      totalPaymentDays += days
      paymentDaysCount++
    }
  }

  // Aggregate current period
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0)
  const taxCollected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.tax || 0), 0)
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const draftCount = invoices.filter(i => i.status === 'draft').length
  const sentCount = invoices.filter(i => i.status === 'sent').length
  const partiallyPaidCount = invoices.filter(i => i.status === 'partially_paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const cancelledCount = invoices.filter(i => i.status === 'cancelled').length

  // Outstanding = sum of (total_amount - paid) for sent/partially_paid/overdue
  const outstandingInvoices = invoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))
  let outstandingBalance = 0
  for (const inv of outstandingInvoices) {
    const paid = allPayments.filter(p => p.invoice_id === inv.id).reduce((s, p) => s + p.amount, 0)
    outstandingBalance += Math.max(0, inv.total_amount - paid)
  }

  const totalInvoices = invoices.length
  const avgInvoiceValue = totalInvoices > 0 ? invoices.reduce((s, i) => s + i.total_amount, 0) / totalInvoices : 0
  const collectionRate = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 0
  const expectedRevenue = invoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.total_amount, 0)

  // Prev period aggregates
  const prevTotalRevenue = prevInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0)
  const prevPaidCount = prevInvoices.filter(i => i.status === 'paid').length
  const prevOutstandingBalance = prevInvoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total_amount, 0)
  const prevCollectionRate = prevInvoices.length > 0 ? (prevPaidCount / prevInvoices.length) * 100 : 0

  return {
    totalRevenue, totalInvoices, draftCount, sentCount, paidCount,
    partiallyPaidCount, overdueCount, cancelledCount,
    outstandingBalance, avgInvoiceValue, collectionRate,
    taxCollected, expectedRevenue,
    avgPaymentDays: paymentDaysCount > 0 ? Math.round(totalPaymentDays / paymentDaysCount) : 0,
    refundAmount: refundTotal,
    prevTotalRevenue, prevPaidCount, prevOutstandingBalance, prevCollectionRate,
    periodLabel, compareLabel,
  }
}

// ── Chart data ────────────────────────────────────────────────────────────────

export async function getInvoiceChartData(startDate: string, endDate: string): Promise<InvoiceChartData> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, tax, status, issued_date, currency')
    .gte('issued_date', startDate)
    .lte('issued_date', endDate)

  const all = invoices || []

  // Revenue by month
  const monthMap: Record<string, { revenue: number; invoices: number }> = {}
  for (const inv of all) {
    const m = inv.issued_date.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = { revenue: 0, invoices: 0 }
    if (inv.status === 'paid') monthMap[m].revenue += inv.total_amount
    monthMap[m].invoices++
  }
  const revenueByMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      ...v,
    }))

  // By status
  const statusMap: Record<string, { count: number; amount: number }> = {}
  for (const inv of all) {
    if (!statusMap[inv.status]) statusMap[inv.status] = { count: 0, amount: 0 }
    statusMap[inv.status].count++
    statusMap[inv.status].amount += inv.total_amount
  }
  const byStatus = Object.entries(statusMap).map(([status, v]) => ({ status, ...v }))

  // By currency
  const currMap: Record<string, { count: number; amount: number }> = {}
  for (const inv of all) {
    const c = inv.currency || 'USD'
    if (!currMap[c]) currMap[c] = { count: 0, amount: 0 }
    currMap[c].count++
    currMap[c].amount += inv.total_amount
  }
  const byCurrency = Object.entries(currMap).map(([currency, v]) => ({ currency, ...v }))

  // Payment methods
  const invoiceIds = all.map(i => i.id)
  const { data: payments } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount, payment_method, payment_date').in('invoice_id', invoiceIds)
    : { data: [] }
  const pmMap: Record<string, { amount: number; count: number }> = {}
  for (const p of payments || []) {
    const m = p.payment_method || 'Unknown'
    if (!pmMap[m]) pmMap[m] = { amount: 0, count: 0 }
    pmMap[m].amount += p.amount
    pmMap[m].count++
  }
  const paymentMethods = Object.entries(pmMap).map(([method, v]) => ({ method, ...v }))

  // Cash flow (monthly inflow vs outstanding)
  const cfMap: Record<string, { inflow: number; outstanding: number }> = {}
  for (const inv of all) {
    const m = inv.issued_date.slice(0, 7)
    if (!cfMap[m]) cfMap[m] = { inflow: 0, outstanding: 0 }
    if (inv.status === 'paid') cfMap[m].inflow += inv.total_amount
    if (['sent', 'partially_paid', 'overdue'].includes(inv.status)) cfMap[m].outstanding += inv.total_amount
  }
  const cashFlow = Object.entries(cfMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      ...v,
    }))

  // Aging buckets (all-time outstanding)
  const agingBuckets = await _getAgingBuckets(supabase)

  return { revenueByMonth, byStatus, byCurrency, paymentMethods, cashFlow, agingBuckets }
}

// ── Aging ─────────────────────────────────────────────────────────────────────

async function _getAgingBuckets(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AgingBucket[]> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, due_date, status')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  const { data: payments } = await supabase.from('payments').select('invoice_id, amount')

  const payMap: Record<string, number> = {}
  for (const p of payments || []) {
    payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount
  }

  const now = new Date()
  const buckets: Record<string, AgingBucket> = {
    current: { bucket: 'current', label: 'Current', totalAmount: 0, invoiceCount: 0, color: '#0d9488' },
    '1-30': { bucket: '1-30', label: '1–30 days', totalAmount: 0, invoiceCount: 0, color: '#f59e0b' },
    '31-60': { bucket: '31-60', label: '31–60 days', totalAmount: 0, invoiceCount: 0, color: '#f97316' },
    '61-90': { bucket: '61-90', label: '61–90 days', totalAmount: 0, invoiceCount: 0, color: '#ef4444' },
    '90+': { bucket: '90+', label: '90+ days', totalAmount: 0, invoiceCount: 0, color: '#991b1b' },
  }

  for (const inv of invoices || []) {
    const outstanding = Math.max(0, inv.total_amount - (payMap[inv.id] || 0))
    if (outstanding <= 0) continue
    const daysOverdue = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000)
    let key: string
    if (daysOverdue <= 0) key = 'current'
    else if (daysOverdue <= 30) key = '1-30'
    else if (daysOverdue <= 60) key = '31-60'
    else if (daysOverdue <= 90) key = '61-90'
    else key = '90+'
    buckets[key].totalAmount += outstanding
    buckets[key].invoiceCount++
  }

  return Object.values(buckets)
}

export async function getAgingBuckets(): Promise<AgingBucket[]> {
  const supabase = await createClient()
  return _getAgingBuckets(supabase)
}

// ── Customer leaderboard ──────────────────────────────────────────────────────

export async function getCustomerLeaderboard(startDate: string, endDate: string): Promise<CustomerLeaderboardEntry[]> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, customer_id, total_amount, status, issued_date, due_date')
    .gte('issued_date', startDate)
    .lte('issued_date', endDate)

  const all = invoices || []
  if (all.length === 0) return []

  // Get customer names
  const customerIds = [...new Set(all.map(i => i.customer_id))]
  const { data: customers } = await supabase
    .from('customers')
    .select('id, company_name')
    .in('id', customerIds)
  const customerMap: Record<string, string> = {}
  for (const c of customers || []) customerMap[c.id] = c.company_name || c.id

  // Get payments
  const invoiceIds = all.map(i => i.id)
  const { data: payments } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount, payment_date').in('invoice_id', invoiceIds)
    : { data: [] }

  const payMap: Record<string, { total: number; date: string }> = {}
  for (const p of payments || []) {
    if (!payMap[p.invoice_id]) payMap[p.invoice_id] = { total: 0, date: p.payment_date }
    payMap[p.invoice_id].total += p.amount
    if (p.payment_date > payMap[p.invoice_id].date) payMap[p.invoice_id].date = p.payment_date
  }

  // Group by customer
  const custMap: Record<string, CustomerLeaderboardEntry> = {}
  for (const inv of all) {
    const cid = inv.customer_id
    if (!custMap[cid]) {
      custMap[cid] = {
        customerId: cid,
        customerName: customerMap[cid] || cid,
        totalRevenue: 0, invoiceCount: 0, avgPaymentDays: 0,
        outstanding: 0, collectionRate: 0, paidCount: 0,
      }
    }
    const e = custMap[cid]
    e.invoiceCount++
    if (inv.status === 'paid') {
      e.totalRevenue += inv.total_amount
      e.paidCount++
      const paid = payMap[inv.id]
      if (paid) {
        const days = Math.abs(Math.floor((new Date(paid.date).getTime() - new Date(inv.issued_date).getTime()) / 86400000))
        e.avgPaymentDays = ((e.avgPaymentDays * (e.paidCount - 1)) + days) / e.paidCount
      }
    } else if (['sent', 'partially_paid', 'overdue'].includes(inv.status)) {
      e.outstanding += inv.total_amount - (payMap[inv.id]?.total || 0)
    }
  }

  return Object.values(custMap)
    .map(e => ({ ...e, avgPaymentDays: Math.round(e.avgPaymentDays), collectionRate: e.invoiceCount > 0 ? (e.paidCount / e.invoiceCount) * 100 : 0 }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10)
}

// ── Health score ──────────────────────────────────────────────────────────────

export async function getInvoiceHealthScore(): Promise<InvoiceHealthScore> {
  const supabase = await createClient()
  const { data: all } = await supabase.from('invoices').select('id, total_amount, status, due_date, issued_date')
  const invoices = all || []
  const total = invoices.length || 1

  const paid = invoices.filter(i => i.status === 'paid').length
  const overdue = invoices.filter(i => i.status === 'overdue').length
  const cancelled = invoices.filter(i => i.status === 'cancelled').length
  const outstanding = invoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total_amount, 0)
  const totalVal = invoices.reduce((s, i) => s + i.total_amount, 0) || 1

  const collectionRate = (paid / total) * 100
  const overduePct = (overdue / total) * 100
  const outstandingPct = (outstanding / totalVal) * 100
  const cancelledPct = (cancelled / total) * 100

  const { data: payments } = await supabase.from('payments').select('invoice_id, amount, payment_date')
  const payMap: Record<string, string> = {}
  for (const p of payments || []) payMap[p.invoice_id] = p.payment_date
  let totalDays = 0, daysCount = 0
  for (const inv of invoices.filter(i => i.status === 'paid')) {
    if (payMap[inv.id]) {
      totalDays += Math.abs(Math.floor((new Date(payMap[inv.id]).getTime() - new Date(inv.issued_date).getTime()) / 86400000))
      daysCount++
    }
  }
  const avgPayDays = daysCount > 0 ? totalDays / daysCount : 0

  const factors = [
    { label: 'Collection Rate', score: Math.min(100, collectionRate), weight: 35, description: `${collectionRate.toFixed(1)}% of invoices collected` },
    { label: 'Overdue Rate', score: Math.max(0, 100 - overduePct * 3), weight: 25, description: `${overduePct.toFixed(1)}% of invoices overdue` },
    { label: 'Outstanding Balance', score: Math.max(0, 100 - outstandingPct * 1.5), weight: 20, description: `${outstandingPct.toFixed(1)}% of value outstanding` },
    { label: 'Payment Speed', score: Math.max(0, 100 - avgPayDays * 1.5), weight: 15, description: avgPayDays > 0 ? `Avg ${Math.round(avgPayDays)} days to pay` : 'No payment data' },
    { label: 'Cancellation Rate', score: Math.max(0, 100 - cancelledPct * 4), weight: 5, description: `${cancelledPct.toFixed(1)}% cancelled` },
  ]

  const score = Math.round(factors.reduce((s, f) => s + (f.score * f.weight) / 100, 0))
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'
  const color = score >= 85 ? '#0d9488' : score >= 70 ? '#3b82f6' : score >= 55 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'

  const recommendations: string[] = []
  if (overduePct > 10) recommendations.push(`${overdue} overdue invoice${overdue !== 1 ? 's' : ''} — send reminders immediately`)
  if (collectionRate < 80) recommendations.push('Collection rate below 80% — review credit terms and follow-up cadence')
  if (avgPayDays > 30) recommendations.push(`Average payment is ${Math.round(avgPayDays)} days — consider early payment discounts`)
  if (cancelledPct > 5) recommendations.push('High cancellation rate — investigate root causes with sales team')
  if (outstandingPct > 40) recommendations.push('Over 40% of revenue is outstanding — prioritize collections this week')
  if (recommendations.length === 0) recommendations.push('All metrics are healthy — maintain current collection practices')

  return { score, grade, color, factors, recommendations }
}

// ── Activity feed ─────────────────────────────────────────────────────────────

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit)

  const { data: payments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  const items: ActivityItem[] = []

  // Get invoice numbers for payments
  const invIds = [...new Set((payments || []).map(p => p.invoice_id))]
  const { data: invNums } = invIds.length > 0
    ? await supabase.from('invoices').select('id, invoice_number').in('id', invIds)
    : { data: [] }
  const invNumMap: Record<string, string> = {}
  for (const i of invNums || []) invNumMap[i.id] = i.invoice_number

  for (const inv of invoices || []) {
    items.push({
      id: `inv-${inv.id}`,
      type: inv.status === 'paid' ? 'paid' : inv.status === 'sent' ? 'sent' : inv.status === 'overdue' ? 'overdue' : 'created',
      description: `Invoice ${inv.invoice_number} ${inv.status === 'draft' ? 'created' : inv.status}`,
      invoiceNumber: inv.invoice_number,
      amount: inv.total_amount,
      createdAt: inv.updated_at || inv.created_at,
    })
  }

  for (const p of payments || []) {
    items.push({
      id: `pay-${p.id}`,
      type: 'payment',
      description: `Payment of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.amount)} received for ${invNumMap[p.invoice_id] || 'invoice'}`,
      invoiceNumber: invNumMap[p.invoice_id],
      amount: p.amount,
      createdAt: p.created_at,
    })
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
}

// ── Invoices with relations ───────────────────────────────────────────────────

export interface InvoiceFilter {
  status?: string
  search?: string
  currency?: string
  priority?: string
  startDate?: string
  endDate?: string
  amountMin?: number
  amountMax?: number
  limit?: number
  offset?: number
  overdueOnly?: boolean
}

export async function getInvoicesWithRelations(filter: InvoiceFilter = {}): Promise<{ data: InvoiceWithRelations[]; total: number }> {
  const supabase = await createClient()
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0

  let query = supabase
    .from('invoices')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status)
  if (filter.currency) query = query.eq('currency', filter.currency)
  if (filter.priority) query = query.eq('priority', filter.priority)
  if (filter.startDate) query = query.gte('issued_date', filter.startDate)
  if (filter.endDate) query = query.lte('issued_date', filter.endDate)
  if (filter.amountMin) query = query.gte('total_amount', filter.amountMin)
  if (filter.amountMax) query = query.lte('total_amount', filter.amountMax)
  if (filter.overdueOnly) query = query.eq('status', 'overdue')
  if (filter.search) {
    query = query.ilike('invoice_number', `%${filter.search}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)

  const invoices = data || []

  // Enrich with customer names
  const customerIds = [...new Set(invoices.map(i => i.customer_id).filter(Boolean))]
  const { data: customers } = customerIds.length > 0
    ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
    : { data: [] }
  const customerMap: Record<string, string> = {}
  for (const c of customers || []) customerMap[c.id] = c.company_name || ''

  // Enrich with booking references
  const bookingIds = [...new Set(invoices.map(i => i.booking_id).filter(Boolean))]
  const { data: bookings } = bookingIds.length > 0
    ? await supabase.from('bookings').select('id, booking_reference').in('id', bookingIds)
    : { data: [] }
  const bookingMap: Record<string, string> = {}
  for (const b of bookings || []) bookingMap[b.id] = b.booking_reference || ''

  // Payments per invoice
  const invoiceIds = invoices.map(i => i.id)
  const { data: payments } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount').in('invoice_id', invoiceIds)
    : { data: [] }
  const payMap: Record<string, number> = {}
  for (const p of payments || []) payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount

  return {
    data: invoices.map(inv => ({
      ...inv,
      customer_name: customerMap[inv.customer_id] || '',
      booking_reference: inv.booking_id ? bookingMap[inv.booking_id] || '' : '',
      paid_amount: payMap[inv.id] || 0,
      outstanding: Math.max(0, inv.total_amount - (payMap[inv.id] || 0)),
    })),
    total: count || 0,
  }
}

// ── Revenue intelligence ──────────────────────────────────────────────────────

export interface RevenueIntelligence {
  highestRevenueMonth: string
  largestCustomer: string
  fastestPayingCustomer: string
  slowestPayingCustomer: string
  mostOverdueCustomer: string
  avgInvoiceValue: number
}

export async function getRevenueIntelligence(): Promise<RevenueIntelligence> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, customer_id, total_amount, status, issued_date')

  const { data: payments } = await supabase
    .from('payments')
    .select('invoice_id, amount, payment_date')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, company_name')

  const custMap: Record<string, string> = {}
  for (const c of customers || []) custMap[c.id] = c.company_name || c.id

  const payMap: Record<string, { total: number; date: string }> = {}
  for (const p of payments || []) {
    if (!payMap[p.invoice_id]) payMap[p.invoice_id] = { total: 0, date: p.payment_date }
    payMap[p.invoice_id].total += p.amount
  }

  const all = invoices || []

  // Highest revenue month
  const monthRevMap: Record<string, number> = {}
  for (const inv of all.filter(i => i.status === 'paid')) {
    const m = inv.issued_date.slice(0, 7)
    monthRevMap[m] = (monthRevMap[m] || 0) + inv.total_amount
  }
  const highestRevenueMonth = Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0]
    ? new Date(Object.entries(monthRevMap).sort((a, b) => b[1] - a[1])[0][0] + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '-'

  // Customer revenue
  const custRevMap: Record<string, number> = {}
  for (const inv of all.filter(i => i.status === 'paid')) {
    custRevMap[inv.customer_id] = (custRevMap[inv.customer_id] || 0) + inv.total_amount
  }
  const largestCustomerId = Object.entries(custRevMap).sort((a, b) => b[1] - a[1])[0]?.[0]
  const largestCustomer = largestCustomerId ? custMap[largestCustomerId] || largestCustomerId : '-'

  // Payment speed by customer
  const custDaysMap: Record<string, number[]> = {}
  for (const inv of all.filter(i => i.status === 'paid')) {
    if (payMap[inv.id]) {
      const days = Math.abs(Math.floor((new Date(payMap[inv.id].date).getTime() - new Date(inv.issued_date).getTime()) / 86400000))
      if (!custDaysMap[inv.customer_id]) custDaysMap[inv.customer_id] = []
      custDaysMap[inv.customer_id].push(days)
    }
  }
  const custAvgDays = Object.entries(custDaysMap).map(([id, days]) => ({
    id, avg: days.reduce((s, d) => s + d, 0) / days.length
  }))
  custAvgDays.sort((a, b) => a.avg - b.avg)
  const fastestPayingCustomer = custAvgDays[0] ? custMap[custAvgDays[0].id] || custAvgDays[0].id : '-'
  const slowestPayingCustomer = custAvgDays[custAvgDays.length - 1] ? custMap[custAvgDays[custAvgDays.length - 1].id] || custAvgDays[custAvgDays.length - 1].id : '-'

  // Most overdue customer
  const custOverdueMap: Record<string, number> = {}
  for (const inv of all.filter(i => i.status === 'overdue')) {
    custOverdueMap[inv.customer_id] = (custOverdueMap[inv.customer_id] || 0) + inv.total_amount
  }
  const mostOverdueId = Object.entries(custOverdueMap).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostOverdueCustomer = mostOverdueId ? custMap[mostOverdueId] || mostOverdueId : '-'

  const avgInvoiceValue = all.length > 0 ? all.reduce((s, i) => s + i.total_amount, 0) / all.length : 0

  return { highestRevenueMonth, largestCustomer, fastestPayingCustomer, slowestPayingCustomer, mostOverdueCustomer, avgInvoiceValue }
}

// ── Board report data ─────────────────────────────────────────────────────────

export interface BoardReportData {
  title: string
  period: string
  generatedBy: string
  generatedAt: string
  summary: string
  kpis: Array<{ label: string; value: string; change: string }>
  healthScore: number
  healthGrade: string
  recommendations: string[]
}

export async function generateBoardReportData(
  kpis: InvoiceKPIs,
  health: InvoiceHealthScore,
  periodLabel: string
): Promise<BoardReportData> {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user

  const { data: profile } = user ? await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single() : { data: null }
  const generatedBy = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user?.email || 'System' : user?.email || 'System'

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const pct = (n: number) => `${n.toFixed(1)}%`

  const revChange = kpis.prevTotalRevenue > 0
    ? ((kpis.totalRevenue - kpis.prevTotalRevenue) / kpis.prevTotalRevenue) * 100
    : 0

  const summary = [
    `Revenue for ${periodLabel} reached ${fmt(kpis.totalRevenue)}${revChange !== 0 ? `, ${revChange > 0 ? 'up' : 'down'} ${Math.abs(revChange).toFixed(1)}% ${kpis.compareLabel}` : ''}.`,
    `Collection rate is ${pct(kpis.collectionRate)}${kpis.collectionRate >= 85 ? ' — strong performance' : ' — requires attention'}.`,
    kpis.overdueCount > 0 ? `${kpis.overdueCount} invoice${kpis.overdueCount !== 1 ? 's' : ''} are overdue with ${fmt(kpis.outstandingBalance)} outstanding.` : 'No overdue invoices.',
    `Invoice health score is ${health.score}/100 (Grade ${health.grade}).`,
  ].join(' ')

  return {
    title: `Invoice & Revenue Board Report`,
    period: periodLabel,
    generatedBy,
    generatedAt: new Date().toISOString(),
    summary,
    kpis: [
      { label: 'Total Revenue', value: fmt(kpis.totalRevenue), change: revChange > 0 ? `+${revChange.toFixed(1)}%` : `${revChange.toFixed(1)}%` },
      { label: 'Total Invoices', value: String(kpis.totalInvoices), change: '' },
      { label: 'Collection Rate', value: pct(kpis.collectionRate), change: '' },
      { label: 'Outstanding Balance', value: fmt(kpis.outstandingBalance), change: '' },
      { label: 'Overdue Invoices', value: String(kpis.overdueCount), change: '' },
    ],
    healthScore: health.score,
    healthGrade: health.grade,
    recommendations: health.recommendations,
  }
}
