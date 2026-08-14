'use client'

import React from 'react'
import { Activity } from 'lucide-react'
import type { OnboardingWithDetails, OnboardingKPIs } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
  kpis: OnboardingKPIs
}

export function ExecutiveSummary({ onboardings, kpis }: Props) {
  const sentences: string[] = []
  const active = onboardings.filter(o => !['completed', 'cancelled'].includes(o.status))

  if (active.length > 0) {
    sentences.push(`${active.length} employee${active.length > 1 ? 's are' : ' is'} currently onboarding.`)
  } else {
    sentences.push('No employees are currently onboarding.')
  }

  if (kpis.completionRate > 0) {
    sentences.push(`Overall completion rate is ${kpis.completionRate}%.`)
  }

  if (kpis.overdueTasks > 0) {
    const overdueOnboardings = active.filter(o => o.tasks.some(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()))
    sentences.push(`${overdueOnboardings.length} onboarding${overdueOnboardings.length !== 1 ? 's require' : ' requires'} attention due to ${kpis.overdueTasks} overdue task${kpis.overdueTasks !== 1 ? 's' : ''}.`)
  }

  if (kpis.startingSoon > 0) {
    sentences.push(`${kpis.startingSoon} employee${kpis.startingSoon !== 1 ? 's' : ''} starting within the next 7 days.`)
  }

  if (kpis.completedThisMonth > 0) {
    sentences.push(`${kpis.completedThisMonth} onboarding${kpis.completedThisMonth !== 1 ? 's' : ''} completed this month.`)
  }

  if (kpis.avgCompletionDays > 0) {
    sentences.push(`Average onboarding takes ${kpis.avgCompletionDays} days to complete.`)
  }

  // Department insight
  const deptCounts: Record<string, number> = {}
  active.forEach(o => {
    const dept = o.employee.department || 'Unknown'
    deptCounts[dept] = (deptCounts[dept] || 0) + 1
  })
  const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0]
  if (topDept && topDept[1] > 1) {
    sentences.push(`${topDept[0]} department has the most active onboardings (${topDept[1]}).`)
  }

  return (
    <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/50 rounded-xl p-5 mb-6 backdrop-blur-sm">
      <h3 className="text-teal-900 dark:text-teal-100 font-semibold mb-2 flex items-center gap-2 text-sm">
        <Activity size={16} className="text-teal-600" />
        Executive Summary
      </h3>
      <p className="text-teal-800 dark:text-teal-200 text-[15px] leading-relaxed">
        {sentences.join(' ')}
      </p>
    </div>
  )
}
