'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Rocket, Calendar, CheckCircle2, Clock } from 'lucide-react'
import type { OnboardingWithDetails } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
  onSelect: (onboarding: OnboardingWithDetails) => void
}

export function UpcomingOnboardings({ onboardings, onSelect }: Props) {
  const now = new Date()
  const upcoming = onboardings.filter(o => {
    if (!o.start_date || o.status === 'completed' || o.status === 'cancelled') return false
    return new Date(o.start_date) > now
  }).sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())

  if (upcoming.length === 0) return null

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Rocket className="w-4 h-4 text-purple-500" />
        Upcoming Starts
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {upcoming.map((o, i) => {
          const daysUntil = Math.ceil((new Date(o.start_date!).getTime() - now.getTime()) / (1000 * 3600 * 24))
          const preTasks = o.tasks.filter(t => t.phase === 'pre_boarding')
          const preDone = preTasks.filter(t => t.is_completed).length
          const urgencyColor = daysUntil <= 2 ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10' :
                               daysUntil <= 5 ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10' :
                               'border-border'

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(o)}
              className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all ${urgencyColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300 text-xs font-semibold">
                    {(o.employee?.first_name ?? '?').charAt(0)}{(o.employee?.last_name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{o.employee?.first_name ?? ''} {o.employee?.last_name ?? ''}</p>
                    <p className="text-[10px] text-muted-foreground">{o.employee?.position || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${daysUntil <= 2 ? 'text-red-500' : daysUntil <= 5 ? 'text-amber-500' : 'text-purple-600'}`}>
                    {daysUntil}d
                  </p>
                  <p className="text-[10px] text-muted-foreground">remaining</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Starts {new Date(o.start_date!).toLocaleDateString()}</span>
              </div>

              {preTasks.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${preTasks.length > 0 ? (preDone / preTasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {preDone}/{preTasks.length} pre-board
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
