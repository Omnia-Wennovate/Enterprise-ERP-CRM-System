'use client'

import { useMemo } from 'react'
import type { InvoiceHealthScore } from '@/lib/services/invoice-dashboard'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface HealthScoreProps {
  health: InvoiceHealthScore
  loading?: boolean
}

export default function HealthScore({ health, loading }: HealthScoreProps) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dashOffset = circ - (health.score / 100) * circ

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 animate-pulse">
        <div className="flex gap-6 items-center">
          <div className="w-32 h-32 rounded-full bg-muted"/>
          <div className="flex-1 space-y-3">
            <div className="w-32 h-5 rounded bg-muted"/>
            <div className="w-48 h-3 rounded bg-muted"/>
            <div className="w-40 h-3 rounded bg-muted"/>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-start gap-6 flex-wrap">
        {/* SVG Gauge */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <svg width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10"/>
            <motion.circle
              cx="64" cy="64" r={r}
              fill="none"
              stroke={health.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 64 64)"
            />
            <text x="64" y="60" textAnchor="middle" fontSize="22" fontWeight="700" fill={health.color}>{health.score}</text>
            <text x="64" y="78" textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))">Grade {health.grade}</text>
          </svg>
          <div className="text-xs text-muted-foreground mt-1">Invoice Health</div>
        </div>

        {/* Factors */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-semibold text-foreground mb-3">Score Breakdown</h3>
          <div className="space-y-2">
            {health.factors.map(f => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">{f.label}</span>
                  <span className="font-semibold tabular-nums" style={{ color: f.score >= 75 ? '#0d9488' : f.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {f.score.toFixed(0)}/100
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: f.score >= 75 ? '#0d9488' : f.score >= 50 ? '#f59e0b' : '#ef4444' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.score}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="flex-1 min-w-[200px]">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recommendations</h3>
          <div className="space-y-2">
            {health.recommendations.map((rec, i) => {
              const Icon = health.score >= 70 ? CheckCircle : health.score >= 50 ? AlertTriangle : XCircle
              const color = health.score >= 70 ? 'text-emerald-500' : health.score >= 50 ? 'text-amber-500' : 'text-red-500'
              return (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Icon size={12} className={`${color} flex-shrink-0 mt-0.5`}/>
                  <span>{rec}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
