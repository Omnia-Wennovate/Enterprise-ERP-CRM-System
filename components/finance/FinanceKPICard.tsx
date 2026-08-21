'use client'

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Link from 'next/link'

interface FinanceKPICardProps {
  title: string
  value: string
  subValue?: string
  icon: ReactNode
  trend?: number        // positive = up, negative = down, 0/undefined = neutral
  trendLabel?: string
  status?: 'positive' | 'negative' | 'warning' | 'neutral'
  href?: string
  loading?: boolean
  accent?: boolean      // gold accent border on top
  currencyBreakdown?: string // e.g. "USD 12,400 · AED 8,200"
}

export function FinanceKPICard({
  title,
  value,
  subValue,
  icon,
  trend,
  trendLabel,
  status = 'neutral',
  href,
  loading,
  accent,
  currencyBreakdown,
}: FinanceKPICardProps) {
  const statusColors = {
    positive: 'text-emerald-600',
    negative: 'text-red-500',
    warning: 'text-amber-500',
    neutral: 'text-[#C8A951]',
  }

  const trendColor =
    trend === undefined
      ? 'text-slate-400'
      : trend > 0
      ? 'text-emerald-500'
      : trend < 0
      ? 'text-red-400'
      : 'text-slate-400'

  const TrendIcon =
    trend === undefined ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  const cardContent = (
    <div
      className={`group relative bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden
        ${accent ? 'border-[#C8A951]/30' : 'border-slate-100'}
        ${href ? 'cursor-pointer' : ''}
      `}
    >
      {/* Gold accent bar */}
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#C8A951] to-[#E8D48B]" />
      )}
      {/* Subtle background shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#C8A951]/0 to-[#C8A951]/0 group-hover:from-[#C8A951]/[0.02] group-hover:to-transparent transition-all duration-300 pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            {title}
          </p>
          {loading ? (
            <div className="space-y-2">
              <div className="h-7 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <p className={`text-2xl font-bold tracking-tight ${statusColors[status]}`}>
                {value}
              </p>
              {currencyBreakdown && (
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono truncate">
                  {currencyBreakdown}
                </p>
              )}
              {subValue && !currencyBreakdown && (
                <p className="text-xs text-slate-400 mt-1">{subValue}</p>
              )}
            </>
          )}
        </div>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ml-3
            ${status === 'positive' ? 'bg-emerald-50 text-emerald-600' :
              status === 'negative' ? 'bg-red-50 text-red-500' :
              status === 'warning' ? 'bg-amber-50 text-amber-500' :
              'bg-[#C8A951]/10 text-[#C8A951]'}
          `}
        >
          {icon}
        </div>
      </div>

      {/* Trend row */}
      {(trend !== undefined || trendLabel) && !loading && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendColor}`}>
          <TrendIcon size={12} />
          <span>
            {trend !== undefined && `${Math.abs(trend).toFixed(1)}%`}
            {trendLabel && ` ${trendLabel}`}
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{cardContent}</Link>
  }
  return cardContent
}

export function FinanceKPICardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 bg-slate-100 rounded mb-3" />
          <div className="h-7 w-28 bg-slate-100 rounded mb-2" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
      </div>
    </div>
  )
}
