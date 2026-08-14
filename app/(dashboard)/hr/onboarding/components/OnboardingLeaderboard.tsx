'use client'

import React, { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import type { OnboardingWithDetails } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
}

export function OnboardingLeaderboard({ onboardings }: Props) {
  const deptStats = useMemo(() => {
    const depts: Record<string, { totalProgress: number; count: number; totalDays: number; completedCount: number }> = {}

    onboardings.forEach(o => {
      const dept = o.employee.department || 'Unknown'
      if (!depts[dept]) depts[dept] = { totalProgress: 0, count: 0, totalDays: 0, completedCount: 0 }

      const total = o.tasks.length
      const done = o.tasks.filter(t => t.is_completed).length
      const progress = total > 0 ? (done / total) * 100 : 0

      depts[dept].totalProgress += progress
      depts[dept].count++

      if (o.status === 'completed' && o.completed_at && o.created_at) {
        const days = (new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 3600 * 24)
        depts[dept].totalDays += days
        depts[dept].completedCount++
      }
    })

    return Object.entries(depts)
      .map(([name, d]) => ({
        name,
        avgProgress: Math.round(d.totalProgress / d.count),
        avgDays: d.completedCount > 0 ? Math.round(d.totalDays / d.completedCount) : null,
        count: d.count,
      }))
      .sort((a, b) => b.avgProgress - a.avgProgress)
  }, [onboardings])

  if (deptStats.length === 0) return null

  return (
    <div className="bg-card rounded-xl border border-border p-5 mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        Department Performance
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left py-2 pr-4">#</th>
              <th className="text-left py-2 pr-4">Department</th>
              <th className="text-right py-2 pr-4">Avg Progress</th>
              <th className="text-right py-2 pr-4">Avg Duration</th>
              <th className="text-right py-2">Headcount</th>
            </tr>
          </thead>
          <tbody>
            {deptStats.map((dept, i) => (
              <tr key={dept.name} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-4">
                  <span className={`text-xs font-bold ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-medium text-foreground">{dept.name}</td>
                <td className="py-2.5 pr-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${dept.avgProgress >= 80 ? 'bg-emerald-500' : dept.avgProgress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${dept.avgProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{dept.avgProgress}%</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-right text-muted-foreground text-xs">
                  {dept.avgDays !== null ? `${dept.avgDays}d` : '—'}
                </td>
                <td className="py-2.5 text-right text-muted-foreground text-xs">{dept.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
