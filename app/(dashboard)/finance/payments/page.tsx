'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, TrendingUp, Clock, AlertTriangle, CreditCard,
  BarChart2, Calendar, Zap, Download, Target
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Server Actions
import {
  fetchPaymentKPIs,
  fetchPaymentChartData,
  fetchPaymentAgingBuckets,
  fetchCollectionHealthScore,
  fetchSmartCollectionSummary,
  fetchPaymentsWithRelations,
  fetchRecentPaymentActivity,
  fetchCashFlowForecast,
  fetchPaymentMethodReliability,
  fetchCollectionsIntelligence,
  fetchPaymentCustomerLeaderboard,
  fetchPaymentHeroSummary,
} from '@/app/actions/payments'

// Types
import type {
  PaymentKPIs,
  PaymentChartData,
  PaymentAgingBucket,
  CollectionHealthScore,
  PaymentWithRelations,
  PaymentFilter,
  CashFlowProjection,
  PaymentMethodReliability,
  CollectionsIntelligence,
} from '@/types/finance'

// Components
import PaymentPeriodSelector, { getPaymentDateRanges, type PaymentPeriodType } from './components/PaymentPeriodSelector'
import PaymentHero from './components/PaymentHero'
import PaymentKPICards from './components/PaymentKPICards'
import PaymentCharts from './components/PaymentCharts'
import CollectionHealthScoreComponent from './components/CollectionHealthScore'
import SmartCollectionSummary from './components/SmartCollectionSummary'
import PaymentTable from './components/PaymentTable'
import PaymentEmptyState from './components/PaymentEmptyState'
import PaymentDetailDrawer from './components/PaymentDetailDrawer'
import RecordPaymentDialog from './components/RecordPaymentDialog'

const PERIOD_STORAGE_KEY = 'payment_period_pref'
const PAGE_SIZE = 50

type TabKey = 'dashboard' | 'payments' | 'calendar' | 'activity' | 'intelligence'

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { key: 'payments',  label: 'Payments',  icon: FileText },
  { key: 'calendar',  label: 'Calendar',  icon: Calendar },
  { key: 'activity',  label: 'Activity',  icon: Zap },
  { key: 'intelligence', label: 'Intelligence', icon: Target },
]

export default function FinancePaymentsPage() {
  // ── Period State ──
  const [period, setPeriod] = useState<PaymentPeriodType>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(PERIOD_STORAGE_KEY) as PaymentPeriodType) || 'month'
    }
    return 'month'
  })

  const handlePeriodChange = (p: PaymentPeriodType) => {
    setPeriod(p)
    localStorage.setItem(PERIOD_STORAGE_KEY, p)
  }

  const ranges = getPaymentDateRanges(period)

  // ── UI State ──
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null)

  // ── Data State ──
  const [heroSummary, setHeroSummary] = useState<any>(null)
  const [kpis, setKpis] = useState<PaymentKPIs | null>(null)
  const [chartData, setChartData] = useState<PaymentChartData | null>(null)
  const [healthScore, setHealthScore] = useState<CollectionHealthScore | null>(null)
  const [smartSummary, setSmartSummary] = useState<string>('')
  const [reliability, setReliability] = useState<PaymentMethodReliability[]>([])
  const [forecast, setForecast] = useState<CashFlowProjection[]>([])

  // Table State
  const [payments, setPayments] = useState<PaymentWithRelations[]>([])
  const [totalPayments, setTotalPayments] = useState(0)
  const [tablePage, setTablePage] = useState(1)
  const [tableFilters, setTableFilters] = useState<PaymentFilter>({})

  // Loading States
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)

  const supabase = createClient()

  // ── Fetching Data ──

  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingDashboard(true)
      const [
        heroData,
        kpiData,
        charts,
        health,
        summary,
        relData,
        forecastData,
      ] = await Promise.all([
        fetchPaymentHeroSummary(),
        fetchPaymentKPIs(ranges.start, ranges.end, ranges.prevStart, ranges.prevEnd, ranges.label, ranges.compareLabel),
        fetchPaymentChartData(ranges.start, ranges.end),
        fetchCollectionHealthScore(),
        fetchSmartCollectionSummary(ranges.start, ranges.end, ranges.prevStart, ranges.prevEnd),
        fetchPaymentMethodReliability(),
        fetchCashFlowForecast(),
      ])

      setHeroSummary(heroData)
      setKpis(kpiData)
      setChartData(charts)
      setHealthScore(health)
      setSmartSummary(summary)
      setReliability(relData)
      setForecast(forecastData)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoadingDashboard(false)
      setLoadingInitial(false)
    }
  }, [ranges.start, ranges.end, ranges.prevStart, ranges.prevEnd, ranges.label, ranges.compareLabel])

  const loadTableData = useCallback(async () => {
    try {
      setLoadingTable(true)
      const result = await fetchPaymentsWithRelations({
        ...tableFilters,
        limit: PAGE_SIZE,
        offset: (tablePage - 1) * PAGE_SIZE,
      })
      setPayments(result.data)
      setTotalPayments(result.total)
    } catch (err) {
      console.error('Failed to load payments table:', err)
    } finally {
      setLoadingTable(false)
    }
  }, [tableFilters, tablePage])

  // Effects
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  useEffect(() => {
    loadTableData()
  }, [loadTableData])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('payments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        loadDashboardData()
        loadTableData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, loadDashboardData, loadTableData])

  // ── Handlers ──

  const handleTableFilterChange = (newFilters: Partial<PaymentFilter>) => {
    setTableFilters(prev => ({ ...prev, ...newFilters }))
    setTablePage(1)
  }

  const handleDrillDown = (filter: Record<string, string>) => {
    setTableFilters(prev => ({ ...prev, ...filter }))
    setTablePage(1)
    setActiveTab('payments')
    
    // Smooth scroll to tabs
    document.getElementById('payment-tabs')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleExport = () => {
    // Basic CSV export for now
    if (payments.length === 0) return
    
    const headers = ['Date', 'Customer', 'Invoice', 'Amount', 'Currency', 'Method', 'Status', 'Reference', 'Recorded By']
    const csvRows = payments.map(p => [
      new Date(p.payment_date).toLocaleDateString(),
      `"${p.customer_name || ''}"`,
      p.invoice_number || '',
      p.amount.toString(),
      p.invoice_currency || 'USD',
      p.payment_method,
      p.status || 'completed',
      `"${p.reference_number || ''}"`,
      `"${p.recorded_by_name || ''}"`
    ])
    
    const csvContent = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  // If no payments ever exist, show empty state
  if (!loadingInitial && kpis?.totalPayments === 0 && !tableFilters.search) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
          <PaymentEmptyState onRecordPayment={() => setIsRecordModalOpen(true)} />
        </div>
        <RecordPaymentDialog
          open={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSuccess={() => {
            loadDashboardData()
            loadTableData()
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Hero Section */}
        <PaymentHero
          greeting={heroSummary?.greeting || 'Welcome'}
          collectedThisMonth={heroSummary?.collectedThisMonth || 0}
          paymentCountThisMonth={heroSummary?.paymentCountThisMonth || 0}
          outstandingAmount={heroSummary?.outstandingAmount || 0}
          periodLabel={ranges.label}
          loading={loadingDashboard}
          onRecordPayment={() => setIsRecordModalOpen(true)}
          onExport={handleExport}
        />

        {/* Header / Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-omnia-gold/100/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-omnia-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Analytics Overview</h2>
              <p className="text-sm text-muted-foreground">Performance metrics and trends</p>
            </div>
          </div>
          <PaymentPeriodSelector value={period} onChange={handlePeriodChange} />
        </div>

        {/* KPIs */}
        <PaymentKPICards
          kpis={kpis}
          loading={loadingDashboard}
          onFilterByKPI={handleDrillDown}
        />

        {/* Health & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <CollectionHealthScoreComponent health={healthScore} loading={loadingDashboard} />
          </div>
          <div className="lg:col-span-8 flex flex-col justify-center">
            <SmartCollectionSummary summary={smartSummary} loading={loadingDashboard} />
          </div>
        </div>

        {/* Tabs */}
        <div id="payment-tabs" className="pt-6">
          <div className="flex items-center border-b border-border overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = activeTab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-omnia-gold text-omnia-gold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-omnia-gold' : 'text-muted-foreground'}`} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PaymentCharts
                chartData={chartData}
                reliability={reliability}
                forecast={forecast}
                loading={loadingDashboard}
                onDrillDown={handleDrillDown}
              />
            </motion.div>
          )}

          {activeTab === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PaymentTable
                payments={payments}
                total={totalPayments}
                page={tablePage}
                pageSize={PAGE_SIZE}
                loading={loadingTable}
                filters={tableFilters}
                onPageChange={setTablePage}
                onFilterChange={handleTableFilterChange}
                onViewPayment={setSelectedPayment}
                onExport={handleExport}
              />
            </motion.div>
          )}

          {['calendar', 'activity', 'intelligence'].includes(activeTab) && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center p-20 border border-border/40 rounded-xl border-dashed bg-muted/10"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1 capitalize">{activeTab} View</h3>
                <p className="text-sm text-muted-foreground">This feature will be available in Phase 3.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Modals & Drawers */}
      <RecordPaymentDialog
        open={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          loadDashboardData()
          loadTableData()
        }}
      />

      <PaymentDetailDrawer
        payment={selectedPayment}
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  )
}
