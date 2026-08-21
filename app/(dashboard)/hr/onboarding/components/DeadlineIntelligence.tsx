'use client'

import React, { useState, useMemo } from 'react'
import { AlertTriangle, Clock, CalendarCheck, CheckCircle2, Calendar } from 'lucide-react'
import type { OnboardingWithDetails, OnboardingTask } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
  onSelectOnboarding: (onboarding: OnboardingWithDetails) => void
}

type DeadlineTab = 'today' | 'this_week' | 'overdue' | 'completed'

export function DeadlineIntelligence({ onboardings, onSelectOnboarding }: Props) {
  const [activeTab, setActiveTab] = useState<DeadlineTab>('overdue')

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  type TaskWithOnboarding = OnboardingTask & { onboarding: OnboardingWithDetails }

  const allTasks: TaskWithOnboarding[] = useMemo(() => {
    return onboardings.flatMap(o =>
      o.tasks.map(t => ({ ...t, onboarding: o }))
    )
  }, [onboardings])

  const categorized = useMemo(() => ({
    today: allTasks.filter(t => !t.is_completed && t.due_date === todayStr),
    this_week: allTasks.filter(t => !t.is_completed && t.due_date && t.due_date > todayStr && t.due_date <= weekEndStr),
    overdue: allTasks.filter(t => !t.is_completed && t.due_date && t.due_date < todayStr),
    completed: allTasks.filter(t => t.is_completed).sort((a, b) =>
      new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
    ).slice(0, 20),
  }), [allTasks, todayStr, weekEndStr])

  const tabs: { key: DeadlineTab; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: 'today', label: 'Due Today', icon: Clock, count: categorized.today.length, color: 'text-blue-500' },
    { key: 'this_week', label: 'This Week', icon: Calendar, count: categorized.this_week.length, color: 'text-amber-500' },
    { key: 'overdue', label: 'Overdue', icon: AlertTriangle, count: categorized.overdue.length, color: 'text-red-500' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, count: categorized.completed.length, color: 'text-emerald-500' },
  ]

  const currentTasks = categorized[activeTab]

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <CalendarCheck className="w-4 h-4 text-omnia-gold" />
        Deadline Intelligence
      </h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-omnia-gold/15 dark:bg-teal-900/40 text-omnia-gold-dark dark:text-teal-300'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className={`w-3 h-3 ${tab.color}`} />
            {tab.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              tab.count > 0 && tab.key === 'overdue' ? 'bg-red-500 text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
        {currentTasks.map(task => (
          <div
            key={task.id}
            onClick={() => onSelectOnboarding(task.onboarding)}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          >
            {task.is_completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : activeTab === 'overdue' ? (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{task.task_label}</p>
              <p className="text-[10px] text-muted-foreground">
                {task.onboarding.employee.first_name} {task.onboarding.employee.last_name}
                {task.due_date && <> · Due {new Date(task.due_date).toLocaleDateString()}</>}
              </p>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              task.priority === 'critical' ? 'bg-red-100 text-red-700' :
              task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {task.priority}
            </span>
          </div>
        ))}
        {currentTasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No tasks in this category.</p>
        )}
      </div>
    </div>
  )
}
