'use client'

import { useMemo } from 'react'

export type PeriodType = 'weekly' | 'monthly' | '6month' | 'yearly'

interface PeriodSelectorProps {
  value: PeriodType
  onChange: (p: PeriodType) => void
}

const OPTIONS: { value: PeriodType; label: string; sublabel: string }[] = [
  { value: 'weekly',  label: 'Weekly',  sublabel: 'This week vs last week' },
  { value: 'monthly', label: 'Monthly', sublabel: 'This month vs last month' },
  { value: '6month',  label: '6 Month', sublabel: 'Rolling 6-month view' },
  { value: 'yearly',  label: 'Yearly',  sublabel: 'This year vs last year' },
]

export function getDateRangesForPeriod(period: PeriodType) {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'weekly') {
    const dow = now.getDay()
    const monday = new Date(now); monday.setDate(now.getDate() - ((dow + 6) % 7))
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7)
    const prevSunday = new Date(sunday); prevSunday.setDate(sunday.getDate() - 7)
    return {
      start: fmt(monday), end: fmt(sunday),
      prevStart: fmt(prevMonday), prevEnd: fmt(prevSunday),
      label: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      compareLabel: 'vs last week',
    }
  }
  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    return {
      start: fmt(start), end: fmt(end),
      prevStart: fmt(prevStart), prevEnd: fmt(prevEnd),
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
      start: fmt(start), end: fmt(end),
      prevStart: fmt(prevStart), prevEnd: fmt(prevEnd),
      label: 'Last 6 Months',
      compareLabel: 'vs prior 6 months',
    }
  }
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  const prevStart = new Date(now.getFullYear() - 1, 0, 1)
  const prevEnd = new Date(now.getFullYear() - 1, 11, 31)
  return {
    start: fmt(start), end: fmt(end),
    prevStart: fmt(prevStart), prevEnd: fmt(prevEnd),
    label: String(now.getFullYear()),
    compareLabel: 'vs last year',
  }
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border/50">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.sublabel}
          className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            value === opt.value
              ? 'bg-background text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
