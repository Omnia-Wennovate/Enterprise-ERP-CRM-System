'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  DollarSign, FileText, TrendingUp, TrendingDown, Clock,
  AlertTriangle, CheckCircle, XCircle, CreditCard, BarChart2,
  Calendar, Users, Plus, RefreshCw, Bell, Zap
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import PeriodSelector, { getDateRangesForPeriod, type PeriodType } from './components/PeriodSelector'
import InvoiceKPICard, { InvoiceKPICardSkeleton } from './components/InvoiceKPICard'
import ExecutiveSummary from './components/ExecutiveSummary'
import HealthScore from './components/HealthScore'
import InvoiceCharts from './components/InvoiceCharts'
import InvoiceTable from './components/InvoiceTable'
import InvoiceDetailDrawer from './components/InvoiceDetailDrawer'
import InvoiceAgingDashboard from './components/InvoiceAgingDashboard'
import CustomerLeaderboard from './components/CustomerLeaderboard'
import InvoiceCalendar from './components/InvoiceCalendar'
import ActivityFeed from './components/ActivityFeed'
import BoardReportButton from './components/BoardReportButton'
import EmptyState from './components/EmptyState'

import {
  fetchInvoiceKPIs,
  fetchInvoiceChartData,
  fetchInvoiceAgingBuckets,
  fetchCustomerLeaderboard,
  fetchInvoiceHealthScore,
  fetchRecentActivity,
  fetchInvoicesWithRelations,
} from '@/app/actions/invoices'

import type {
  InvoiceKPIs,
  InvoiceChartData,
  AgingBucket,
  CustomerLeaderboardEntry,
  InvoiceHealthScore,
  ActivityItem,
  InvoiceWithRelations,
} from '@/lib/services/invoice-dashboard'

const PERIOD_STORAGE_KEY = 'invoice_period_pref'
const PAGE_SIZE = 50

type TabKey = 'dashboard' | 'invoices' | 'aging' | 'calendar' | 'activity'

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { key: 'invoices',  label: 'Invoices',  icon: FileText },
  { key: 'aging',     label: 'Aging',     icon: Clock },
  { key: 'calendar',  label: 'Calendar',  icon: Calendar },
  { key: 'activity',  label: 'Activity',  icon: Zap },
]

export default function InvoicesPage() {
  // Period
  const [period, setPeriod] = useState<PeriodType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(PERIOD_STORAGE_KEY) as PeriodType) || 'monthly'
    }
    return 'monthly'
  })

  const handlePeriodChange = (p: PeriodType) => {
    setPeriod(p)
    localStorage.setItem(PERIOD_STORAGE_KEY, p)
  }

  const ranges = getDateRangesForPeriod(period)

  // Active tab
  const [tab, setTab] = useState<TabKey>('dashboard')

  // Data state
  const [kpis, setKpis] = useState<InvoiceKPIs | null>(null)
  const [chartData, setChartData] = useState<InvoiceChartData | null>(null)
  const [aging, setAging] = useState<AgingBucket[]>([])
  const [customers, setCustomers] = useState<CustomerLeaderboardEntry[]>([])
  const [health, setHealth] = useState<InvoiceHealthScore | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])

  // Invoice table state
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
  const [invoiceTotal, setInvoiceTotal] = useState(0)
  const [tablePage, setTablePage] = useState(1)
  const [search, setSearch] = useState('')
  const [tableFilter, setTableFilter] = useState<Record<string, string>>({})
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null)

  // Loading
  const [kpisLoading, setKpisLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(true)
  const [agingLoading, setAgingLoading] = useState(true)
  const [customersLoading, setCustomersLoading] = useState(true)
  const [healthLoading, setHealthLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)

  // Notifications badge
  const [notifCount, setNotifCount] = useState(0)

  // Load KPIs (period-sensitive)
  const loadKPIs = useCallback(async () => {
    setKpisLoading(true)
    try {
      const data = await fetchInvoiceKPIs(
        ranges.start, ranges.end,
        ranges.prevStart, ranges.prevEnd,
        ranges.label, ranges.compareLabel
      )
      setKpis(data)
      setNotifCount(data.overdueCount)
    } catch (e) {
      console.error('KPI load error:', e)
    } finally {
      setKpisLoading(false)
    }
  }, [ranges.start, ranges.end, ranges.prevStart, ranges.prevEnd, ranges.label, ranges.compareLabel])

  // Load charts (period-sensitive)
  const loadCharts = useCallback(async () => {
    setChartsLoading(true)
    try {
      const data = await fetchInvoiceChartData(ranges.start, ranges.end)
      setChartData(data)
    } catch (e) {
      console.error('Charts load error:', e)
    } finally {
      setChartsLoading(false)
    }
  }, [ranges.start, ranges.end])

  // Load invoice table
  const loadInvoices = useCallback(async () => {
    setTableLoading(true)
    try {
      const result = await fetchInvoicesWithRelations({
        search: search || undefined,
        status: tableFilter.status !== 'all' ? tableFilter.status : undefined,
        currency: tableFilter.currency,
        limit: PAGE_SIZE,
        offset: (tablePage - 1) * PAGE_SIZE,
      })
      setInvoices(result.data)
      setInvoiceTotal(result.total)
    } catch (e) {
      console.error('Invoices load error:', e)
    } finally {
      setTableLoading(false)
    }
  }, [search, tableFilter, tablePage])

  // Load supplementary data (not period-sensitive)
  const loadSupplementary = useCallback(async () => {
    setAgingLoading(true)
    setCustomersLoading(true)
    setHealthLoading(true)
    setActivityLoading(true)
    try {
      const [a, c, h, act] = await Promise.all([
        fetchInvoiceAgingBuckets(),
        fetchCustomerLeaderboard(ranges.start, ranges.end),
        fetchInvoiceHealthScore(),
        fetchRecentActivity(30),
      ])
      setAging(a)
      setCustomers(c)
      setHealth(h)
      setActivities(act)
    } catch (e) {
      console.error('Supplementary data error:', e)
    } finally {
      setAgingLoading(false)
      setCustomersLoading(false)
      setHealthLoading(false)
      setActivityLoading(false)
    }
  }, [ranges.start, ranges.end])

  // Initial load
  useEffect(() => { loadKPIs() }, [loadKPIs])
  useEffect(() => { loadCharts() }, [loadCharts])
  useEffect(() => { loadInvoices() }, [loadInvoices])
  useEffect(() => { loadSupplementary() }, [loadSupplementary])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('invoice-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        loadKPIs()
        loadCharts()
        loadInvoices()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadKPIs()
        loadCharts()
        loadInvoices()
        loadSupplementary()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadKPIs, loadCharts, loadInvoices, loadSupplementary])

  // Chart drill-through → filter table
  const handleChartClick = (filter: Record<string, string>) => {
    setTableFilter(filter)
    setTablePage(1)
    setTab('invoices')
  }

  // KPI click → filter table
  const handleKPIClick = (status: string) => {
    setTableFilter({ status })
    setTablePage(1)
    setTab('invoices')
  }

  // Aging click → filter
  const handleAgingClick = (bucket: string) => {
    setTableFilter({ aging: bucket })
    setTablePage(1)
    setTab('invoices')
  }

  // Calendar day click
  const handleCalendarDayClick = (date: string) => {
    setTableFilter({ due_date: date })
    setTablePage(1)
    setTab('invoices')
  }

  const handleSearch = (s: string) => {
    setSearch(s)
    setTablePage(1)
  }

  const clearFilters = () => {
    setTableFilter({})
    setSearch('')
    setTablePage(1)
  }

  const revChange = kpis && kpis.prevTotalRevenue > 0
    ? ((kpis.totalRevenue - kpis.prevTotalRevenue) / kpis.prevTotalRevenue) * 100
    : 0
  const outstandingChange = kpis && kpis.prevOutstandingBalance > 0
    ? ((kpis.outstandingBalance - kpis.prevOutstandingBalance) / kpis.prevOutstandingBalance) * 100
    : 0
  const collectionChange = kpis ? kpis.collectionRate - kpis.prevCollectionRate : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <FileText size={16} className="text-white"/>
              </span>
              Invoices
              {notifCount > 0 && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                  <Bell size={10}/> {notifCount} overdue
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enterprise revenue intelligence dashboard</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <BoardReportButton kpis={kpis} health={health} periodLabel={ranges.label} invoices={invoices}/>
            <button
              onClick={() => { loadKPIs(); loadCharts(); loadInvoices(); loadSupplementary() }}
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} className="text-muted-foreground"/>
            </button>
            <Link
              href="/finance/invoices/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={15}/>
              New Invoice
            </Link>
          </div>
        </div>

        {/* ── Period Selector + Executive Summary ── */}
        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <PeriodSelector value={period} onChange={handlePeriodChange}/>
          <div className="flex-1 min-w-[280px]">
            <ExecutiveSummary kpis={kpis} loading={kpisLoading} periodLabel={ranges.label}/>
          </div>
        </div>

        {/* ── KPI Cards Grid (17 cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          {kpisLoading ? (
            Array.from({ length: 12 }).map((_, i) => <InvoiceKPICardSkeleton key={i}/>)
          ) : kpis ? (
            <>
              <InvoiceKPICard label="Total Revenue" value={kpis.totalRevenue} format="currency" icon={DollarSign} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" change={revChange} compareLabel={ranges.compareLabel} onClick={() => handleKPIClick('paid')}/>
              <InvoiceKPICard label="Total Invoices" value={kpis.totalInvoices} format="number" icon={FileText} iconColor="text-slate-600" iconBg="bg-slate-100 dark:bg-slate-800" onClick={() => handleKPIClick('all')}/>
              <InvoiceKPICard label="Paid" value={kpis.paidCount} format="number" icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-100 dark:bg-emerald-900/30" change={(kpis.paidCount - kpis.prevPaidCount) / Math.max(1, kpis.prevPaidCount) * 100} compareLabel={ranges.compareLabel} onClick={() => handleKPIClick('paid')}/>
              <InvoiceKPICard label="Overdue" value={kpis.overdueCount} format="number" icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-100 dark:bg-red-900/30" onClick={() => handleKPIClick('overdue')}/>
              <InvoiceKPICard label="Outstanding" value={kpis.outstandingBalance} format="currency" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" change={outstandingChange} compareLabel={ranges.compareLabel} onClick={() => handleKPIClick('overdue')}/>
              <InvoiceKPICard label="Collection Rate" value={kpis.collectionRate} format="percent" icon={TrendingUp} iconColor="text-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/30" change={collectionChange} compareLabel={ranges.compareLabel}/>
              <InvoiceKPICard label="Draft" value={kpis.draftCount} format="number" icon={FileText} iconColor="text-slate-500" iconBg="bg-slate-100 dark:bg-slate-800" onClick={() => handleKPIClick('draft')}/>
              <InvoiceKPICard label="Sent" value={kpis.sentCount} format="number" icon={TrendingUp} iconColor="text-blue-500" iconBg="bg-blue-100 dark:bg-blue-900/30" onClick={() => handleKPIClick('sent')}/>
              <InvoiceKPICard label="Partially Paid" value={kpis.partiallyPaidCount} format="number" icon={CreditCard} iconColor="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-900/30" onClick={() => handleKPIClick('partially_paid')}/>
              <InvoiceKPICard label="Cancelled" value={kpis.cancelledCount} format="number" icon={XCircle} iconColor="text-gray-500" iconBg="bg-gray-100 dark:bg-gray-800" onClick={() => handleKPIClick('cancelled')}/>
              <InvoiceKPICard label="Avg. Invoice" value={kpis.avgInvoiceValue} format="currency" icon={BarChart2} iconColor="text-indigo-600" iconBg="bg-indigo-100 dark:bg-indigo-900/30"/>
              <InvoiceKPICard label="Tax Collected" value={kpis.taxCollected} format="currency" icon={DollarSign} iconColor="text-teal-600" iconBg="bg-teal-100 dark:bg-teal-900/30"/>
              <InvoiceKPICard label="Expected Revenue" value={kpis.expectedRevenue} format="currency" icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30"/>
              <InvoiceKPICard label="Avg. Payment Days" value={kpis.avgPaymentDays} format="days" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100 dark:bg-amber-900/30" subtitle={kpis.avgPaymentDays > 30 ? 'Slow — follow up' : kpis.avgPaymentDays > 0 ? 'Healthy' : 'No data'}/>
              <InvoiceKPICard label="Refund Amount" value={kpis.refundAmount} format="currency" icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-100 dark:bg-red-900/30"/>
            </>
          ) : null}
        </div>

        {/* ── Health Score ── */}
        {!healthLoading && health && (
          <div className="mb-6">
            <HealthScore health={health} loading={healthLoading}/>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 border-b border-border mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <t.icon size={14}/>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >

            {/* DASHBOARD TAB */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <InvoiceCharts chartData={chartData} loading={chartsLoading} onChartClick={handleChartClick}/>
              </div>
            )}

            {/* INVOICES TAB */}
            {tab === 'invoices' && (
              <>
                {!tableLoading && invoices.length === 0 && !search && Object.keys(tableFilter).length === 0 ? (
                  <EmptyState/>
                ) : !tableLoading && invoices.length === 0 && (search || Object.keys(tableFilter).length > 0) ? (
                  <EmptyState filtered onClearFilters={clearFilters}/>
                ) : (
                  <InvoiceTable
                    invoices={invoices}
                    total={invoiceTotal}
                    loading={tableLoading}
                    page={tablePage}
                    pageSize={PAGE_SIZE}
                    search={search}
                    activeFilter={tableFilter}
                    onPageChange={setTablePage}
                    onSearch={handleSearch}
                    onSelectInvoice={setSelectedInvoice}
                    onClearFilters={clearFilters}
                    onFilterChange={(f) => { setTableFilter(f); setTablePage(1) }}
                  />
                )}
              </>
            )}

            {/* AGING TAB */}
            {tab === 'aging' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-4">Invoice Aging Analysis</h2>
                  <InvoiceAgingDashboard buckets={aging} loading={agingLoading} onBucketClick={handleAgingClick}/>
                </div>
                <CustomerLeaderboard customers={customers} loading={customersLoading}/>
              </div>
            )}

            {/* CALENDAR TAB */}
            {tab === 'calendar' && (
              <InvoiceCalendar invoices={invoices} onDayClick={handleCalendarDayClick}/>
            )}

            {/* ACTIVITY TAB */}
            {tab === 'activity' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityFeed activities={activities} loading={activityLoading}/>
                {/* Notifications panel */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Bell size={14} className="text-amber-500"/>
                    Notifications
                    {notifCount > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{notifCount}</span>}
                  </h3>
                  {kpis && kpis.overdueCount > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/50 rounded-xl">
                        <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5"/>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{kpis.overdueCount} Overdue Invoice{kpis.overdueCount !== 1 ? 's' : ''}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Total outstanding: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(kpis.outstandingBalance)}
                          </div>
                        </div>
                        <button onClick={() => handleKPIClick('overdue')} className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">View →</button>
                      </div>
                      {kpis.collectionRate < 75 && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl">
                          <TrendingDown size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                          <div>
                            <div className="text-sm font-semibold text-foreground">Low Collection Rate</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Rate is {kpis.collectionRate.toFixed(1)}% — below 75% threshold</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <CheckCircle size={28} className="text-emerald-500 mb-2"/>
                      <div className="text-sm font-medium text-foreground">All clear</div>
                      <div className="text-xs text-muted-foreground">No alerts at this time</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </div>

      {/* ── Invoice Detail Drawer ── */}
      <InvoiceDetailDrawer invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)}/>

      {/* ── Floating Action Button ── */}
      <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-30">
        <Link
          href="/finance/invoices/new"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center"
          title="New Invoice"
        >
          <Plus size={22}/>
        </Link>
      </div>
    </div>
  )
}
