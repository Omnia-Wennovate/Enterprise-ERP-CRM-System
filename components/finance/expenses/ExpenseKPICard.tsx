'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'

interface KPICardProps {
  id: string
  label: string
  value: string
  subvalue?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'teal' | 'blue' | 'amber' | 'red' | 'green' | 'purple' | 'slate'
  breakdown?: Array<{ label: string; value: string; href?: string }>
  onViewFiltered?: () => void
}

const colorMap = {
  teal:   { bg: 'from-omnia-gold/100/10 to-teal-600/5',   text: 'text-omnia-gold',   border: 'border-omnia-gold/20',   icon: 'bg-omnia-gold/15 text-omnia-gold' },
  blue:   { bg: 'from-blue-500/10 to-blue-600/5',   text: 'text-omnia-gold',   border: 'border-blue-200',   icon: 'bg-blue-100 text-omnia-gold' },
  amber:  { bg: 'from-amber-500/10 to-amber-600/5', text: 'text-amber-600',  border: 'border-amber-200',  icon: 'bg-amber-100 text-amber-600' },
  red:    { bg: 'from-red-500/10 to-red-600/5',     text: 'text-red-600',    border: 'border-red-200',    icon: 'bg-red-100 text-red-600' },
  green:  { bg: 'from-green-500/10 to-green-600/5', text: 'text-green-600',  border: 'border-green-200',  icon: 'bg-green-100 text-green-600' },
  purple: { bg: 'from-purple-500/10 to-purple-600/5', text: 'text-purple-600', border: 'border-purple-200', icon: 'bg-purple-100 text-purple-600' },
  slate:  { bg: 'from-slate-500/10 to-slate-600/5', text: 'text-slate-600',  border: 'border-slate-200',  icon: 'bg-slate-100 text-slate-600' },
}

export function ExpenseKPICard({
  id, label, value, subvalue, icon, trend, color = 'teal', breakdown, onViewFiltered,
}: KPICardProps) {
  const [expanded, setExpanded] = useState(false)
  const c = colorMap[color]

  return (
    <motion.div
      layout
      className={`bg-card border ${c.border} rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Main card body */}
      <div
        className={`bg-gradient-to-br ${c.bg} p-5 cursor-pointer`}
        onClick={() => breakdown && setExpanded(!expanded)}
        role={breakdown ? 'button' : undefined}
        aria-expanded={expanded}
        id={`kpi-card-${id}`}
      >
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${c.icon} w-fit`}>{icon}</div>
          {breakdown && (
            <button
              className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${c.text}`}
              aria-label="Expand breakdown"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subvalue && <p className="text-xs text-muted-foreground mt-0.5">{subvalue}</p>}
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trend.value >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </p>
          )}
        </div>
      </div>

      {/* Breakdown panel */}
      <AnimatePresence>
        {expanded && breakdown && (
          <motion.div
            key="breakdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-3 space-y-2 bg-card">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Breakdown
              </p>
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-semibold ${c.text}`}>{item.value}</span>
                </div>
              ))}
              {onViewFiltered && (
                <button
                  onClick={onViewFiltered}
                  className={`flex items-center gap-1 text-xs font-medium ${c.text} mt-2 hover:opacity-80`}
                >
                  View filtered list <ArrowRight size={12} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
