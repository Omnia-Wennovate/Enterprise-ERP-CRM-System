'use client'

import { useMemo } from 'react'
import type { InvoiceKPIs } from '@/lib/services/invoice-dashboard'
import { TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react'

interface ExecutiveSummaryProps {
  kpis: InvoiceKPIs | null
  loading?: boolean
  periodLabel?: string
}

export default function ExecutiveSummary({ kpis, loading, periodLabel }: ExecutiveSummaryProps) {
  const summary = useMemo(() => {
    if (!kpis) return null

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    const pct = (n: number) => `${n.toFixed(1)}%`
    const revChange = kpis.prevTotalRevenue > 0 ? ((kpis.totalRevenue - kpis.prevTotalRevenue) / kpis.prevTotalRevenue) * 100 : 0
    const outstandingChange = kpis.prevOutstandingBalance > 0 ? ((kpis.outstandingBalance - kpis.prevOutstandingBalance) / kpis.prevOutstandingBalance) * 100 : 0
    const collectionChange = kpis.collectionRate - kpis.prevCollectionRate

    const sentences: string[] = []

    // Revenue sentence
    if (revChange > 0) sentences.push(`Revenue ${kpis.compareLabel} increased by ${Math.abs(revChange).toFixed(1)}%, reaching ${fmt(kpis.totalRevenue)}.`)
    else if (revChange < 0) sentences.push(`Revenue ${kpis.compareLabel} decreased by ${Math.abs(revChange).toFixed(1)}% to ${fmt(kpis.totalRevenue)}.`)
    else sentences.push(`Revenue remained stable at ${fmt(kpis.totalRevenue)} for ${periodLabel || 'this period'}.`)

    // Outstanding balance
    if (outstandingChange > 0) sentences.push(`Outstanding balance increased by ${Math.abs(outstandingChange).toFixed(1)}% to ${fmt(kpis.outstandingBalance)}.`)
    else if (outstandingChange < -5) sentences.push(`Outstanding invoices decreased by ${Math.abs(outstandingChange).toFixed(1)}% — collections are improving.`)
    else sentences.push(`Outstanding balance stands at ${fmt(kpis.outstandingBalance)}.`)

    // Collection rate
    if (kpis.collectionRate >= 90) sentences.push(`Collection rate reached ${pct(kpis.collectionRate)} — excellent performance.`)
    else if (kpis.collectionRate >= 75) sentences.push(`Collection rate is ${pct(kpis.collectionRate)}.`)
    else sentences.push(`Collection rate is ${pct(kpis.collectionRate)} — below target, requiring attention.`)

    // Overdue
    if (kpis.overdueCount > 0) sentences.push(`${kpis.overdueCount} invoice${kpis.overdueCount !== 1 ? 's' : ''} ${kpis.overdueCount !== 1 ? 'are' : 'is'} overdue and require immediate follow-up.`)
    else sentences.push('No overdue invoices — collections are on track.')

    // Average payment days
    if (kpis.avgPaymentDays > 0) sentences.push(`Average payment time is ${kpis.avgPaymentDays} days.`)

    return sentences
  }, [kpis])

  const alerts = useMemo(() => {
    if (!kpis) return []
    const a: { type: 'warning' | 'critical' | 'positive'; text: string }[] = []
    if (kpis.overdueCount >= 5) a.push({ type: 'critical', text: `${kpis.overdueCount} overdue invoices` })
    else if (kpis.overdueCount > 0) a.push({ type: 'warning', text: `${kpis.overdueCount} overdue invoice${kpis.overdueCount !== 1 ? 's' : ''}` })
    if (kpis.collectionRate >= 90) a.push({ type: 'positive', text: `${kpis.collectionRate.toFixed(0)}% collection rate` })
    if (kpis.avgPaymentDays > 45) a.push({ type: 'warning', text: `Avg payment ${kpis.avgPaymentDays}d — slow` })
    return a
  }, [kpis])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="w-40 h-4 rounded bg-muted mb-3"/>
        <div className="space-y-2">
          <div className="w-full h-3 rounded bg-muted"/>
          <div className="w-5/6 h-3 rounded bg-muted"/>
          <div className="w-4/6 h-3 rounded bg-muted"/>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={15} className="text-blue-500"/>
        <h3 className="text-sm font-semibold text-foreground">Executive Summary</h3>
        {periodLabel && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">{periodLabel}</span>}
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed mb-4">
        {summary.join(' ')}
      </p>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <span key={i} className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
              a.type === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : a.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {a.type === 'critical' ? <AlertCircle size={10}/> : a.type === 'warning' ? <AlertCircle size={10}/> : <TrendingUp size={10}/>}
              {a.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
