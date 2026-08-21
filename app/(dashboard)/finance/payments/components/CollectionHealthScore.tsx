'use client'

import { motion } from 'framer-motion'
import type { CollectionHealthScore as HealthScoreType } from '@/types/finance'
import { Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

interface CollectionHealthScoreProps {
  health: HealthScoreType | null
  loading: boolean
}

function GaugeCircle({ score, color, grade }: { score: number; color: string; grade: string }) {
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="10"
          opacity={0.3}
        />
        <motion.circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-3xl font-bold text-foreground"
        >
          {score}
        </motion.span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          Grade {grade}
        </span>
      </div>
    </div>
  )
}

export default function CollectionHealthScore({ health, loading }: CollectionHealthScoreProps) {
  if (loading || !health) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-6 animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 bg-muted rounded-full" />
          <div className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 bg-muted rounded w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border/40 bg-card overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/30 flex items-center gap-2">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Collection Health Score</h3>
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold`} style={{
          backgroundColor: health.color + '18',
          color: health.color,
        }}>
          {health.status}
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <GaugeCircle score={health.score} color={health.color} grade={health.grade} />

          <div className="flex-1 w-full">
            {/* Factor bars */}
            <div className="space-y-3">
              {health.factors.map((factor, i) => (
                <motion.div
                  key={factor.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{factor.label}</span>
                    <span className="text-xs text-muted-foreground">{factor.score}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: factor.score >= 80 ? '#0d9488' :
                          factor.score >= 60 ? '#f59e0b' :
                          factor.score >= 40 ? '#f97316' : '#ef4444'
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{factor.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Recommendations */}
            {health.recommendations.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-omnia-gold" />
                  Recommendations
                </p>
                {health.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-omnia-gold mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
