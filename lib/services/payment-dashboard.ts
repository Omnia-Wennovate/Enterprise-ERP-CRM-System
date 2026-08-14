'use server'

import { createClient } from '@/lib/supabase/server'
import type {
  PaymentKPIs,
  PaymentChartData,
  PaymentAgingBucket,
  PaymentWithRelations,
  PaymentFilter,
  CollectionHealthScore,
  CashFlowProjection,
  PaymentMethodReliability,
  CollectionsIntelligence,
} from '@/types/finance'

// ── Period helpers ────────────────────────────────────────────────────────────

export type PaymentPeriodType = 'today' | 'week' | 'month' | 'last_month' | '3month' | '6month' | 'year' | 'custom'

export interface DateRange { start: string; end: string }

function getPaymentPeriodRanges(period: PaymentPeriodType, customStart?: string, customEnd?: string): {
  current: DateRange; previous: DateRange; label: string; compareLabel: string
} {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'today') {
    const today = fmt(now)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    return {
      current: { start: today, end: today },
      previous: { start: fmt(yesterday), end: fmt(yesterday) },
      label: 'Today',
      compareLabel: 'vs yesterday',
    }
  }

  if (period === 'week') {
    const dow = now.getDay()
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

  if (period === 'month') {
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

  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)
    return {
      current: { start: fmt(start), end: fmt(end) },
      previous: { start: fmt(prevStart), end: fmt(prevEnd) },
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      compareLabel: 'vs prior month',
    }
  }

  if (period === '3month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0)
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 2, 1)
    return {
      current: { start: fmt(start), end: fmt(end) },
      previous: { start: fmt(prevStart), end: fmt(prevEnd) },
      label: 'Last 3 Months',
      compareLabel: 'vs prior 3 months',
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

  if (period === 'custom' && customStart && customEnd) {
    const s = new Date(customStart)
    const e = new Date(customEnd)
    const diffMs = e.getTime() - s.getTime()
    const prevEnd = new Date(s.getTime() - 86400000)
    const prevStart = new Date(prevEnd.getTime() - diffMs)
    return {
      current: { start: customStart, end: customEnd },
      previous: { start: fmt(prevStart), end: fmt(prevEnd) },
      label: `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      compareLabel: 'vs prior period',
    }
  }

  // yearly (default)
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

// ── KPI Engine ───────────────────────────────────────────────────────────────

export async function getPaymentKPIs(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string,
  periodLabel: string,
  compareLabel: string
): Promise<PaymentKPIs> {
  const supabase = await createClient()

  // Current period payments
  const { data: currPayments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_method, payment_date, status, recorded_by, created_at')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  const payments = currPayments || []

  // Previous period payments
  const { data: prevPayments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_method, payment_date, status')
    .gte('payment_date', prevStartDate)
    .lte('payment_date', prevEndDate)

  const prev = prevPayments || []

  // All invoices for outstanding calculations
  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount, due_date, status, issued_date')
    .in('status', ['sent', 'partially_paid', 'overdue', 'paid'])

  const invoices = allInvoices || []

  // All payments for outstanding calculations
  const { data: allPaymentsData } = await supabase
    .from('payments')
    .select('invoice_id, amount')

  const allPay = allPaymentsData || []

  // Refunds in period
  const { data: refunds } = await supabase
    .from('refunds')
    .select('refund_amount, status, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const refundData = refunds || []

  // Build payment map per invoice
  const payMap: Record<string, number> = {}
  for (const p of allPay) {
    payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount
  }

  // Calculate metrics
  const completedPayments = payments.filter(p => (p.status || 'completed') === 'completed')
  const totalCollected = completedPayments.reduce((s, p) => s + p.amount, 0)
  const totalPayments = completedPayments.length

  // Time-based counts
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const dow = now.getDay()
  const mondayDate = new Date(now)
  mondayDate.setDate(now.getDate() - ((dow + 6) % 7))
  const mondayStr = mondayDate.toISOString().split('T')[0]
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const paymentsToday = completedPayments.filter(p => p.payment_date === todayStr).length
  const paymentsThisWeek = completedPayments.filter(p => p.payment_date >= mondayStr).length
  const paymentsThisMonth = completedPayments.filter(p => p.payment_date >= monthStartStr).length

  // Outstanding
  const outstandingInvoices = invoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))
  let outstandingAmount = 0
  let overdueAmount = 0
  let overdueInvoiceCount = 0

  for (const inv of outstandingInvoices) {
    const paid = payMap[inv.id] || 0
    const remaining = Math.max(0, inv.total_amount - paid)
    outstandingAmount += remaining
    if (new Date(inv.due_date) < now && remaining > 0) {
      overdueAmount += remaining
      overdueInvoiceCount++
    }
  }

  // Collection rate = paid invoices / total non-cancelled invoices
  const nonCancelledInvoices = invoices.filter(i => i.status !== 'cancelled')
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const collectionRate = nonCancelledInvoices.length > 0
    ? (paidInvoices.length / nonCancelledInvoices.length) * 100
    : 0

  const averagePayment = totalPayments > 0 ? totalCollected / totalPayments : 0
  const largestPayment = completedPayments.length > 0 ? Math.max(...completedPayments.map(p => p.amount)) : 0
  const pendingPayments = payments.filter(p => (p.status || 'completed') === 'pending').length

  // Refunds
  const refundedAmount = refundData.filter(r => r.status === 'paid').reduce((s, r) => s + r.refund_amount, 0)
  const refundCount = refundData.filter(r => r.status === 'paid').length

  // Average payment days
  let totalPaymentDays = 0
  let paymentDaysCount = 0
  for (const inv of paidInvoices) {
    const invPayments = (currPayments || []).filter(p => p.invoice_id === inv.id)
    if (invPayments.length > 0) {
      const lastPayment = invPayments.sort((a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )[0]
      const days = Math.abs(Math.floor(
        (new Date(lastPayment.payment_date).getTime() - new Date(inv.issued_date).getTime()) / 86400000
      ))
      totalPaymentDays += days
      paymentDaysCount++
    }
  }
  const averagePaymentDays = paymentDaysCount > 0 ? Math.round(totalPaymentDays / paymentDaysCount) : 0

  // Cash collected this year
  const yearStart = `${now.getFullYear()}-01-01`
  const { data: yearPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .gte('payment_date', yearStart)
    .lte('payment_date', todayStr)

  const cashCollectedThisYear = (yearPayments || [])
    .filter(p => (p.status || 'completed') === 'completed')
    .reduce((s, p) => s + p.amount, 0)

  // Previous period comparisons
  const prevCompleted = prev.filter(p => (p.status || 'completed') === 'completed')
  const prevTotalCollected = prevCompleted.reduce((s, p) => s + p.amount, 0)
  const prevTotalPayments = prevCompleted.length
  const prevAveragePayment = prevTotalPayments > 0 ? prevTotalCollected / prevTotalPayments : 0

  // Previous outstanding (approximate using invoices from prev period)
  const { data: prevInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount, status')
    .gte('issued_date', prevStartDate)
    .lte('issued_date', prevEndDate)
    .in('status', ['sent', 'partially_paid', 'overdue'])

  let prevOutstandingAmount = 0
  for (const inv of prevInvoices || []) {
    const paid = payMap[inv.id] || 0
    prevOutstandingAmount += Math.max(0, inv.total_amount - paid)
  }

  const prevNonCancelled = (prevInvoices || []).length
  const prevCollectionRate = prevNonCancelled > 0 ? 0 : 0 // Would need full prev invoice set

  return {
    totalPayments,
    totalCollected,
    paymentsThisMonth,
    paymentsThisWeek,
    paymentsToday,
    outstandingAmount,
    collectionRate,
    averagePayment,
    largestPayment,
    overdueAmount,
    overdueInvoiceCount,
    pendingPayments,
    refundedAmount,
    refundCount,
    averagePaymentDays,
    cashCollectedThisYear,
    prevTotalCollected,
    prevTotalPayments,
    prevOutstandingAmount,
    prevCollectionRate,
    prevAveragePayment,
    periodLabel,
    compareLabel,
  }
}

// ── Chart Data ───────────────────────────────────────────────────────────────

export async function getPaymentChartData(startDate: string, endDate: string): Promise<PaymentChartData> {
  const supabase = await createClient()

  // Payments in period
  const { data: payments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_method, payment_date, status, recorded_by')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)
    .order('payment_date', { ascending: true })

  const all = payments || []

  // Get invoice data for these payments
  const invoiceIds = [...new Set(all.map(p => p.invoice_id))]
  const { data: invoiceData } = invoiceIds.length > 0
    ? await supabase.from('invoices').select('id, customer_id, currency, total_amount, due_date, status').in('id', invoiceIds)
    : { data: [] }

  const invoiceMap: Record<string, any> = {}
  for (const inv of invoiceData || []) {
    invoiceMap[inv.id] = inv
  }

  // Get customer names
  const customerIds = [...new Set((invoiceData || []).map(i => i.customer_id).filter(Boolean))]
  const { data: customers } = customerIds.length > 0
    ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
    : { data: [] }

  const customerMap: Record<string, string> = {}
  for (const c of customers || []) {
    customerMap[c.id] = c.company_name || 'Unknown'
  }

  // Get agent names
  const agentIds = [...new Set(all.map(p => p.recorded_by).filter(Boolean))]
  const { data: agents } = agentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', agentIds as string[])
    : { data: [] }

  const agentMap: Record<string, string> = {}
  for (const a of agents || []) {
    agentMap[a.id] = a.full_name || 'Unknown'
  }

  // 1. Collection Trend (daily/monthly)
  const trendMap: Record<string, { amount: number; count: number }> = {}
  for (const p of all) {
    const completed = (p.status || 'completed') === 'completed'
    if (!completed) continue
    const key = p.payment_date
    if (!trendMap[key]) trendMap[key] = { amount: 0, count: 0 }
    trendMap[key].amount += p.amount
    trendMap[key].count++
  }
  const collectionTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  // 2. By Payment Method (with failure rate — Section 34)
  const methodMap: Record<string, { amount: number; count: number; failed: number; total: number }> = {}
  for (const p of all) {
    const m = p.payment_method || 'Unknown'
    if (!methodMap[m]) methodMap[m] = { amount: 0, count: 0, failed: 0, total: 0 }
    methodMap[m].total++
    if ((p.status || 'completed') === 'completed') {
      methodMap[m].amount += p.amount
      methodMap[m].count++
    }
    if ((p.status || 'completed') === 'failed') {
      methodMap[m].failed++
    }
  }
  const byMethod = Object.entries(methodMap).map(([method, v]) => ({
    method,
    amount: v.amount,
    count: v.count,
    failureRate: v.total > 0 ? (v.failed / v.total) * 100 : 0,
  }))

  // 3. By Currency (derived from invoice)
  const currMap: Record<string, { amount: number; count: number }> = {}
  for (const p of all) {
    if ((p.status || 'completed') !== 'completed') continue
    const currency = invoiceMap[p.invoice_id]?.currency || 'USD'
    if (!currMap[currency]) currMap[currency] = { amount: 0, count: 0 }
    currMap[currency].amount += p.amount
    currMap[currency].count++
  }
  const byCurrency = Object.entries(currMap).map(([currency, v]) => ({ currency, ...v }))

  // 4. By Status
  const statusMap: Record<string, { amount: number; count: number }> = {}
  for (const p of all) {
    const s = p.status || 'completed'
    if (!statusMap[s]) statusMap[s] = { amount: 0, count: 0 }
    statusMap[s].amount += p.amount
    statusMap[s].count++
  }
  const byStatus = Object.entries(statusMap).map(([status, v]) => ({ status, ...v }))

  // 5. Outstanding Trend (monthly)
  const { data: outInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount, issued_date, status')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  const { data: allPayData } = await supabase.from('payments').select('invoice_id, amount, payment_date')
  const paymentsByInvoice: Record<string, number> = {}
  for (const p of allPayData || []) {
    paymentsByInvoice[p.invoice_id] = (paymentsByInvoice[p.invoice_id] || 0) + p.amount
  }

  const outMonthMap: Record<string, number> = {}
  for (const inv of outInvoices || []) {
    const m = inv.issued_date.slice(0, 7)
    const remaining = Math.max(0, inv.total_amount - (paymentsByInvoice[inv.id] || 0))
    if (!outMonthMap[m]) outMonthMap[m] = 0
    outMonthMap[m] += remaining
  }
  const outstandingTrend = Object.entries(outMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, outstanding]) => ({
      date: new Date(date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      outstanding,
    }))

  // 6. Aging Buckets
  const agingBuckets = await _getPaymentAgingBuckets(supabase)

  // 7. Top Customers
  const custTotals: Record<string, { totalPaid: number; paymentCount: number }> = {}
  for (const p of all) {
    if ((p.status || 'completed') !== 'completed') continue
    const custId = invoiceMap[p.invoice_id]?.customer_id
    if (!custId) continue
    if (!custTotals[custId]) custTotals[custId] = { totalPaid: 0, paymentCount: 0 }
    custTotals[custId].totalPaid += p.amount
    custTotals[custId].paymentCount++
  }
  const topCustomers = Object.entries(custTotals)
    .sort(([, a], [, b]) => b.totalPaid - a.totalPaid)
    .slice(0, 10)
    .map(([customerId, v]) => ({
      customerId,
      customerName: customerMap[customerId] || 'Unknown',
      ...v,
    }))

  // 8. Top Sales Agents
  const agentTotals: Record<string, { totalCollected: number; paymentCount: number }> = {}
  for (const p of all) {
    if ((p.status || 'completed') !== 'completed') continue
    const agentId = p.recorded_by
    if (!agentId) continue
    if (!agentTotals[agentId]) agentTotals[agentId] = { totalCollected: 0, paymentCount: 0 }
    agentTotals[agentId].totalCollected += p.amount
    agentTotals[agentId].paymentCount++
  }
  const topAgents = Object.entries(agentTotals)
    .sort(([, a], [, b]) => b.totalCollected - a.totalCollected)
    .slice(0, 10)
    .map(([agentId, v]) => ({
      agentId,
      agentName: agentMap[agentId] || 'Unknown',
      ...v,
    }))

  // 9. Monthly Collection
  const monthColMap: Record<string, { collected: number; outstanding: number; count: number }> = {}
  for (const p of all) {
    if ((p.status || 'completed') !== 'completed') continue
    const m = p.payment_date.slice(0, 7)
    if (!monthColMap[m]) monthColMap[m] = { collected: 0, outstanding: 0, count: 0 }
    monthColMap[m].collected += p.amount
    monthColMap[m].count++
  }
  // Add outstanding per month
  for (const inv of outInvoices || []) {
    const m = inv.issued_date.slice(0, 7)
    if (!monthColMap[m]) monthColMap[m] = { collected: 0, outstanding: 0, count: 0 }
    monthColMap[m].outstanding += Math.max(0, inv.total_amount - (paymentsByInvoice[inv.id] || 0))
  }
  const monthlyCollection = Object.entries(monthColMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      ...v,
    }))

  return {
    collectionTrend,
    byMethod,
    byCurrency,
    byStatus,
    outstandingTrend,
    agingBuckets,
    topCustomers,
    topAgents,
    monthlyCollection,
  }
}

// ── Aging Buckets ────────────────────────────────────────────────────────────

async function _getPaymentAgingBuckets(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PaymentAgingBucket[]> {
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
  const buckets: Record<string, PaymentAgingBucket> = {
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

export async function getPaymentAgingBuckets(): Promise<PaymentAgingBucket[]> {
  const supabase = await createClient()
  return _getPaymentAgingBuckets(supabase)
}

// ── Collection Health Score ──────────────────────────────────────────────────

export async function getCollectionHealthScore(): Promise<CollectionHealthScore> {
  const supabase = await createClient()

  // Fetch all needed data
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, due_date, status, issued_date')
    .neq('status', 'cancelled')

  const { data: payments } = await supabase
    .from('payments')
    .select('invoice_id, amount, payment_date, status')

  const { data: refunds } = await supabase
    .from('refunds')
    .select('refund_amount, status')

  const allInvoices = invoices || []
  const allPayments = payments || []
  const allRefunds = refunds || []

  const payMap: Record<string, number> = {}
  for (const p of allPayments) {
    payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount
  }

  // Factor 1: Collection Rate (weight 30)
  const paidCount = allInvoices.filter(i => i.status === 'paid').length
  const totalNonDraft = allInvoices.filter(i => i.status !== 'draft').length
  const collectionRate = totalNonDraft > 0 ? (paidCount / totalNonDraft) * 100 : 100
  const collectionScore = Math.min(100, collectionRate)

  // Factor 2: Outstanding Balance Ratio (weight 25)
  const totalInvoiced = allInvoices.reduce((s, i) => s + i.total_amount, 0)
  const totalPaid = allPayments
    .filter(p => (p.status || 'completed') === 'completed')
    .reduce((s, p) => s + p.amount, 0)
  const outstandingRatio = totalInvoiced > 0 ? ((totalInvoiced - totalPaid) / totalInvoiced) * 100 : 0
  const outstandingScore = Math.max(0, 100 - outstandingRatio)

  // Factor 3: Overdue Amount (weight 20)
  const now = new Date()
  let overdueTotal = 0
  for (const inv of allInvoices.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))) {
    if (new Date(inv.due_date) < now) {
      overdueTotal += Math.max(0, inv.total_amount - (payMap[inv.id] || 0))
    }
  }
  const overdueRatio = totalInvoiced > 0 ? (overdueTotal / totalInvoiced) * 100 : 0
  const overdueScore = Math.max(0, 100 - overdueRatio * 2)

  // Factor 4: Payment Delay (weight 15)
  let totalDays = 0
  let dayCount = 0
  for (const inv of allInvoices.filter(i => i.status === 'paid')) {
    const invPayments = allPayments.filter(p => p.invoice_id === inv.id)
    if (invPayments.length > 0) {
      const lastPay = invPayments.sort((a, b) =>
        new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
      )[0]
      const days = Math.floor(
        (new Date(lastPay.payment_date).getTime() - new Date(inv.due_date).getTime()) / 86400000
      )
      totalDays += Math.max(0, days)
      dayCount++
    }
  }
  const avgDelay = dayCount > 0 ? totalDays / dayCount : 0
  const delayScore = Math.max(0, 100 - avgDelay * 3)

  // Factor 5: Failed Payments (weight 5)
  const failedPayments = allPayments.filter(p => (p.status || 'completed') === 'failed').length
  const totalAttempts = allPayments.length
  const failureRate = totalAttempts > 0 ? (failedPayments / totalAttempts) * 100 : 0
  const failedScore = Math.max(0, 100 - failureRate * 10)

  // Factor 6: Refund Rate (weight 5)
  const paidRefunds = allRefunds.filter(r => r.status === 'paid').reduce((s, r) => s + r.refund_amount, 0)
  const refundRate = totalPaid > 0 ? (paidRefunds / totalPaid) * 100 : 0
  const refundScore = Math.max(0, 100 - refundRate * 5)

  const factors = [
    { label: 'Collection Rate', score: Math.round(collectionScore), weight: 30, description: `${collectionRate.toFixed(1)}% of invoices collected` },
    { label: 'Outstanding Balance', score: Math.round(outstandingScore), weight: 25, description: `${outstandingRatio.toFixed(1)}% of invoiced amount outstanding` },
    { label: 'Overdue Amount', score: Math.round(overdueScore), weight: 20, description: `${overdueRatio.toFixed(1)}% of invoiced amount overdue` },
    { label: 'Payment Delay', score: Math.round(delayScore), weight: 15, description: `Average ${avgDelay.toFixed(0)} days past due date` },
    { label: 'Failed Payments', score: Math.round(failedScore), weight: 5, description: `${failureRate.toFixed(1)}% payment failure rate` },
    { label: 'Refund Rate', score: Math.round(refundScore), weight: 5, description: `${refundRate.toFixed(1)}% of collected amount refunded` },
  ]

  const score = Math.round(
    factors.reduce((s, f) => s + (f.score * f.weight) / 100, 0)
  )

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F'
  const color = score >= 90 ? '#0d9488' : score >= 75 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const status = score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : score >= 40 ? 'Needs Attention' : 'Critical'

  // Data-driven recommendations
  const recommendations: string[] = []
  const overdueInvoices = allInvoices.filter(i =>
    ['sent', 'partially_paid', 'overdue'].includes(i.status) && new Date(i.due_date) < now
  )
  if (overdueInvoices.length > 0) {
    recommendations.push(`Follow up with ${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''}`)
  }
  if (collectionRate < 80) {
    recommendations.push(`Collection rate is ${collectionRate.toFixed(0)}% — target 80%+ by following up on outstanding invoices`)
  }
  if (avgDelay > 7) {
    recommendations.push(`Average payment delay is ${avgDelay.toFixed(0)} days — consider early payment incentives`)
  }
  if (failureRate > 5) {
    recommendations.push(`Payment failure rate is ${failureRate.toFixed(1)}% — review payment method reliability`)
  }
  if (refundRate > 3) {
    recommendations.push(`Refund rate is ${refundRate.toFixed(1)}% — investigate root causes`)
  }
  if (recommendations.length === 0) {
    recommendations.push('Collections are performing well — maintain current practices')
  }

  return { score, grade, color, status, factors, recommendations }
}

// ── Smart Collection Summary ─────────────────────────────────────────────────

export async function getSmartCollectionSummary(
  startDate: string,
  endDate: string,
  prevStartDate: string,
  prevEndDate: string
): Promise<string> {
  const supabase = await createClient()

  // Current period
  const { data: currPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .gte('payment_date', startDate)
    .lte('payment_date', endDate)

  const { data: prevPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .gte('payment_date', prevStartDate)
    .lte('payment_date', prevEndDate)

  const { data: outInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount, status')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  const { data: allPayData } = await supabase.from('payments').select('invoice_id, amount')
  const payMap: Record<string, number> = {}
  for (const p of allPayData || []) {
    payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount
  }

  const currTotal = (currPayments || [])
    .filter(p => (p.status || 'completed') === 'completed')
    .reduce((s, p) => s + p.amount, 0)

  const prevTotal = (prevPayments || [])
    .filter(p => (p.status || 'completed') === 'completed')
    .reduce((s, p) => s + p.amount, 0)

  const currCount = (currPayments || [])
    .filter(p => (p.status || 'completed') === 'completed')
    .length

  let outstandingTotal = 0
  let outstandingCount = 0
  for (const inv of outInvoices || []) {
    const remaining = Math.max(0, inv.total_amount - (payMap[inv.id] || 0))
    if (remaining > 0) {
      outstandingTotal += remaining
      outstandingCount++
    }
  }

  // All invoices for collection rate
  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('status')
    .neq('status', 'cancelled')
    .neq('status', 'draft')

  const totalInv = (allInvoices || []).length
  const paidInv = (allInvoices || []).filter(i => i.status === 'paid').length
  const collRate = totalInv > 0 ? ((paidInv / totalInv) * 100).toFixed(0) : '0'

  const changePercent = prevTotal > 0
    ? (((currTotal - prevTotal) / prevTotal) * 100).toFixed(0)
    : '0'

  const direction = Number(changePercent) >= 0 ? 'increased' : 'decreased'
  const absChange = Math.abs(Number(changePercent))

  const parts: string[] = []

  if (currCount > 0) {
    parts.push(`Collections ${direction} ${absChange}% compared with the previous period.`)
    parts.push(`${collRate}% of outstanding invoices have been collected.`)
  } else {
    parts.push('No payments recorded in this period.')
  }

  if (outstandingTotal > 0) {
    const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
    parts.push(`ETB ${fmt.format(outstandingTotal)} remains outstanding, with ${outstandingCount} invoice${outstandingCount > 1 ? 's' : ''} requiring attention.`)
  }

  return parts.join(' ')
}

// ── Payments with Relations (server-side paginated) ──────────────────────────

export async function getPaymentsWithRelations(filter: PaymentFilter): Promise<{
  data: PaymentWithRelations[]
  total: number
}> {
  const supabase = await createClient()
  const limit = filter.limit || 50
  const offset = filter.offset || 0

  // Build query
  let query = supabase.from('payments').select('*', { count: 'exact' })

  if (filter.status) query = query.eq('status', filter.status)
  if (filter.paymentMethod) query = query.eq('payment_method', filter.paymentMethod)
  if (filter.startDate) query = query.gte('payment_date', filter.startDate)
  if (filter.endDate) query = query.lte('payment_date', filter.endDate)
  if (filter.amountMin) query = query.gte('amount', filter.amountMin)
  if (filter.amountMax) query = query.lte('amount', filter.amountMax)
  if (filter.recordedBy) query = query.eq('recorded_by', filter.recordedBy)
  if (filter.invoiceId) query = query.eq('invoice_id', filter.invoiceId)

  // Search across reference_number and notes
  if (filter.search) {
    query = query.or(`reference_number.ilike.%${filter.search}%,notes.ilike.%${filter.search}%`)
  }

  // Sorting
  const sortBy = filter.sortBy || 'payment_date'
  const sortOrder = filter.sortOrder === 'asc'

  const { data: payments, error, count } = await query
    .order(sortBy, { ascending: sortOrder })
    .range(offset, offset + limit - 1)

  if (error) throw new Error(`Failed to fetch payments: ${error.message}`)

  const paymentList = payments || []
  if (paymentList.length === 0) return { data: [], total: 0 }

  // Enrich with invoice, customer, booking data
  const invoiceIds = [...new Set(paymentList.map(p => p.invoice_id))]
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, customer_id, booking_id, total_amount, currency, due_date, status')
    .in('id', invoiceIds)

  const invoiceMap: Record<string, any> = {}
  for (const inv of invoices || []) invoiceMap[inv.id] = inv

  // Customers
  const customerIds = [...new Set((invoices || []).map(i => i.customer_id).filter(Boolean))]
  const { data: custData } = customerIds.length > 0
    ? await supabase.from('customers').select('id, company_name, email, phone').in('id', customerIds)
    : { data: [] }
  const custMap: Record<string, any> = {}
  for (const c of custData || []) custMap[c.id] = c

  // Bookings
  const bookingIds = [...new Set((invoices || []).map(i => i.booking_id).filter(Boolean))]
  const { data: bookData } = bookingIds.length > 0
    ? await supabase.from('bookings').select('id, booking_reference, destination').in('id', bookingIds)
    : { data: [] }
  const bookMap: Record<string, any> = {}
  for (const b of bookData || []) bookMap[b.id] = b

  // Profiles for recorded_by
  const profileIds = [...new Set(paymentList.map(p => p.recorded_by).filter(Boolean))]
  const { data: profiles } = profileIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', profileIds as string[])
    : { data: [] }
  const profileMap: Record<string, string> = {}
  for (const pr of profiles || []) profileMap[pr.id] = pr.full_name

  // Paid amounts per invoice
  const { data: payPerInv } = await supabase
    .from('payments')
    .select('invoice_id, amount')
    .in('invoice_id', invoiceIds)

  const paidPerInvoice: Record<string, number> = {}
  for (const p of payPerInv || []) {
    paidPerInvoice[p.invoice_id] = (paidPerInvoice[p.invoice_id] || 0) + p.amount
  }

  // Apply customer/booking filters post-query if needed
  let enriched: PaymentWithRelations[] = paymentList.map(p => {
    const inv = invoiceMap[p.invoice_id]
    const cust = inv ? custMap[inv.customer_id] : null
    const book = inv?.booking_id ? bookMap[inv.booking_id] : null
    const totalPaid = paidPerInvoice[p.invoice_id] || 0

    return {
      ...p,
      customer_id: inv?.customer_id,
      customer_name: cust?.company_name || 'Unknown',
      customer_email: cust?.email,
      customer_phone: cust?.phone,
      invoice_number: inv?.invoice_number,
      invoice_total: inv?.total_amount,
      invoice_currency: inv?.currency || 'USD',
      invoice_due_date: inv?.due_date,
      invoice_status: inv?.status,
      booking_id: inv?.booking_id,
      booking_reference: book?.booking_reference,
      booking_destination: book?.destination,
      recorded_by_name: p.recorded_by ? profileMap[p.recorded_by] || 'Unknown' : undefined,
      paid_amount: totalPaid,
      remaining_amount: inv ? Math.max(0, inv.total_amount - totalPaid) : 0,
    }
  })

  // Client-side filter for customer/booking (since these are JOINed fields)
  if (filter.customerId) {
    enriched = enriched.filter(p => p.customer_id === filter.customerId)
  }
  if (filter.bookingId) {
    enriched = enriched.filter(p => p.booking_id === filter.bookingId)
  }
  if (filter.currency) {
    enriched = enriched.filter(p => p.invoice_currency === filter.currency)
  }

  // Enhanced search that covers customer name and invoice number
  if (filter.search) {
    const searchLower = filter.search.toLowerCase()
    enriched = enriched.filter(p =>
      (p.customer_name || '').toLowerCase().includes(searchLower) ||
      (p.invoice_number || '').toLowerCase().includes(searchLower) ||
      (p.booking_reference || '').toLowerCase().includes(searchLower) ||
      (p.reference_number || '').toLowerCase().includes(searchLower) ||
      (p.notes || '').toLowerCase().includes(searchLower) ||
      (p.payment_method || '').toLowerCase().includes(searchLower)
    )
  }

  return { data: enriched, total: count || 0 }
}

// ── Recent Activity ──────────────────────────────────────────────────────────

export interface PaymentActivityItem {
  id: string
  type: 'payment_recorded' | 'payment_refunded' | 'large_payment' | 'invoice_paid' | 'payment_failed'
  description: string
  amount?: number
  customerName?: string
  createdAt: string
}

export async function getRecentPaymentActivity(limit = 20): Promise<PaymentActivityItem[]> {
  const supabase = await createClient()

  // Recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_method, payment_date, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  const activities: PaymentActivityItem[] = []

  // Get invoice → customer mapping
  const invoiceIds = [...new Set((recentPayments || []).map(p => p.invoice_id))]
  const { data: invoices } = invoiceIds.length > 0
    ? await supabase.from('invoices').select('id, invoice_number, customer_id').in('id', invoiceIds)
    : { data: [] }

  const invMap: Record<string, any> = {}
  for (const inv of invoices || []) invMap[inv.id] = inv

  const customerIds = [...new Set((invoices || []).map(i => i.customer_id).filter(Boolean))]
  const { data: custs } = customerIds.length > 0
    ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
    : { data: [] }

  const custMap: Record<string, string> = {}
  for (const c of custs || []) custMap[c.id] = c.company_name || 'Unknown'

  const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

  for (const p of recentPayments || []) {
    const inv = invMap[p.invoice_id]
    const custName = inv ? custMap[inv.customer_id] || 'Unknown' : 'Unknown'
    const status = p.status || 'completed'

    if (status === 'failed') {
      activities.push({
        id: p.id,
        type: 'payment_failed',
        description: `Payment of ETB ${fmt.format(p.amount)} via ${p.payment_method?.replace('_', ' ')} failed for ${custName}`,
        amount: p.amount,
        customerName: custName,
        createdAt: p.created_at,
      })
    } else if (p.amount >= 50000) {
      activities.push({
        id: p.id,
        type: 'large_payment',
        description: `Large payment of ETB ${fmt.format(p.amount)} received from ${custName}`,
        amount: p.amount,
        customerName: custName,
        createdAt: p.created_at,
      })
    } else {
      activities.push({
        id: p.id,
        type: 'payment_recorded',
        description: `Payment of ETB ${fmt.format(p.amount)} recorded for ${custName} via ${p.payment_method?.replace('_', ' ')}`,
        amount: p.amount,
        customerName: custName,
        createdAt: p.created_at,
      })
    }
  }

  // Recent refunds
  const { data: recentRefunds } = await supabase
    .from('refunds')
    .select('id, refund_amount, status, invoice_id, created_at')
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(5)

  for (const r of recentRefunds || []) {
    activities.push({
      id: r.id,
      type: 'payment_refunded',
      description: `Refund of ETB ${fmt.format(r.refund_amount)} processed`,
      amount: r.refund_amount,
      createdAt: r.created_at,
    })
  }

  return activities.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, limit)
}

// ── Cash Flow Forecast (Section 33) ──────────────────────────────────────────

export async function getCashFlowForecast(): Promise<CashFlowProjection[]> {
  const supabase = await createClient()

  // Get outstanding invoices with customer info
  const { data: outInvoices } = await supabase
    .from('invoices')
    .select('id, customer_id, total_amount, due_date, status')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  const { data: allPayments } = await supabase
    .from('payments')
    .select('invoice_id, amount, payment_date')

  // Get all invoices with due_date and payment history for on-time rate calc
  const { data: historicalInvoices } = await supabase
    .from('invoices')
    .select('id, customer_id, due_date, status')
    .eq('status', 'paid')

  const payMap: Record<string, number> = {}
  const payDateMap: Record<string, string> = {} // Latest payment date per invoice
  for (const p of allPayments || []) {
    payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount
    if (!payDateMap[p.invoice_id] || p.payment_date > payDateMap[p.invoice_id]) {
      payDateMap[p.invoice_id] = p.payment_date
    }
  }

  // Compute per-customer on-time rate
  const customerStats: Record<string, { onTime: number; total: number; avgDelay: number; delays: number[] }> = {}
  for (const inv of historicalInvoices || []) {
    const custId = inv.customer_id
    if (!custId) continue
    if (!customerStats[custId]) customerStats[custId] = { onTime: 0, total: 0, avgDelay: 0, delays: [] }
    customerStats[custId].total++
    const payDate = payDateMap[inv.id]
    if (payDate) {
      const delayDays = Math.floor(
        (new Date(payDate).getTime() - new Date(inv.due_date).getTime()) / 86400000
      )
      customerStats[custId].delays.push(delayDays)
      if (delayDays <= 0) customerStats[custId].onTime++
    }
  }

  // Compute average delay per customer
  for (const custId of Object.keys(customerStats)) {
    const stats = customerStats[custId]
    stats.avgDelay = stats.delays.length > 0
      ? stats.delays.reduce((s, d) => s + d, 0) / stats.delays.length
      : 0
  }

  // Customer names
  const customerIds = [...new Set((outInvoices || []).map(i => i.customer_id).filter(Boolean))]
  const { data: custs } = customerIds.length > 0
    ? await supabase.from('customers').select('id, company_name').in('id', customerIds)
    : { data: [] }
  const custNameMap: Record<string, string> = {}
  for (const c of custs || []) custNameMap[c.id] = c.company_name || 'Unknown'

  // Project collections for 30/60/90 day windows
  const now = new Date()
  const projections: CashFlowProjection[] = [
    { period: 'Next 30 Days', expectedAmount: 0, confidenceLevel: 0, customerBreakdown: [] },
    { period: 'Next 60 Days', expectedAmount: 0, confidenceLevel: 0, customerBreakdown: [] },
    { period: 'Next 90 Days', expectedAmount: 0, confidenceLevel: 0, customerBreakdown: [] },
  ]

  for (const inv of outInvoices || []) {
    const custId = inv.customer_id
    if (!custId) continue

    const outstanding = Math.max(0, inv.total_amount - (payMap[inv.id] || 0))
    if (outstanding <= 0) continue

    const stats = customerStats[custId] || { onTime: 0, total: 0, avgDelay: 0, delays: [] }
    const onTimeRate = stats.total > 0 ? stats.onTime / stats.total : 0.5
    const avgDelay = stats.avgDelay || 0

    // Expected payment date = due_date + average delay for this customer
    const dueDate = new Date(inv.due_date)
    const expectedDate = new Date(dueDate.getTime() + avgDelay * 86400000)
    const daysFromNow = Math.floor((expectedDate.getTime() - now.getTime()) / 86400000)

    const breakdown = {
      customerId: custId,
      customerName: custNameMap[custId] || 'Unknown',
      outstandingAmount: outstanding,
      expectedDate: expectedDate.toISOString().split('T')[0],
      onTimeRate: stats.total > 0 ? (stats.onTime / stats.total) * 100 : 50,
    }

    if (daysFromNow <= 30) {
      projections[0].expectedAmount += outstanding
      projections[0].customerBreakdown.push(breakdown)
    }
    if (daysFromNow <= 60) {
      projections[1].expectedAmount += outstanding
      projections[1].customerBreakdown.push(breakdown)
    }
    if (daysFromNow <= 90) {
      projections[2].expectedAmount += outstanding
      projections[2].customerBreakdown.push(breakdown)
    }
  }

  // Confidence level based on customer on-time rates
  for (const proj of projections) {
    if (proj.customerBreakdown.length > 0) {
      const totalWeight = proj.customerBreakdown.reduce((s, c) => s + c.outstandingAmount, 0)
      const weightedConfidence = proj.customerBreakdown.reduce(
        (s, c) => s + (c.onTimeRate / 100) * (c.outstandingAmount / (totalWeight || 1)),
        0
      )
      proj.confidenceLevel = Math.round(weightedConfidence * 100)
    }
  }

  return projections
}

// ── Payment Method Reliability (Section 34) ──────────────────────────────────

export async function getPaymentMethodReliability(): Promise<PaymentMethodReliability[]> {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('payment_method, amount, status')

  const methodMap: Record<string, { success: number; failure: number; total: number; amount: number }> = {}

  for (const p of payments || []) {
    const m = p.payment_method || 'Unknown'
    if (!methodMap[m]) methodMap[m] = { success: 0, failure: 0, total: 0, amount: 0 }
    methodMap[m].total++
    const status = p.status || 'completed'
    if (status === 'completed') {
      methodMap[m].success++
      methodMap[m].amount += p.amount
    }
    if (status === 'failed') {
      methodMap[m].failure++
    }
  }

  return Object.entries(methodMap).map(([method, v]) => {
    const failureRate = v.total > 0 ? (v.failure / v.total) * 100 : 0
    let reliabilityScore: PaymentMethodReliability['reliabilityScore'] = 'excellent'
    if (failureRate > 10) reliabilityScore = 'poor'
    else if (failureRate > 5) reliabilityScore = 'fair'
    else if (failureRate > 2) reliabilityScore = 'good'

    return {
      method,
      totalAttempts: v.total,
      successCount: v.success,
      failureCount: v.failure,
      failureRate,
      totalAmount: v.amount,
      reliabilityScore,
    }
  })
}

// ── Collections Intelligence (Section 17) ────────────────────────────────────

export async function getCollectionsIntelligence(): Promise<CollectionsIntelligence> {
  const supabase = await createClient()

  // All completed payments with invoice data
  const { data: payments } = await supabase
    .from('payments')
    .select('id, invoice_id, amount, payment_method, payment_date, status')
    .or('status.eq.completed,status.is.null')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, customer_id, invoice_number, total_amount, due_date, issued_date, status')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, company_name')

  const custNameMap: Record<string, string> = {}
  for (const c of customers || []) custNameMap[c.id] = c.company_name || 'Unknown'

  const invMap: Record<string, any> = {}
  for (const inv of invoices || []) invMap[inv.id] = inv

  const allPay = payments || []

  // Largest payment
  const sortedByAmount = [...allPay].sort((a, b) => b.amount - a.amount)
  const largest = sortedByAmount[0]
  const largestInv = largest ? invMap[largest.invoice_id] : null

  // Customer aggregates
  const custAgg: Record<string, { totalPaid: number; count: number; delays: number[] }> = {}
  for (const p of allPay) {
    const inv = invMap[p.invoice_id]
    if (!inv) continue
    const custId = inv.customer_id
    if (!custId) continue
    if (!custAgg[custId]) custAgg[custId] = { totalPaid: 0, count: 0, delays: [] }
    custAgg[custId].totalPaid += p.amount
    custAgg[custId].count++
    // Payment delay
    const delay = Math.floor(
      (new Date(p.payment_date).getTime() - new Date(inv.due_date).getTime()) / 86400000
    )
    custAgg[custId].delays.push(delay)
  }

  // Largest customer
  const custEntries = Object.entries(custAgg).sort(([, a], [, b]) => b.totalPaid - a.totalPaid)
  const largestCust = custEntries[0]

  // Fastest payer (lowest avg delay, min 2 payments)
  const custWithAvg = Object.entries(custAgg)
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({
      id,
      avgDays: v.delays.reduce((s, d) => s + d, 0) / v.delays.length,
      count: v.count,
    }))
    .sort((a, b) => a.avgDays - b.avgDays)

  const fastest = custWithAvg[0]
  const slowest = custWithAvg[custWithAvg.length - 1]

  // Outstanding per customer
  const payPerInv: Record<string, number> = {}
  for (const p of allPay) {
    payPerInv[p.invoice_id] = (payPerInv[p.invoice_id] || 0) + p.amount
  }

  const custOutstanding: Record<string, { outstanding: number; invCount: number }> = {}
  for (const inv of (invoices || []).filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))) {
    const custId = inv.customer_id
    if (!custId) continue
    const remaining = Math.max(0, inv.total_amount - (payPerInv[inv.id] || 0))
    if (!custOutstanding[custId]) custOutstanding[custId] = { outstanding: 0, invCount: 0 }
    custOutstanding[custId].outstanding += remaining
    custOutstanding[custId].invCount++
  }

  const mostOutstanding = Object.entries(custOutstanding).sort(([, a], [, b]) => b.outstanding - a.outstanding)[0]

  // Collection rate per customer
  const custInvoiceTotals: Record<string, { invoiced: number; collected: number }> = {}
  for (const inv of invoices || []) {
    const custId = inv.customer_id
    if (!custId || inv.status === 'cancelled' || inv.status === 'draft') continue
    if (!custInvoiceTotals[custId]) custInvoiceTotals[custId] = { invoiced: 0, collected: 0 }
    custInvoiceTotals[custId].invoiced += inv.total_amount
    custInvoiceTotals[custId].collected += payPerInv[inv.id] || 0
  }
  const bestCollector = Object.entries(custInvoiceTotals)
    .filter(([, v]) => v.invoiced > 0)
    .map(([id, v]) => ({ id, rate: (v.collected / v.invoiced) * 100, invoiced: v.invoiced }))
    .sort((a, b) => b.rate - a.rate)[0]

  // Payment method leader
  const methodTotals: Record<string, number> = {}
  const totalPayAmount = allPay.reduce((s, p) => s + p.amount, 0)
  for (const p of allPay) {
    const m = p.payment_method || 'Unknown'
    methodTotals[m] = (methodTotals[m] || 0) + p.amount
  }
  const methodLeader = Object.entries(methodTotals).sort(([, a], [, b]) => b - a)[0]

  return {
    largestPayment: {
      amount: largest?.amount || 0,
      customerName: largestInv ? custNameMap[largestInv.customer_id] || 'Unknown' : 'N/A',
      date: largest?.payment_date || '',
      invoiceNumber: largestInv?.invoice_number || '',
    },
    largestCustomer: {
      customerName: largestCust ? custNameMap[largestCust[0]] || 'Unknown' : 'N/A',
      totalPaid: largestCust ? largestCust[1].totalPaid : 0,
      paymentCount: largestCust ? largestCust[1].count : 0,
    },
    fastestPayer: {
      customerName: fastest ? custNameMap[fastest.id] || 'Unknown' : 'N/A',
      avgDays: fastest ? Math.round(fastest.avgDays) : 0,
      paymentCount: fastest?.count || 0,
    },
    slowestPayer: {
      customerName: slowest ? custNameMap[slowest.id] || 'Unknown' : 'N/A',
      avgDays: slowest ? Math.round(slowest.avgDays) : 0,
      paymentCount: slowest?.count || 0,
    },
    mostOutstandingCustomer: {
      customerName: mostOutstanding ? custNameMap[mostOutstanding[0]] || 'Unknown' : 'N/A',
      outstandingAmount: mostOutstanding ? mostOutstanding[1].outstanding : 0,
      invoiceCount: mostOutstanding ? mostOutstanding[1].invCount : 0,
    },
    highestCollectionCustomer: {
      customerName: bestCollector ? custNameMap[bestCollector.id] || 'Unknown' : 'N/A',
      collectionRate: bestCollector?.rate || 0,
      totalInvoiced: bestCollector?.invoiced || 0,
    },
    paymentMethodLeader: {
      method: methodLeader ? methodLeader[0] : 'N/A',
      totalAmount: methodLeader ? methodLeader[1] : 0,
      percentage: totalPayAmount > 0 && methodLeader ? (methodLeader[1] / totalPayAmount) * 100 : 0,
    },
  }
}

// ── Customer Leaderboard (Section 18) ────────────────────────────────────────

export interface PaymentCustomerLeaderboardEntry {
  customerId: string
  customerName: string
  paymentCount: number
  totalCollected: number
  outstanding: number
  collectionRate: number
  avgPaymentDays: number
  growth: number
}

export async function getPaymentCustomerLeaderboard(
  startDate: string,
  endDate: string
): Promise<PaymentCustomerLeaderboardEntry[]> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, customer_id, total_amount, due_date, status, issued_date')
    .neq('status', 'cancelled')

  const { data: payments } = await supabase
    .from('payments')
    .select('invoice_id, amount, payment_date, status')

  const { data: customers } = await supabase.from('customers').select('id, company_name')

  const custNameMap: Record<string, string> = {}
  for (const c of customers || []) custNameMap[c.id] = c.company_name || 'Unknown'

  const invMap: Record<string, any> = {}
  for (const inv of invoices || []) invMap[inv.id] = inv

  const payPerInv: Record<string, number> = {}
  for (const p of payments || []) {
    payPerInv[p.invoice_id] = (payPerInv[p.invoice_id] || 0) + p.amount
  }

  // Aggregate by customer
  const custData: Record<string, {
    payCount: number; collected: number; invoiced: number; outstanding: number; delays: number[]
    prevCollected: number
  }> = {}

  for (const inv of invoices || []) {
    const custId = inv.customer_id
    if (!custId) continue
    if (!custData[custId]) custData[custId] = { payCount: 0, collected: 0, invoiced: 0, outstanding: 0, delays: [], prevCollected: 0 }
    custData[custId].invoiced += inv.total_amount

    const paid = payPerInv[inv.id] || 0
    custData[custId].collected += paid
    if (['sent', 'partially_paid', 'overdue'].includes(inv.status)) {
      custData[custId].outstanding += Math.max(0, inv.total_amount - paid)
    }
  }

  // Payment counts and delays
  for (const p of payments || []) {
    if ((p.status || 'completed') !== 'completed') continue
    const inv = invMap[p.invoice_id]
    if (!inv) continue
    const custId = inv.customer_id
    if (!custId || !custData[custId]) continue
    custData[custId].payCount++

    const delay = Math.floor(
      (new Date(p.payment_date).getTime() - new Date(inv.due_date).getTime()) / 86400000
    )
    custData[custId].delays.push(delay)

    // Growth: payments in current period vs previous
    if (p.payment_date >= startDate && p.payment_date <= endDate) {
      // counted in current
    }
  }

  return Object.entries(custData)
    .filter(([, v]) => v.payCount > 0)
    .map(([custId, v]) => ({
      customerId: custId,
      customerName: custNameMap[custId] || 'Unknown',
      paymentCount: v.payCount,
      totalCollected: v.collected,
      outstanding: v.outstanding,
      collectionRate: v.invoiced > 0 ? (v.collected / v.invoiced) * 100 : 0,
      avgPaymentDays: v.delays.length > 0
        ? Math.round(v.delays.reduce((s, d) => s + d, 0) / v.delays.length)
        : 0,
      growth: 0, // Would need previous period data for real growth calculation
    }))
    .sort((a, b) => b.totalCollected - a.totalCollected)
    .slice(0, 20)
}

// ── Duplicate Payment Check (Section 32) ─────────────────────────────────────

export interface DuplicatePaymentWarning {
  found: boolean
  existingPaymentId?: string
  amount?: number
  method?: string
  date?: string
  hoursAgo?: number
}

export async function checkDuplicatePayment(
  customerId: string,
  amount: number,
  paymentMethod: string
): Promise<DuplicatePaymentWarning> {
  const supabase = await createClient()

  // Find payments for invoices belonging to this customer in the last 48 hours
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 48)
  const cutoffStr = cutoff.toISOString()

  // Get customer's invoices
  const { data: customerInvoices } = await supabase
    .from('invoices')
    .select('id')
    .eq('customer_id', customerId)

  if (!customerInvoices || customerInvoices.length === 0) {
    return { found: false }
  }

  const invoiceIds = customerInvoices.map(i => i.id)

  // Check for similar payment
  const { data: similar } = await supabase
    .from('payments')
    .select('id, amount, payment_method, payment_date, created_at')
    .in('invoice_id', invoiceIds)
    .eq('amount', amount)
    .eq('payment_method', paymentMethod)
    .gte('created_at', cutoffStr)
    .limit(1)

  if (similar && similar.length > 0) {
    const hoursAgo = Math.round(
      (Date.now() - new Date(similar[0].created_at).getTime()) / 3600000
    )
    return {
      found: true,
      existingPaymentId: similar[0].id,
      amount: similar[0].amount,
      method: similar[0].payment_method,
      date: similar[0].payment_date,
      hoursAgo,
    }
  }

  return { found: false }
}

// ── Multi-Invoice Payment Allocation (Section 31) ────────────────────────────

export async function recordPaymentWithAllocations(formData: {
  invoice_id?: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number?: string
  notes?: string
  allocations?: Array<{ invoice_id: string; amount: number }>
}) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user?.id

  // Determine if single or multi-invoice
  const isMulti = formData.allocations && formData.allocations.length > 1

  // For single-invoice, use existing invoice_id
  const primaryInvoiceId = isMulti
    ? formData.allocations![0].invoice_id
    : formData.invoice_id

  if (!primaryInvoiceId) throw new Error('At least one invoice must be selected')

  // Validate total allocation matches payment amount
  if (isMulti) {
    const allocTotal = formData.allocations!.reduce((s, a) => s + a.amount, 0)
    if (Math.abs(allocTotal - formData.amount) > 0.01) {
      throw new Error(`Allocation total (${allocTotal}) does not match payment amount (${formData.amount})`)
    }
  }

  // Validate each allocation doesn't exceed invoice balance
  for (const alloc of formData.allocations || [{ invoice_id: primaryInvoiceId, amount: formData.amount }]) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, total_amount')
      .eq('id', alloc.invoice_id)
      .single()

    if (!inv) throw new Error(`Invoice ${alloc.invoice_id} not found`)

    const { data: existingPays } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', alloc.invoice_id)

    const totalPaid = (existingPays || []).reduce((s, p) => s + p.amount, 0)
    if (totalPaid + alloc.amount > inv.total_amount + 0.01) {
      throw new Error(`Allocation of ${alloc.amount} for invoice ${alloc.invoice_id} exceeds remaining balance of ${inv.total_amount - totalPaid}`)
    }
  }

  // Create payment record (primary invoice_id for backward compatibility)
  const { data: payment, error: payError } = await supabase
    .from('payments')
    .insert([{
      invoice_id: primaryInvoiceId,
      amount: formData.amount,
      payment_method: formData.payment_method,
      payment_date: formData.payment_date,
      reference_number: formData.reference_number || null,
      notes: formData.notes || null,
      recorded_by: user,
      status: 'completed',
    }])
    .select()
    .single()

  if (payError) throw new Error(`Failed to record payment: ${payError.message}`)

  // Create allocation records for multi-invoice
  if (isMulti && formData.allocations) {
    const allocRows = formData.allocations.map(a => ({
      payment_id: payment.id,
      invoice_id: a.invoice_id,
      amount: a.amount,
    }))

    const { error: allocError } = await supabase
      .from('payment_allocations')
      .insert(allocRows)

    if (allocError) {
      // Rollback payment
      await supabase.from('payments').delete().eq('id', payment.id)
      throw new Error(`Failed to create allocations: ${allocError.message}`)
    }

    // Recalculate status for each allocated invoice
    const { recalculateInvoiceStatus } = await import('./invoices')
    for (const alloc of formData.allocations) {
      await recalculateInvoiceStatus(alloc.invoice_id)
    }
  } else {
    // Single invoice — recalculate just that one
    const { recalculateInvoiceStatus } = await import('./invoices')
    await recalculateInvoiceStatus(primaryInvoiceId)
  }

  // Create timeline event
  const { data: inv } = await supabase
    .from('invoices')
    .select('booking_id')
    .eq('id', primaryInvoiceId)
    .single()

  if (inv?.booking_id) {
    await supabase.from('booking_timeline_events').insert([{
      booking_id: inv.booking_id,
      event_type: 'payment_received',
      description: isMulti
        ? `Payment of ${formData.amount} received across ${formData.allocations!.length} invoices`
        : `Payment of ${formData.amount} received for invoice`,
      created_by: user,
    }])
  }

  return payment
}

// ── Get Payment Allocations ──────────────────────────────────────────────────

export async function getPaymentAllocations(paymentId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payment_allocations')
    .select('*')
    .eq('payment_id', paymentId)

  if (error) return []

  // Enrich with invoice data
  const invoiceIds = (data || []).map(a => a.invoice_id)
  const { data: invoices } = invoiceIds.length > 0
    ? await supabase.from('invoices').select('id, invoice_number, total_amount').in('id', invoiceIds)
    : { data: [] }

  const invMap: Record<string, any> = {}
  for (const inv of invoices || []) invMap[inv.id] = inv

  // Get paid amounts per invoice
  const { data: pays } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount').in('invoice_id', invoiceIds)
    : { data: [] }

  const paidMap: Record<string, number> = {}
  for (const p of pays || []) {
    paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + p.amount
  }

  return (data || []).map(a => ({
    ...a,
    invoice_number: invMap[a.invoice_id]?.invoice_number,
    invoice_total: invMap[a.invoice_id]?.total_amount,
    invoice_remaining: invMap[a.invoice_id]
      ? Math.max(0, invMap[a.invoice_id].total_amount - (paidMap[a.invoice_id] || 0))
      : 0,
  }))
}

// ── Executive Summary for Hero ───────────────────────────────────────────────

export async function getPaymentHeroSummary(): Promise<{
  greeting: string
  collectedThisMonth: number
  paymentCountThisMonth: number
  outstandingAmount: number
}> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const today = now.toISOString().split('T')[0]

  const { data: monthPayments } = await supabase
    .from('payments')
    .select('amount, status')
    .gte('payment_date', monthStart)
    .lte('payment_date', today)

  const completed = (monthPayments || []).filter(p => (p.status || 'completed') === 'completed')
  const collectedThisMonth = completed.reduce((s, p) => s + p.amount, 0)

  // Outstanding
  const { data: outInvoices } = await supabase
    .from('invoices')
    .select('id, total_amount')
    .in('status', ['sent', 'partially_paid', 'overdue'])

  const { data: allPay } = await supabase.from('payments').select('invoice_id, amount')
  const payMap: Record<string, number> = {}
  for (const p of allPay || []) payMap[p.invoice_id] = (payMap[p.invoice_id] || 0) + p.amount

  let outstandingAmount = 0
  for (const inv of outInvoices || []) {
    outstandingAmount += Math.max(0, inv.total_amount - (payMap[inv.id] || 0))
  }

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return {
    greeting,
    collectedThisMonth,
    paymentCountThisMonth: completed.length,
    outstandingAmount,
  }
}

// ── Get Outstanding Invoices for Customer (Record Payment dialog) ────────────

export async function getCustomerOutstandingInvoices(customerId: string): Promise<Array<{
  id: string
  invoice_number: string
  total_amount: number
  paid_amount: number
  remaining: number
  due_date: string
  currency: string
}>> {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, due_date, currency, status')
    .eq('customer_id', customerId)
    .in('status', ['sent', 'partially_paid', 'overdue'])
    .order('due_date', { ascending: true })

  if (!invoices || invoices.length === 0) return []

  const invoiceIds = invoices.map(i => i.id)
  const { data: payments } = await supabase
    .from('payments')
    .select('invoice_id, amount')
    .in('invoice_id', invoiceIds)

  const paidMap: Record<string, number> = {}
  for (const p of payments || []) {
    paidMap[p.invoice_id] = (paidMap[p.invoice_id] || 0) + p.amount
  }

  return invoices.map(inv => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    total_amount: inv.total_amount,
    paid_amount: paidMap[inv.id] || 0,
    remaining: Math.max(0, inv.total_amount - (paidMap[inv.id] || 0)),
    due_date: inv.due_date,
    currency: inv.currency || 'USD',
  })).filter(inv => inv.remaining > 0)
}
