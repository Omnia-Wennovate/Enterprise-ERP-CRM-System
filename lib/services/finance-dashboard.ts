'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizeCurrency } from './currency'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FinanceDashboardKPIs {
  // Revenue & collections
  totalRevenue: number
  totalCollected: number
  outstandingReceivables: number
  // Supplier
  supplierPayables: number       // pending supplier payments
  supplierPaid: number           // paid supplier payments
  // Other costs
  totalCommissions: number       // all commissions (any status)
  commissionsPaid: number
  totalExpenses: number
  // Profit
  grossProfit: number            // revenue - supplier costs (total_cost from bookings)
  netProfit: number              // revenue - supplier_paid - commissions_paid - expenses
  // Counts for narrative
  overdueInvoiceCount: number
  overdueSupplierCount: number
  pendingCommissionCount: number
  // Period comparison (this month vs last month)
  revenueGrowthPct: number | null
}

export interface CashFlowPoint {
  label: string
  moneyIn: number
  moneyOut: number
  net: number
}

export interface FinancialAlert {
  type: 'overdue_invoice' | 'overdue_supplier' | 'pending_commission' | 'upcoming_supplier'
  message: string
  amount: number
  count: number
  href: string
}

export interface ActivityEvent {
  id: string
  event_type: string
  description: string
  created_at: string
  booking_id?: string
  booking_reference?: string
}

export interface ReconciliationItem {
  booking_id: string
  booking_reference: string
  stored_profit: number        // total_revenue - total_cost (DB column)
  component_profit: number     // payments_in - supplier_paid - commission_paid - expenses
  discrepancy: number          // abs difference
  payments_in: number
  supplier_paid: number
  commission_paid: number
  expenses: number
}

export interface CurrencyBreakdown {
  currency: string
  amount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date) { return d.toISOString().split('T')[0] }

function periodDates(months: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - months)
  return { start: fmt(start), end: fmt(end) }
}

// ── Main KPI aggregation ───────────────────────────────────────────────────────

export async function getFinanceDashboardKPIs(
  baseCurrency: string = 'USD'
): Promise<FinanceDashboardKPIs> {
  const supabase = await createClient()

  // 1. Revenue: sum of bookings.total_revenue
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_revenue, total_cost')

  const totalRevenue = (bookings || []).reduce((s, b) => s + (b.total_revenue || 0), 0)
  const totalCost    = (bookings || []).reduce((s, b) => s + (b.total_cost || 0), 0)

  // 2. Collected: sum of payments
  const { data: payments } = await supabase.from('payments').select('amount')
  const totalCollected = (payments || []).reduce((s, p) => s + (p.amount || 0), 0)

  // 3. Outstanding: sum of invoices.total_amount - collected (invoices not fully paid)
  const { data: openInvoices } = await supabase
    .from('invoices')
    .select('total_amount, status')
    .in('status', ['sent', 'draft', 'overdue', 'partially_paid'])
  const outstandingReceivables = (openInvoices || []).reduce((s, i) => s + (i.total_amount || 0), 0)

  // 4. Overdue invoice count
  const overdueInvoiceCount = (openInvoices || []).filter(i => i.status === 'overdue').length

  // 5. Supplier payables (pending)
  const { data: supplierPending } = await supabase
    .from('supplier_payments')
    .select('amount, status')
  const supplierPayables = (supplierPending || [])
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + (p.amount || 0), 0)
  const supplierPaid = (supplierPending || [])
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + (p.amount || 0), 0)

  // 6. Overdue supplier count
  const today = fmt(new Date())
  const { data: overdueSupplier } = await supabase
    .from('supplier_payments')
    .select('id')
    .eq('status', 'pending')
    .lt('due_date', today)
  const overdueSupplierCount = (overdueSupplier || []).length

  // 7. Commissions
  const { data: commissions } = await supabase
    .from('commissions')
    .select('commission_amount, status')
  const totalCommissions = (commissions || []).reduce((s, c) => s + (c.commission_amount || 0), 0)
  const commissionsPaid  = (commissions || []).filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0)
  const pendingCommissionCount = (commissions || []).filter(c => c.status === 'pending').length

  // 8. Expenses
  const { data: expenses } = await supabase.from('expenses').select('amount')
  const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0)

  // 9. Profit
  const grossProfit = totalRevenue - totalCost
  const netProfit   = totalRevenue - supplierPaid - commissionsPaid - totalExpenses

  // 10. Revenue growth (this month vs last month)
  const now = new Date()
  const thisMonthStart = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
  const lastMonthStart = fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1))
  const lastMonthEnd   = fmt(new Date(now.getFullYear(), now.getMonth(), 0))

  const { data: thisMonthPay } = await supabase
    .from('payments').select('amount').gte('payment_date', thisMonthStart)
  const { data: lastMonthPay } = await supabase
    .from('payments').select('amount')
    .gte('payment_date', lastMonthStart).lte('payment_date', lastMonthEnd)

  const thisM = (thisMonthPay || []).reduce((s, p) => s + p.amount, 0)
  const lastM = (lastMonthPay || []).reduce((s, p) => s + p.amount, 0)
  const revenueGrowthPct = lastM > 0 ? ((thisM - lastM) / lastM) * 100 : null

  return {
    totalRevenue, totalCollected, outstandingReceivables,
    supplierPayables, supplierPaid,
    totalCommissions, commissionsPaid, totalExpenses,
    grossProfit, netProfit,
    overdueInvoiceCount, overdueSupplierCount, pendingCommissionCount,
    revenueGrowthPct,
  }
}

// ── Currency breakdown ─────────────────────────────────────────────────────────

export async function getRevenueCurrencyBreakdown(): Promise<CurrencyBreakdown[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('total_amount, currency').eq('status', 'paid')
  const map: Record<string, number> = {}
  ;(data || []).forEach(i => {
    const c = i.currency || 'USD'
    map[c] = (map[c] || 0) + (i.total_amount || 0)
  })
  return Object.entries(map).map(([currency, amount]) => ({ currency, amount }))
}

// ── Cash flow chart data ───────────────────────────────────────────────────────

export async function getCashFlowData(period: '7d' | '30d' | '3m' | '6m' | '12m'): Promise<CashFlowPoint[]> {
  const supabase = await createClient()

  const monthsMap = { '7d': 0.25, '30d': 1, '3m': 3, '6m': 6, '12m': 12 }
  const months = monthsMap[period]
  const { start } = periodDates(months)

  // Money IN: payments
  const { data: inData } = await supabase
    .from('payments').select('amount, payment_date').gte('payment_date', start)

  // Money OUT: supplier_payments (paid), commissions (paid), expenses
  const { data: supplierOut } = await supabase
    .from('supplier_payments').select('amount, paid_date').eq('status', 'paid').gte('paid_date', start)
  const { data: commOut } = await supabase
    .from('commissions').select('commission_amount, created_at').eq('status', 'paid').gte('created_at', start)
  const { data: expOut } = await supabase
    .from('expenses').select('amount, expense_date').gte('expense_date', start)

  // Group by period label
  const groupKey = (dateStr: string): string => {
    const d = new Date(dateStr)
    if (period === '7d' || period === '30d') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  const inMap: Record<string, number> = {}
  const outMap: Record<string, number> = {}

  ;(inData || []).forEach(p => {
    const k = groupKey(p.payment_date)
    inMap[k] = (inMap[k] || 0) + (p.amount || 0)
  })
  ;(supplierOut || []).forEach(p => {
    if (!p.paid_date) return
    const k = groupKey(p.paid_date)
    outMap[k] = (outMap[k] || 0) + (p.amount || 0)
  })
  ;(commOut || []).forEach(c => {
    const k = groupKey(c.created_at)
    outMap[k] = (outMap[k] || 0) + (c.commission_amount || 0)
  })
  ;(expOut || []).forEach(e => {
    const k = groupKey(e.expense_date)
    outMap[k] = (outMap[k] || 0) + (e.amount || 0)
  })

  const allKeys = Array.from(new Set([...Object.keys(inMap), ...Object.keys(outMap)]))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return allKeys.map(label => {
    const moneyIn = inMap[label] || 0
    const moneyOut = outMap[label] || 0
    return { label, moneyIn, moneyOut, net: moneyIn - moneyOut }
  })
}

// ── Financial Alerts ──────────────────────────────────────────────────────────

export async function getFinancialAlerts(): Promise<FinancialAlert[]> {
  const supabase = await createClient()
  const alerts: FinancialAlert[] = []
  const today = fmt(new Date())
  const nextWeek = fmt(new Date(Date.now() + 7 * 86400000))

  // Overdue invoices
  const { data: overdueInv } = await supabase
    .from('invoices').select('total_amount').eq('status', 'overdue')
  if (overdueInv && overdueInv.length > 0) {
    alerts.push({
      type: 'overdue_invoice',
      message: `${overdueInv.length} overdue invoice${overdueInv.length > 1 ? 's' : ''} need attention`,
      amount: overdueInv.reduce((s, i) => s + (i.total_amount || 0), 0),
      count: overdueInv.length,
      href: '/finance/invoices',
    })
  }

  // Overdue supplier payments
  const { data: overdueSupp } = await supabase
    .from('supplier_payments').select('amount').eq('status', 'pending').lt('due_date', today)
  if (overdueSupp && overdueSupp.length > 0) {
    alerts.push({
      type: 'overdue_supplier',
      message: `${overdueSupp.length} supplier payment${overdueSupp.length > 1 ? 's' : ''} are overdue`,
      amount: overdueSupp.reduce((s, p) => s + (p.amount || 0), 0),
      count: overdueSupp.length,
      href: '/finance/supplier-payments',
    })
  }

  // Pending commissions
  const { data: pendingComm } = await supabase
    .from('commissions').select('commission_amount').eq('status', 'pending')
  if (pendingComm && pendingComm.length > 0) {
    alerts.push({
      type: 'pending_commission',
      message: `${pendingComm.length} commission${pendingComm.length > 1 ? 's' : ''} awaiting approval`,
      amount: pendingComm.reduce((s, c) => s + (c.commission_amount || 0), 0),
      count: pendingComm.length,
      href: '/finance/commissions',
    })
  }

  // Upcoming supplier payments (due this week)
  const { data: upcoming } = await supabase
    .from('supplier_payments').select('amount')
    .eq('status', 'pending').gte('due_date', today).lte('due_date', nextWeek)
  if (upcoming && upcoming.length > 0) {
    alerts.push({
      type: 'upcoming_supplier',
      message: `${upcoming.length} supplier payment${upcoming.length > 1 ? 's' : ''} due this week`,
      amount: upcoming.reduce((s, p) => s + (p.amount || 0), 0),
      count: upcoming.length,
      href: '/finance/supplier-payments',
    })
  }

  return alerts
}

// ── Activity Timeline ─────────────────────────────────────────────────────────

export async function getFinanceActivityTimeline(limit = 20): Promise<ActivityEvent[]> {
  const supabase = await createClient()
  const financeEventTypes = [
    'payment_received', 'invoice_generated', 'commission_calculated',
    'refund_initiated', 'refund_status_updated', 'cancellation_approved',
  ]

  const { data } = await supabase
    .from('booking_timeline_events')
    .select('id, event_type, description, created_at, booking_id')
    .in('event_type', financeEventTypes)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) return []

  // Enrich with booking references
  const bookingIds = [...new Set(data.filter(e => e.booking_id).map(e => e.booking_id!))]
  const { data: bookings } = await supabase
    .from('bookings').select('id, booking_reference').in('id', bookingIds)
  const bookingMap = Object.fromEntries((bookings || []).map(b => [b.id, b.booking_reference]))

  return data.map(e => ({
    id: e.id,
    event_type: e.event_type,
    description: e.description,
    created_at: e.created_at,
    booking_id: e.booking_id,
    booking_reference: e.booking_id ? bookingMap[e.booking_id] : undefined,
  }))
}

// ── Reconciliation ────────────────────────────────────────────────────────────

export async function getReconciliationCheck(): Promise<ReconciliationItem[]> {
  const supabase = await createClient()
  const TOLERANCE = 1 // ETB 1 rounding tolerance

  // Get all bookings with profit columns
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_reference, total_revenue, total_cost')
    .not('total_revenue', 'is', null)

  if (!bookings || bookings.length === 0) return []

  const bookingIds = bookings.map(b => b.id)

  // Customer payments received (via invoices)
  const { data: invoices } = await supabase
    .from('invoices').select('id, booking_id').in('booking_id', bookingIds)
  const invoiceIds = (invoices || []).map(i => i.id)
  const invoiceBookingMap = Object.fromEntries((invoices || []).map(i => [i.id, i.booking_id]))

  const { data: paymentsIn } = invoiceIds.length > 0
    ? await supabase.from('payments').select('invoice_id, amount').in('invoice_id', invoiceIds)
    : { data: [] }

  // Supplier payments paid per booking
  const { data: supplierOut } = await supabase
    .from('supplier_payments').select('booking_id, amount')
    .in('booking_id', bookingIds).eq('status', 'paid')

  // Commissions paid per booking
  const { data: commOut } = await supabase
    .from('commissions').select('booking_id, commission_amount')
    .in('booking_id', bookingIds).eq('status', 'paid')

  // Expenses per booking
  const { data: expOut } = await supabase
    .from('expenses').select('booking_id, amount')
    .in('booking_id', bookingIds.filter(Boolean))

  // Build maps
  const paymentsInByBooking: Record<string, number> = {}
  ;(paymentsIn || []).forEach(p => {
    const bId = invoiceBookingMap[p.invoice_id]
    if (bId) paymentsInByBooking[bId] = (paymentsInByBooking[bId] || 0) + p.amount
  })

  const supplierByBooking: Record<string, number> = {}
  ;(supplierOut || []).forEach(p => {
    if (p.booking_id) supplierByBooking[p.booking_id] = (supplierByBooking[p.booking_id] || 0) + p.amount
  })

  const commByBooking: Record<string, number> = {}
  ;(commOut || []).forEach(c => {
    commByBooking[c.booking_id] = (commByBooking[c.booking_id] || 0) + c.commission_amount
  })

  const expByBooking: Record<string, number> = {}
  ;(expOut || []).forEach(e => {
    if (e.booking_id) expByBooking[e.booking_id] = (expByBooking[e.booking_id] || 0) + e.amount
  })

  // Compare stored_profit vs component_profit for each booking
  const results: ReconciliationItem[] = []

  for (const booking of bookings) {
    const storedProfit = (booking.total_revenue || 0) - (booking.total_cost || 0)
    const paymentsIn_   = paymentsInByBooking[booking.id] || 0
    const supplierPaid_ = supplierByBooking[booking.id] || 0
    const commPaid_     = commByBooking[booking.id] || 0
    const expenses_     = expByBooking[booking.id] || 0
    const componentProfit = paymentsIn_ - supplierPaid_ - commPaid_ - expenses_

    const discrepancy = Math.abs(storedProfit - componentProfit)
    if (discrepancy > TOLERANCE) {
      results.push({
        booking_id: booking.id,
        booking_reference: booking.booking_reference || booking.id.slice(0, 8),
        stored_profit: storedProfit,
        component_profit: componentProfit,
        discrepancy,
        payments_in: paymentsIn_,
        supplier_paid: supplierPaid_,
        commission_paid: commPaid_,
        expenses: expenses_,
      })
    }
  }

  // Sort by largest discrepancy first
  return results.sort((a, b) => b.discrepancy - a.discrepancy)
}

// ── Executive Narrative ───────────────────────────────────────────────────────

export async function getExecutiveNarrative(kpis: FinanceDashboardKPIs): Promise<string[]> {
  const sentences: string[] = []
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  // Revenue growth
  if (kpis.revenueGrowthPct !== null) {
    const dir = kpis.revenueGrowthPct >= 0 ? 'up' : 'down'
    const pct = Math.abs(kpis.revenueGrowthPct).toFixed(1)
    sentences.push(`Revenue collections are ${dir} ${pct}% compared to last month.`)
  }

  // Outstanding receivables
  if (kpis.outstandingReceivables > 0) {
    const inv = kpis.overdueInvoiceCount
    const overdueNote = inv > 0 ? `, including ${inv} overdue invoice${inv > 1 ? 's' : ''}` : ''
    sentences.push(`Outstanding receivables total ${fmt(kpis.outstandingReceivables)} across open invoices${overdueNote}.`)
  }

  // Overdue supplier payments
  if (kpis.overdueSupplierCount > 0) {
    sentences.push(`${kpis.overdueSupplierCount} supplier payment${kpis.overdueSupplierCount > 1 ? 's are' : ' is'} overdue and require immediate action.`)
  } else {
    sentences.push('All supplier payments are current.')
  }

  // Pending commissions
  if (kpis.pendingCommissionCount > 0) {
    sentences.push(`${kpis.pendingCommissionCount} commission record${kpis.pendingCommissionCount > 1 ? 's are' : ' is'} pending approval.`)
  }

  return sentences
}
