'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import {
  DollarSign, CreditCard, TrendingUp, TrendingDown, Clock,
  AlertTriangle, CheckCircle, Receipt, RotateCcw, BarChart3,
  Wallet, Calendar, Zap, Target
} from 'lucide-react'
import type { PaymentKPIs } from '@/types/finance'

interface KPICardProps {
  title: string
  value: number
  format: 'currency' | 'number' | 'percent' | 'days'
  icon: React.ReactNode
  color: string
  bgColor: string
  prevValue?: number
  compareLabel?: string
  onClick?: () => void
  delay?: number
}

function AnimatedCounter({ value, format }: { value: number; format: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const end = value
    const duration = 800
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased

      setDisplay(current)
      ref.current = current

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [value])

  if (format === 'currency') {
    return <span>ETB {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(display)}</span>
  }
  if (format === 'percent') {
    return <span>{display.toFixed(1)}%</span>
  }
  if (format === 'days') {
    return <span>{Math.round(display)} days</span>
  }
  return <span>{Math.round(display).toLocaleString()}</span>
}

function KPICard({ title, value, format, icon, color, bgColor, prevValue, compareLabel, onClick, delay = 0 }: KPICardProps) {
  const change = prevValue && prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border border-border/40 bg-card p-5 transition-shadow duration-200 hover:shadow-lg hover:shadow-black/5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
          <div className={color}>{icon}</div>
        </div>
        {prevValue !== undefined && change !== 0 && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
            isPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-foreground">
        <AnimatedCounter value={value} format={format} />
      </p>

      {compareLabel && prevValue !== undefined && (
        <p className="text-xs text-muted-foreground mt-1.5">{compareLabel}</p>
      )}

      {/* Subtle gradient line at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
        color.includes('teal') ? 'from-omnia-gold/100/50 to-transparent' :
        color.includes('emerald') ? 'from-emerald-500/50 to-transparent' :
        color.includes('amber') ? 'from-amber-500/50 to-transparent' :
        color.includes('red') ? 'from-red-500/50 to-transparent' :
        color.includes('blue') ? 'from-blue-500/50 to-transparent' :
        color.includes('purple') ? 'from-purple-500/50 to-transparent' :
        'from-slate-500/50 to-transparent'
      }`} />
    </motion.div>
  )
}

export function PaymentKPICardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="w-14 h-5 rounded-full bg-muted" />
      </div>
      <div className="h-3 w-20 bg-muted rounded mb-2" />
      <div className="h-8 w-32 bg-muted rounded" />
    </div>
  )
}

interface PaymentKPICardsProps {
  kpis: PaymentKPIs | null
  loading: boolean
  onFilterByKPI?: (filter: Record<string, string>) => void
}

export default function PaymentKPICards({ kpis, loading, onFilterByKPI }: PaymentKPICardsProps) {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <PaymentKPICardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const cards: Omit<KPICardProps, 'delay'>[] = [
    {
      title: 'Total Payments',
      value: kpis.totalPayments,
      format: 'number',
      icon: <Receipt className="w-5 h-5" />,
      color: 'text-omnia-gold',
      bgColor: 'bg-omnia-gold/100/10',
      prevValue: kpis.prevTotalPayments,
      compareLabel: kpis.compareLabel,
    },
    {
      title: 'Total Collected',
      value: kpis.totalCollected,
      format: 'currency',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
      prevValue: kpis.prevTotalCollected,
      compareLabel: kpis.compareLabel,
    },
    {
      title: 'Outstanding',
      value: kpis.outstandingAmount,
      format: 'currency',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      prevValue: kpis.prevOutstandingAmount,
      compareLabel: kpis.compareLabel,
      onClick: () => onFilterByKPI?.({ status: 'partially_paid' }),
    },
    {
      title: 'Collection Rate',
      value: kpis.collectionRate,
      format: 'percent',
      icon: <Target className="w-5 h-5" />,
      color: 'text-omnia-gold',
      bgColor: 'bg-omnia-gold/50/10',
    },
    {
      title: 'This Month',
      value: kpis.paymentsThisMonth,
      format: 'number',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-omnia-gold',
      bgColor: 'bg-omnia-gold/100/10',
    },
    {
      title: 'Average Payment',
      value: kpis.averagePayment,
      format: 'currency',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-500/10',
      prevValue: kpis.prevAveragePayment,
      compareLabel: kpis.compareLabel,
    },
    {
      title: 'Largest Payment',
      value: kpis.largestPayment,
      format: 'currency',
      icon: <Zap className="w-5 h-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Overdue',
      value: kpis.overdueAmount,
      format: 'currency',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      onClick: () => onFilterByKPI?.({ status: 'overdue' }),
    },
    {
      title: 'Overdue Invoices',
      value: kpis.overdueInvoiceCount,
      format: 'number',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      onClick: () => onFilterByKPI?.({ status: 'overdue' }),
    },
    {
      title: 'Avg Payment Days',
      value: kpis.averagePaymentDays,
      format: 'days',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-slate-600',
      bgColor: 'bg-slate-500/10',
    },
    {
      title: 'Refunded',
      value: kpis.refundedAmount,
      format: 'currency',
      icon: <RotateCcw className="w-5 h-5" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Cash This Year',
      value: kpis.cashCollectedThisYear,
      format: 'currency',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => (
        <KPICard key={card.title} {...card} delay={i} />
      ))}
    </div>
  )
}
