'use client'

import { useMemo } from 'react'
import type { PaymentPeriodType } from '@/lib/services/payment-dashboard'

interface PeriodSelectorProps {
  value: PaymentPeriodType
  onChange: (p: PaymentPeriodType) => void
}

const OPTIONS: { value: PaymentPeriodType; label: string; sublabel: string }[] = [
  { value: 'today',      label: 'Today',      sublabel: 'vs yesterday' },
  { value: 'week',       label: 'This Week',  sublabel: 'vs last week' },
  { value: 'month',      label: 'This Month', sublabel: 'vs last month' },
  { value: 'last_month', label: 'Last Month', sublabel: 'vs prior month' },
  { value: '3month',     label: '3 Months',   sublabel: 'vs prior 3 months' },
  { value: '6month',     label: '6 Months',   sublabel: 'vs prior 6 months' },
  { value: 'year',       label: 'This Year',  sublabel: 'vs last year' },
]

export function getPaymentDateRanges(period: PaymentPeriodType) {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'today') {
    const today = fmt(now)
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    return { start: today, end: today, prevStart: fmt(yesterday), prevEnd: fmt(yesterday), label: 'Today', compareLabel: 'vs yesterday' }
  }
  if (period === 'week') {
    const dow = now.getDay()
    const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7))
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7)
    const prevSunday = new Date(sunday); prevSunday.setDate(sunday.getDate() - 7)
    return { start: fmt(monday), end: fmt(sunday), prevStart: fmt(prevMonday), prevEnd: fmt(prevSunday), label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, compareLabel: 'vs last week' }
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd), label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), compareLabel: 'vs last month' }
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0)
    return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd), label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), compareLabel: 'vs prior month' }
  }
  if (period === '3month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0)
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 2, 1)
    return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd), label: 'Last 3 Months', compareLabel: 'vs prior 3 months' }
  }
  if (period === '6month') {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0)
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 5, 1)
    return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd), label: 'Last 6 Months', compareLabel: 'vs prior 6 months' }
  }
  // year
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  const prevStart = new Date(now.getFullYear() - 1, 0, 1)
  const prevEnd = new Date(now.getFullYear() - 1, 11, 31)
  return { start: fmt(start), end: fmt(end), prevStart: fmt(prevStart), prevEnd: fmt(prevEnd), label: String(now.getFullYear()), compareLabel: 'vs last year' }
}

export default function PaymentPeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/40 backdrop-blur-sm rounded-xl p-1 border border-border/40">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.sublabel}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            value === opt.value
              ? 'bg-background text-foreground shadow-sm border border-border/60'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
