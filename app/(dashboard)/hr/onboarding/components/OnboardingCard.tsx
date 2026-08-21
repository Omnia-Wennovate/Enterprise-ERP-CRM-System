'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { User, Clock, AlertTriangle, CheckCircle2, Shield, Calendar, Users } from 'lucide-react'
import type { OnboardingWithDetails } from '@/types/hr'
import { calculateHealthScore } from '@/lib/services/onboarding'

interface Props {
  onboarding: OnboardingWithDetails
  onClick: () => void
  index?: number
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-omnia-gold/15 dark:bg-teal-900/40', text: 'text-omnia-gold-dark dark:text-teal-300', label: 'Active' },
  at_risk: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', label: 'At Risk' },
  overdue: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Overdue' },
  blocked: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'Blocked' },
  completed: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', label: 'Completed' },
  cancelled: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Cancelled' },
}

export function OnboardingCard({ onboarding, onClick, index = 0 }: Props) {
  const { employee, tasks: rawTasks, status, buddy } = onboarding

  // Guard: employee can be null if the profile was deleted or the join failed
  if (!employee) return null

  const tasks = rawTasks || []
  const firstName = employee.first_name ?? ''
  const lastName = employee.last_name ?? ''
  const initials = `${firstName.charAt(0) || '?'}${lastName.charAt(0) || '?'}`

  const total = tasks.length
  const completed = tasks.filter(t => t.is_completed).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const overdue = tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length
  const health = calculateHealthScore(tasks, onboarding.start_date)
  const statusStyle = statusColors[status] || statusColors.active

  const healthColor = health.score >= 80 ? 'text-emerald-500' : health.score >= 60 ? 'text-amber-500' : 'text-red-500'

  // Last activity
  const lastCompletedTask = tasks
    .filter(t => t.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-card rounded-xl border border-border p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-omnia-gold/20 dark:hover:border-teal-800 hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-omnia-gold/15 dark:bg-teal-900/50 flex items-center justify-center text-omnia-gold-dark dark:text-teal-300 font-semibold text-sm flex-shrink-0 group-hover:ring-2 ring-omnia-gold-400/30 transition-all">
            {employee.avatar_url ? (
              <img src={employee.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-[15px]">{firstName} {lastName}</h3>
            <p className="text-xs text-muted-foreground">{employee.position || 'No Position'} · {employee.department || 'No Dept'}</p>
            {onboarding.start_date && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Started {new Date(onboarding.start_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="text-right flex flex-col items-end gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
          <div className="flex items-center gap-1">
            <Shield className={`w-3 h-3 ${healthColor}`} />
            <span className={`text-xs font-bold ${healthColor}`}>{health.score}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{completed}/{total} tasks</span>
          <span className="text-sm font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-omnia-gold/100'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 }}
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        {overdue > 0 && (
          <span className="flex items-center gap-1 text-red-500 font-medium">
            <AlertTriangle className="w-3 h-3" /> {overdue} overdue
          </span>
        )}
        {buddy && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> Buddy: {buddy.first_name}
          </span>
        )}
        {lastCompletedTask && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last: {new Date(lastCompletedTask.completed_at!).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  )
}
