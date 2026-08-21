'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, Building2,
  Award, Receipt, AlertTriangle, CheckCircle, Clock, Activity,
  Zap, BarChart2, ArrowRight, Lock, Unlock, RefreshCw,
  ChevronRight, AlertCircle, FileText, Wallet, PiggyBank,
  Eye, EyeOff, Globe
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

import {
  fetchFinanceDashboardKPIs,
  fetchCashFlowData,
  fetchFinancialAlerts,
  fetchFinanceActivityTimeline,
  fetchReconciliationCheck,
  fetchRevenueCurrencyBreakdown,
  buildExecutiveNarrative,
  fetchPeriodLocks,
  lockPeriodAction,
  unlockPeriodAction,
} from '@/app/actions/finance-dashboard'

import { FinanceKPICard, FinanceKPICardSkeleton } from '@/components/finance/FinanceKPICard'
import { FinanceEmptyState } from '@/components/finance/FinanceEmptyState'

import type {
  FinanceDashboardKPIs,
  CashFlowPoint,
  FinancialAlert,
  ActivityEvent,
  ReconciliationItem,
  CurrencyBreakdown,
} from '@/lib/services/finance-dashboard'
import type { PeriodLock } from '@/lib/services/finance-period-locks'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENCY = 'ETB'
const fmt = (n: number) =>
  `${CURRENCY} ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const EVENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  payment_received:      { label: 'Payment Received',      icon: <DollarSign size={13} />,  color: 'text-emerald-500 bg-emerald-50' },
  invoice_generated:     { label: 'Invoice Created',       icon: <FileText size={13} />,     color: 'text-blue-500 bg-blue-50' },
  commission_calculated: { label: 'Commission Calculated', icon: <Award size={13} />,        color: 'text-[#C8A951] bg-[#C8A951]/10' },
  refund_initiated:      { label: 'Refund Initiated',      icon: <RefreshCw size={13} />,    color: 'text-red-400 bg-red-50' },
  refund_status_updated: { label: 'Refund Updated',        icon: <RefreshCw size={13} />,    color: 'text-slate-500 bg-slate-100' },
  cancellation_approved: { label: 'Cancellation Approved', icon: <CheckCircle size={13} />,  color: 'text-amber-500 bg-amber-50' },
}

type Tab = 'overview' | 'cashflow' | 'reconciliation' | 'periods'
type CashPeriod = '7d' | '30d' | '3m' | '6m' | '12m'

// ── Workflow Step ─────────────────────────────────────────────────────────────

function WorkflowStep({ label, href, isLast }: { label: string; href: string; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <Link
        href={href}
        className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#C8A951]/30 text-[#0A1221] rounded-lg hover:bg-[#C8A951]/10 hover:border-[#C8A951] transition-all duration-150"
      >
        {label}
      </Link>
      {!isLast && <ChevronRight size={12} className="text-[#C8A951] flex-shrink-0" />}
    </div>
  )
}

// ── Custom Chart Tooltip ──────────────────────────────────────────────────────

function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A1221] text-white rounded-xl px-4 py-3 text-xs shadow-xl border border-white/10">
      <p className="font-semibold mb-2 text-[#C8A951]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-bold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Alert Card ────────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: FinancialAlert }) {
  const typeConfig = {
    overdue_invoice:  { icon: <AlertCircle size={16} />, color: 'border-red-200 bg-red-50', iconColor: 'text-red-500' },
    overdue_supplier: { icon: <Building2 size={16} />,   color: 'border-red-200 bg-red-50', iconColor: 'text-red-500' },
    pending_commission:{ icon: <Award size={16} />,       color: 'border-amber-200 bg-amber-50', iconColor: 'text-amber-600' },
    upcoming_supplier: { icon: <Clock size={16} />,       color: 'border-blue-200 bg-blue-50', iconColor: 'text-blue-500' },
  }
  const cfg = typeConfig[alert.type]
  return (
    <Link href={alert.href}>
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${cfg.color} hover:opacity-80 transition-opacity cursor-pointer`}>
        <span className={cfg.iconColor}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#0A1221] leading-tight">{alert.message}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{fmt(alert.amount)}</p>
        </div>
        <ArrowRight size={12} className="text-slate-400 flex-shrink-0" />
      </div>
    </Link>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FinanceDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [cashPeriod, setCashPeriod] = useState<CashPeriod>('30d')
  const [baseCurrencyMode, setBaseCurrencyMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cashLoading, setCashLoading] = useState(false)

  // Data state
  const [kpis, setKpis] = useState<FinanceDashboardKPIs | null>(null)
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([])
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [reconciliation, setReconciliation] = useState<ReconciliationItem[]>([])
  const [currencyBreakdown, setCurrencyBreakdown] = useState<CurrencyBreakdown[]>([])
  const [narrative, setNarrative] = useState<string[]>([])
  const [periodLocks, setPeriodLocks] = useState<PeriodLock[]>([])

  // Period lock modal state
  const [lockModal, setLockModal] = useState<{ open: boolean; action: 'lock' | 'unlock'; month: number; year: number } | null>(null)
  const [unlockReason, setUnlockReason] = useState('')
  const [lockLoading, setLockLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [kpisData, alertsData, activityData, currencyData, locksData] = await Promise.all([
        fetchFinanceDashboardKPIs(),
        fetchFinancialAlerts(),
        fetchFinanceActivityTimeline(15),
        fetchRevenueCurrencyBreakdown(),
        fetchPeriodLocks(),
      ])
      setKpis(kpisData)
      setAlerts(alertsData)
      setActivity(activityData)
      setCurrencyBreakdown(currencyData)
      setPeriodLocks(locksData)
      const narrativeData = await buildExecutiveNarrative(kpisData)
      setNarrative(narrativeData)
    } catch (e) {
      console.error('Finance dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCashFlow = useCallback(async () => {
    setCashLoading(true)
    try {
      const data = await fetchCashFlowData(cashPeriod)
      setCashFlow(data)
    } catch (e) {
      console.error('Cash flow load error:', e)
    } finally {
      setCashLoading(false)
    }
  }, [cashPeriod])

  const loadReconciliation = useCallback(async () => {
    try {
      const data = await fetchReconciliationCheck()
      setReconciliation(data)
    } catch (e) {
      console.error('Reconciliation load error:', e)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])
  useEffect(() => { loadCashFlow() }, [loadCashFlow])
  useEffect(() => {
    if (tab === 'reconciliation') loadReconciliation()
  }, [tab, loadReconciliation])

  const handlePeriodAction = async () => {
    if (!lockModal) return
    setLockLoading(true)
    try {
      if (lockModal.action === 'lock') {
        await lockPeriodAction(lockModal.month, lockModal.year)
      } else {
        await unlockPeriodAction(lockModal.month, lockModal.year, unlockReason)
      }
      setLockModal(null)
      setUnlockReason('')
      const locksData = await fetchPeriodLocks()
      setPeriodLocks(locksData)
    } catch (e) {
      alert(`Action failed: ${e}`)
    } finally {
      setLockLoading(false)
    }
  }

  // KPI data driven from real numbers
  const kpiCards = kpis ? [
    {
      title: 'Total Revenue',
      value: fmt(kpis.totalRevenue),
      icon: <TrendingUp size={18} />,
      trend: kpis.revenueGrowthPct ?? undefined,
      trendLabel: kpis.revenueGrowthPct !== null ? 'vs last month' : undefined,
      status: 'neutral' as const,
      href: '/finance/invoices',
      accent: true,
      currencyBreakdown: baseCurrencyMode
        ? undefined
        : currencyBreakdown.map(c => `${c.currency} ${c.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`).join(' · ') || undefined,
    },
    {
      title: 'Total Collected',
      value: fmt(kpis.totalCollected),
      icon: <Wallet size={18} />,
      status: 'positive' as const,
      href: '/finance/payments',
    },
    {
      title: 'Outstanding Receivables',
      value: fmt(kpis.outstandingReceivables),
      icon: <Clock size={18} />,
      status: kpis.outstandingReceivables > 0 ? 'warning' as const : 'positive' as const,
      subValue: kpis.overdueInvoiceCount > 0 ? `${kpis.overdueInvoiceCount} overdue` : 'All current',
      href: '/finance/invoices',
    },
    {
      title: 'Supplier Payables',
      value: fmt(kpis.supplierPayables),
      icon: <Building2 size={18} />,
      status: kpis.overdueSupplierCount > 0 ? 'negative' as const : 'neutral' as const,
      subValue: kpis.overdueSupplierCount > 0 ? `${kpis.overdueSupplierCount} overdue` : 'All current',
      href: '/finance/supplier-payments',
    },
    {
      title: 'Supplier Payments Paid',
      value: fmt(kpis.supplierPaid),
      icon: <CreditCard size={18} />,
      status: 'neutral' as const,
      href: '/finance/supplier-payments',
    },
    {
      title: 'Commissions',
      value: fmt(kpis.totalCommissions),
      icon: <Award size={18} />,
      status: kpis.pendingCommissionCount > 0 ? 'warning' as const : 'neutral' as const,
      subValue: kpis.pendingCommissionCount > 0 ? `${kpis.pendingCommissionCount} pending approval` : 'All settled',
      href: '/finance/commissions',
    },
    {
      title: 'Total Expenses',
      value: fmt(kpis.totalExpenses),
      icon: <Receipt size={18} />,
      status: 'neutral' as const,
      href: '/finance/expenses',
    },
    {
      title: 'Gross Profit',
      value: fmt(kpis.grossProfit),
      icon: <BarChart2 size={18} />,
      status: kpis.grossProfit >= 0 ? 'positive' as const : 'negative' as const,
      subValue: 'Revenue − Supplier Costs',
    },
    {
      title: 'Net Profit',
      value: fmt(kpis.netProfit),
      icon: <PiggyBank size={18} />,
      status: kpis.netProfit >= 0 ? 'positive' as const : 'negative' as const,
      subValue: 'After all outflows',
      accent: true,
    },
  ] : []

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',        label: 'Overview',        icon: <BarChart2 size={14} /> },
    { key: 'cashflow',        label: 'Cash Flow',       icon: <Activity size={14} /> },
    { key: 'reconciliation',  label: 'Reconciliation',  icon: <CheckCircle size={14} /> },
    { key: 'periods',         label: 'Period Close',    icon: <Lock size={14} /> },
  ]

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#0A1221] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[#C8A951] text-xs font-bold tracking-[0.25em] uppercase mb-1">
                Financial Operations Center
              </p>
              <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Customer → Booking → Invoice → Payment → Revenue → Costs → Profit
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Base currency toggle */}
              <button
                onClick={() => setBaseCurrencyMode(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-all
                  ${baseCurrencyMode
                    ? 'bg-[#C8A951] text-[#0A1221] border-[#C8A951]'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'}`}
                title={baseCurrencyMode ? 'Showing base currency equivalent' : 'Showing raw multi-currency totals'}
              >
                <Globe size={13} />
                {baseCurrencyMode ? 'Base Currency' : 'Multi-Currency'}
              </button>
              <button
                onClick={loadDashboard}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all"
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>

          {/* Financial Workflow Strip */}
          <div className="mt-5 flex flex-wrap items-center gap-1">
            {[
              { label: 'Customers', href: '/crm/customers' },
              { label: 'Bookings', href: '/bookings' },
              { label: 'Invoices', href: '/finance/invoices' },
              { label: 'Payments', href: '/finance/payments' },
              { label: 'Revenue', href: '/finance/invoices' },
              { label: 'Supplier Costs', href: '/finance/supplier-payments' },
              { label: 'Commissions', href: '/finance/commissions' },
              { label: 'Expenses', href: '/finance/expenses' },
              { label: 'Profit', href: '/finance', isLast: true },
            ].map((s, i, arr) => (
              <WorkflowStep key={s.label} label={s.label} href={s.href} isLast={i === arr.length - 1} />
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all
                  ${tab === t.key
                    ? 'border-[#C8A951] text-[#C8A951]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── EXECUTIVE NARRATIVE ─────────────────────────────────────────── */}
        {narrative.length > 0 && !loading && (
          <div className="bg-[#0A1221]/5 border border-[#C8A951]/20 rounded-2xl px-5 py-4 mb-6">
            <p className="text-[10px] font-bold text-[#C8A951] uppercase tracking-widest mb-2">Executive Summary</p>
            <p className="text-sm text-[#0A1221] leading-relaxed">
              {narrative.join(' ')}
            </p>
          </div>
        )}

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => <FinanceKPICardSkeleton key={i} />)
                : kpiCards.map((card) => (
                    <FinanceKPICard key={card.title} {...card} loading={false} />
                  ))
              }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Profit breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profit Overview */}
                {kpis && (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6">
                    <h2 className="text-sm font-bold text-[#0A1221] mb-4 flex items-center gap-2">
                      <BarChart2 size={16} className="text-[#C8A951]" />
                      Profit Overview — Where the Money Goes
                    </h2>
                    {[
                      { label: 'Revenue', value: kpis.totalRevenue, color: 'bg-emerald-500' },
                      { label: '− Supplier Costs', value: -kpis.supplierPaid, color: 'bg-red-400' },
                      { label: '− Commissions Paid', value: -kpis.commissionsPaid, color: 'bg-amber-400' },
                      { label: '− Expenses', value: -kpis.totalExpenses, color: 'bg-orange-400' },
                    ].map(row => {
                      const barPct = kpis.totalRevenue > 0
                        ? Math.min(100, (Math.abs(row.value) / kpis.totalRevenue) * 100)
                        : 0
                      return (
                        <div key={row.label} className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium">{row.label}</span>
                            <span className={`font-bold font-mono ${row.value < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {row.value < 0 ? '−' : ''}{fmt(Math.abs(row.value))}
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${barPct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-[#0A1221]">Net Profit</span>
                      <span className={`text-lg font-bold font-mono ${kpis.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {kpis.netProfit < 0 ? '−' : ''}{fmt(Math.abs(kpis.netProfit))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Activity Timeline */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-sm font-bold text-[#0A1221] mb-4 flex items-center gap-2">
                    <Zap size={16} className="text-[#C8A951]" />
                    Finance Activity Timeline
                  </h2>
                  {activity.length === 0 ? (
                    <FinanceEmptyState
                      title="No finance events yet"
                      description="Payment, invoice, and commission events will appear here."
                      icon={<Activity size={24} strokeWidth={1.5} />}
                    />
                  ) : (
                    <div className="space-y-1">
                      {activity.map(evt => {
                        const meta = EVENT_META[evt.event_type] ?? { label: evt.event_type, icon: <Activity size={13} />, color: 'text-slate-500 bg-slate-100' }
                        return (
                          <div key={evt.id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.color}`}>
                              {meta.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#0A1221]">{meta.label}</p>
                              <p className="text-[11px] text-slate-500 truncate">{evt.description}</p>
                              {evt.booking_reference && (
                                <Link href={`/bookings`} className="text-[10px] text-[#C8A951] hover:underline">
                                  {evt.booking_reference}
                                </Link>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {new Date(evt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Alerts */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="text-sm font-bold text-[#0A1221] mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-[#C8A951]" />
                    Financial Alerts
                  </h2>
                  {alerts.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-sm font-semibold text-emerald-600">Everything is up to date</p>
                      <p className="text-xs text-slate-400 mt-1">No outstanding alerts</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {alerts.map((a, i) => <AlertCard key={i} alert={a} />)}
                    </div>
                  )}
                </div>

                {/* Quick Links */}
                <div className="bg-[#0A1221] rounded-2xl p-5">
                  <p className="text-[#C8A951] text-xs font-bold uppercase tracking-widest mb-4">Finance Modules</p>
                  {[
                    { label: 'Invoices', href: '/finance/invoices', icon: <FileText size={14} /> },
                    { label: 'Payments', href: '/finance/payments', icon: <CreditCard size={14} /> },
                    { label: 'Supplier Payments', href: '/finance/supplier-payments', icon: <Building2 size={14} /> },
                    { label: 'Commissions', href: '/finance/commissions', icon: <Award size={14} /> },
                    { label: 'Expenses', href: '/finance/expenses', icon: <Receipt size={14} /> },
                    { label: 'Refunds', href: '/finance/refunds', icon: <RefreshCw size={14} /> },
                  ].map(l => (
                    <Link key={l.label} href={l.href}
                      className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 text-slate-300 hover:text-[#C8A951] transition-colors group"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium">
                        <span className="text-[#C8A951]/60 group-hover:text-[#C8A951]">{l.icon}</span>
                        {l.label}
                      </span>
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── CASH FLOW TAB ──────────────────────────────────────────────────── */}
        {tab === 'cashflow' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-[#0A1221] flex items-center gap-2">
                <Activity size={16} className="text-[#C8A951]" />
                Cash Flow — Money In vs Money Out
              </h2>
              <div className="flex gap-1">
                {(['7d', '30d', '3m', '6m', '12m'] as CashPeriod[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setCashPeriod(p)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                      ${cashPeriod === p
                        ? 'bg-[#0A1221] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {cashLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw size={20} className="animate-spin mr-2" /> Loading chart...
              </div>
            ) : cashFlow.length === 0 ? (
              <FinanceEmptyState
                title="No cash flow data for this period"
                description="Payments and outflows will appear here once records exist."
                icon={<Activity size={24} strokeWidth={1.5} />}
              />
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip content={<CashFlowTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="moneyIn"  name="Money In"  stroke="#10b981" strokeWidth={2} fill="url(#inGrad)" />
                  <Area type="monotone" dataKey="moneyOut" name="Money Out" stroke="#ef4444" strokeWidth={2} fill="url(#outGrad)" />
                  <Area type="monotone" dataKey="net"      name="Net"       stroke="#C8A951" strokeWidth={2} fill="none" strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            <div className="mt-4 grid grid-cols-3 gap-4">
              {[
                { label: 'Total In', value: cashFlow.reduce((s, d) => s + d.moneyIn, 0), color: 'text-emerald-600' },
                { label: 'Total Out', value: cashFlow.reduce((s, d) => s + d.moneyOut, 0), color: 'text-red-500' },
                { label: 'Net', value: cashFlow.reduce((s, d) => s + d.net, 0), color: 'text-[#C8A951]' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`text-lg font-bold font-mono ${item.color}`}>{fmt(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RECONCILIATION TAB ─────────────────────────────────────────────── */}
        {tab === 'reconciliation' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-[#0A1221] flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#C8A951]" />
                  Financial Reconciliation Check
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Compares stored booking profit (revenue − cost) vs. component sum (payments − outflows). Flags discrepancies &gt; ETB 1.
                </p>
              </div>
              <button onClick={loadReconciliation}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {reconciliation.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-base font-bold text-emerald-600">All bookings reconcile cleanly</p>
                <p className="text-xs text-slate-400 mt-1">No discrepancies detected between stored profit and component totals</p>
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-bold text-amber-800">
                    {reconciliation.length} booking{reconciliation.length > 1 ? 's' : ''} with discrepancies detected.
                    Review recommended — this may indicate missing payment entries or duplicate expenses.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Booking', 'Stored Profit', 'Component Profit', 'Discrepancy', 'Payments In', 'Supplier Paid', 'Commission Paid', 'Expenses'].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.map(item => (
                        <tr key={item.booking_id} className="border-b border-slate-50 hover:bg-amber-50/50">
                          <td className="px-3 py-3 font-semibold text-[#0A1221]">{item.booking_reference}</td>
                          <td className="px-3 py-3 font-mono text-slate-700">{fmt(item.stored_profit)}</td>
                          <td className="px-3 py-3 font-mono text-slate-700">{fmt(item.component_profit)}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold font-mono">
                              <AlertTriangle size={10} />
                              {fmt(item.discrepancy)}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-slate-500">{fmt(item.payments_in)}</td>
                          <td className="px-3 py-3 font-mono text-slate-500">{fmt(item.supplier_paid)}</td>
                          <td className="px-3 py-3 font-mono text-slate-500">{fmt(item.commission_paid)}</td>
                          <td className="px-3 py-3 font-mono text-slate-500">{fmt(item.expenses)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PERIOD CLOSE TAB ───────────────────────────────────────────────── */}
        {tab === 'periods' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-[#0A1221] flex items-center gap-2">
                  <Lock size={16} className="text-[#C8A951]" />
                  Period Close Management
                </h2>
                <button
                  onClick={() => {
                    const now = new Date()
                    setLockModal({ open: true, action: 'lock', month: now.getMonth() + 1, year: now.getFullYear() })
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#0A1221] text-white rounded-lg hover:bg-[#0A1221]/90 transition-all"
                >
                  <Lock size={12} /> Close Current Period
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Closing a period prevents edits to invoices, payments, and expenses dated within it. Finance Admin only.
              </p>

              {periodLocks.length === 0 ? (
                <FinanceEmptyState
                  title="No periods have been closed yet"
                  description="Close a period to prevent further edits to historical financial data."
                  icon={<Lock size={24} strokeWidth={1.5} />}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Period', 'Status', 'Locked At', 'Locked By', 'Last Reopened', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periodLocks.map(lock => {
                        const monthName = new Date(lock.period_year, lock.period_month - 1).toLocaleString('en-US', { month: 'long' })
                        return (
                          <tr key={lock.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-[#0A1221]">{monthName} {lock.period_year}</td>
                            <td className="px-4 py-3">
                              {lock.is_locked
                                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold"><Lock size={9} /> Closed</span>
                                : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold"><Unlock size={9} /> Open</span>
                              }
                            </td>
                            <td className="px-4 py-3 text-slate-500">{new Date(lock.locked_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-500">{lock.locked_by?.slice(0, 8) || '—'}</td>
                            <td className="px-4 py-3 text-slate-500">{lock.unlocked_at ? new Date(lock.unlocked_at).toLocaleDateString() : '—'}</td>
                            <td className="px-4 py-3">
                              {lock.is_locked ? (
                                <button
                                  onClick={() => setLockModal({ open: true, action: 'unlock', month: lock.period_month, year: lock.period_year })}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all"
                                >
                                  <Unlock size={10} /> Reopen
                                </button>
                              ) : (
                                <button
                                  onClick={() => setLockModal({ open: true, action: 'lock', month: lock.period_month, year: lock.period_year })}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-all"
                                >
                                  <Lock size={10} /> Close
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── PERIOD LOCK MODAL ──────────────────────────────────────────────── */}
      {lockModal?.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#0A1221] mb-1">
              {lockModal.action === 'lock' ? 'Close Financial Period' : 'Reopen Financial Period'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lockModal.action === 'lock'
                ? `Closing ${new Date(lockModal.year, lockModal.month - 1).toLocaleString('en-US', { month: 'long' })} ${lockModal.year} will prevent edits to all financial records in this period.`
                : `Reopening this period will allow edits. This action is logged.`
              }
            </p>
            {lockModal.action === 'unlock' && (
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 resize-none focus:outline-none focus:border-[#C8A951]"
                rows={3}
                placeholder="Reason for reopening (required)..."
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setLockModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePeriodAction}
                disabled={lockLoading || (lockModal.action === 'unlock' && !unlockReason.trim())}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#0A1221] text-white rounded-xl hover:bg-[#0A1221]/90 disabled:opacity-50 transition-all"
              >
                {lockLoading ? 'Processing...' : lockModal.action === 'lock' ? 'Close Period' : 'Reopen Period'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
