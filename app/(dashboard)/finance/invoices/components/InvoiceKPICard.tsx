'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number
  format: 'currency' | 'number' | 'percent' | 'days'
  icon: LucideIcon
  iconColor: string
  iconBg: string
  change?: number
  compareLabel?: string
  sparkline?: number[]
  loading?: boolean
  onClick?: () => void
  isActive?: boolean
  subtitle?: string
  currency?: string
}

function formatValue(n: number, format: KPICardProps['format'], currency = 'USD'): string {
  if (format === 'currency') return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  if (format === 'percent') return `${n.toFixed(1)}%`
  if (format === 'days') return `${Math.round(n)}d`
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function AnimatedNumber({ value, format, currency }: { value: number; format: KPICardProps['format']; currency?: string }) {
  const [displayed, setDisplayed] = useState(0)
  const raf = useRef<number>(0)
  const start = useRef<number | null>(null)
  const from = useRef(0)

  useEffect(() => {
    from.current = displayed
    start.current = null
    const animate = (ts: number) => {
      if (!start.current) start.current = ts
      const elapsed = ts - start.current
      const duration = 800
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(from.current + (value - from.current) * eased)
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span>{formatValue(displayed, format, currency)}</span>
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data) || 1
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80; const h = 32
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

export function InvoiceKPICardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-muted"/>
        <div className="w-16 h-3 rounded bg-muted"/>
      </div>
      <div className="w-28 h-7 rounded bg-muted mb-2"/>
      <div className="w-20 h-3 rounded bg-muted"/>
    </div>
  )
}

export default function InvoiceKPICard({
  label, value, format, icon: Icon, iconColor, iconBg,
  change, compareLabel, sparkline, loading, onClick, isActive, subtitle, currency,
}: KPICardProps) {
  if (loading) return <InvoiceKPICardSkeleton/>

  const trend = change === undefined ? null : change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'flat'

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`relative bg-card border rounded-2xl p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${isActive ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : 'border-border hover:border-blue-300 hover:shadow-md'}`}
    >
      {/* Active indicator */}
      {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-t-2xl"/>}

      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon size={16} className={iconColor}/>
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline data={sparkline} color={trend === 'up' ? '#0d9488' : trend === 'down' ? '#ef4444' : '#94a3b8'}/>
        )}
      </div>

      <div className="text-2xl font-bold text-foreground tabular-nums mb-1">
        <AnimatedNumber value={value} format={format} currency={currency}/>
      </div>

      <div className="text-xs font-medium text-muted-foreground mb-2 leading-tight">{label}</div>

      {subtitle && <div className="text-xs text-muted-foreground/70 mb-2">{subtitle}</div>}

      {trend && change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
        }`}>
          {trend === 'up' ? <TrendingUp size={11}/> : trend === 'down' ? <TrendingDown size={11}/> : <Minus size={11}/>}
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
          {compareLabel && <span className="text-muted-foreground font-normal">{compareLabel}</span>}
        </div>
      )}
    </motion.div>
  )
}
