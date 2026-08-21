'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Calendar, Users, CheckCircle2, AlertTriangle, Clock, TrendingUp, Plus } from 'lucide-react'
import type { OnboardingKPIs } from '@/types/hr'

interface Props {
  kpis: OnboardingKPIs
  onStartOnboarding: () => void
}

export function OnboardingHeader({ kpis, onStartOnboarding }: Props) {
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const pills = [
    { label: 'Active', value: kpis.activeCount, icon: Users, color: 'text-omnia-gold' },
    { label: 'Completion', value: `${kpis.completionRate}%`, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Overdue', value: kpis.overdueTasks, icon: AlertTriangle, color: kpis.overdueTasks > 0 ? 'text-red-500' : 'text-muted-foreground' },
    { label: 'Starting Soon', value: kpis.startingSoon, icon: Clock, color: 'text-blue-500' },
    { label: 'Completed', value: kpis.completedThisMonth, icon: CheckCircle2, color: 'text-emerald-500' },
  ]

  return (
    <div className="mb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-foreground flex items-center gap-3"
          >
            <Sparkles className="w-7 h-7 text-omnia-gold" />
            Onboarding
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-1"
          >
            Plan, track, and complete employee onboarding from one intelligent workspace.
          </motion.p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartOnboarding}
          className="flex items-center gap-2 px-5 py-2.5 bg-omnia-gold text-white rounded-xl hover:bg-omnia-gold-dark transition-colors font-semibold shadow-lg shadow-teal-600/20"
        >
          <Plus className="w-5 h-5" />
          Start Onboarding
        </motion.button>
      </div>

      {/* KPI Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-3"
      >
        {pills.map((pill, i) => (
          <motion.div
            key={pill.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-full border border-border text-sm shadow-sm"
          >
            <pill.icon className={`w-3.5 h-3.5 ${pill.color}`} />
            <span className="text-muted-foreground">{pill.label}:</span>
            <span className="font-semibold text-foreground">{pill.value}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
