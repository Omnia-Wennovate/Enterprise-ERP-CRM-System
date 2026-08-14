'use client'

import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { OnboardingWithDetails } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
}

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#ec4899']

export function OnboardingAnalytics({ onboardings }: Props) {
  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    onboardings.forEach(o => {
      counts[o.status] = (counts[o.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value,
    }))
  }, [onboardings])

  // Tasks by category
  const categoryData = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {}
    onboardings.forEach(o => {
      o.tasks.forEach(t => {
        const cat = t.category.replace('_', ' ')
        if (!counts[cat]) counts[cat] = { total: 0, completed: 0 }
        counts[cat].total++
        if (t.is_completed) counts[cat].completed++
      })
    })
    return Object.entries(counts)
      .map(([name, { total, completed }]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        total,
        completed,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [onboardings])

  // Department performance
  const deptData = useMemo(() => {
    const depts: Record<string, { total: number; avgProgress: number; count: number }> = {}
    onboardings.forEach(o => {
      const dept = o.employee.department || 'Unknown'
      if (!depts[dept]) depts[dept] = { total: 0, avgProgress: 0, count: 0 }
      const taskCount = o.tasks.length
      const done = o.tasks.filter(t => t.is_completed).length
      const progress = taskCount > 0 ? (done / taskCount) * 100 : 0
      depts[dept].total++
      depts[dept].avgProgress += progress
      depts[dept].count++
    })
    return Object.entries(depts).map(([name, d]) => ({
      name,
      avg: Math.round(d.avgProgress / d.count),
      count: d.count,
    })).sort((a, b) => b.avg - a.avg)
  }, [onboardings])

  // Completion trend (monthly)
  const trendData = useMemo(() => {
    const months: Record<string, { completed: number; started: number }> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      months[key] = { completed: 0, started: 0 }
    }
    onboardings.forEach(o => {
      const created = new Date(o.created_at)
      const createdKey = created.toLocaleString('default', { month: 'short', year: '2-digit' })
      if (months[createdKey] !== undefined) months[createdKey].started++

      if (o.completed_at) {
        const comp = new Date(o.completed_at)
        const compKey = comp.toLocaleString('default', { month: 'short', year: '2-digit' })
        if (months[compKey] !== undefined) months[compKey].completed++
      }
    })
    return Object.entries(months).map(([name, d]) => ({ name, ...d }))
  }, [onboardings])

  if (onboardings.length < 1) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-muted-foreground text-sm">Not enough data for analytics. Create onboardings to see charts.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Completion Trend */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Onboarding Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
            <Area type="monotone" dataKey="started" stroke="#0d9488" fill="#0d948830" strokeWidth={2} name="Started" />
            <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#10b98130" strokeWidth={2} name="Completed" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Status Distribution</h3>
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData} cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-8">No data available.</p>
        )}
      </div>

      {/* Tasks by Category */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Tasks by Category</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
            <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="Completed" />
            <Bar dataKey="total" fill="#0d948840" radius={[0, 4, 4, 0]} name="Total" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Performance */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Department Performance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={deptData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" domain={[0, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--card)' }} formatter={(v: any) => `${v}%`} />
            <Bar dataKey="avg" fill="#0d9488" radius={[4, 4, 0, 0]} name="Avg Progress %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
