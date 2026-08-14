'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { OnboardingHealthBreakdown } from '@/types/hr'

interface Props {
  health: OnboardingHealthBreakdown
  size?: number
}

export function HealthScoreWidget({ health, size = 120 }: Props) {
  const { score, recommendations } = health
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981'
    if (s >= 60) return '#f59e0b'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }

  const color = getColor(score)
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Fair' : score >= 40 ? 'At Risk' : 'Critical'

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Onboarding Health</h3>
      <div className="flex items-start gap-5">
        {/* Circular gauge */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="currentColor"
              className="text-muted/30"
              strokeWidth={8}
            />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-2xl font-bold"
              style={{ color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
          </div>
        </div>

        {/* Breakdown + Recommendations */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <ScoreBar label="Tasks" value={health.taskCompletion} />
            <ScoreBar label="Required" value={health.requiredCompletion} />
          </div>
          {recommendations.length > 0 && (
            <div className="space-y-1">
              {recommendations.map((r, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span>
                  <span>{r}</span>
                </p>
              ))}
            </div>
          )}
          {recommendations.length === 0 && score >= 80 && (
            <p className="text-xs text-emerald-600">All onboarding processes are on track.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
