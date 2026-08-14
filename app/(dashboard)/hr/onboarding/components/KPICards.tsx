'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, CalendarClock, AlertTriangle,
  Rocket, CheckCircle2, Timer, ShieldAlert
} from 'lucide-react'
import type { OnboardingKPIs } from '@/types/hr'

interface Props {
  kpis: OnboardingKPIs
  onFilterClick: (filter: string) => void
}

const cards = [
  { key: 'activeCount', label: 'Active Onboardings', icon: Users, color: '#0d9488', filter: 'active' },
  { key: 'completionRate', label: 'Completion Rate', icon: TrendingUp, color: '#10b981', filter: 'completed', suffix: '%' },
  { key: 'dueThisWeek', label: 'Due This Week', icon: CalendarClock, color: '#3b82f6', filter: 'due_week' },
  { key: 'overdueTasks', label: 'Overdue Tasks', icon: AlertTriangle, color: '#ef4444', filter: 'overdue' },
  { key: 'startingSoon', label: 'Starting Soon', icon: Rocket, color: '#8b5cf6', filter: 'starting_soon' },
  { key: 'completedThisMonth', label: 'Completed This Month', icon: CheckCircle2, color: '#10b981', filter: 'completed' },
  { key: 'avgCompletionDays', label: 'Avg Completion', icon: Timer, color: '#f59e0b', filter: 'all', suffix: ' days' },
  { key: 'atRiskCount', label: 'At Risk', icon: ShieldAlert, color: '#f97316', filter: 'at_risk' },
] as const

export function KPICards({ kpis, onFilterClick }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
      {cards.map((card, i) => {
        const value = kpis[card.key as keyof OnboardingKPIs]
        const isAlert = (card.key === 'overdueTasks' || card.key === 'atRiskCount') && (value as number) > 0

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onFilterClick(card.filter)}
            className={`
              relative bg-card rounded-xl p-4 border cursor-pointer
              transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
              ${isAlert ? 'border-red-200 bg-red-50/30' : 'border-border'}
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
            </div>
            <motion.p
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 + 0.3 }}
            >
              {value}{card.suffix || ''}
            </motion.p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{card.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}
