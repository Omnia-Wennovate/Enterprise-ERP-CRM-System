'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'
import type { OnboardingWithDetails } from '@/types/hr'

interface Props {
  onboardings: OnboardingWithDetails[]
  onFilter: (filtered: OnboardingWithDetails[]) => void
  activeFilter: string
  onFilterChange: (filter: string) => void
}

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At Risk' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'completed', label: 'Completed' },
  { key: 'starting_soon', label: 'Starting Soon' },
]

export function SmartFilters({ onboardings, onFilter, activeFilter, onFilterChange }: Props) {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const departments = useMemo(() => {
    const depts = new Set<string>()
    onboardings.forEach(o => { if (o.employee.department) depts.add(o.employee.department) })
    return Array.from(depts).sort()
  }, [onboardings])

  React.useEffect(() => {
    const now = new Date()
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)

    let filtered = onboardings

    // Status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(o => o.status === 'active')
    } else if (activeFilter === 'at_risk') {
      filtered = filtered.filter(o => ['at_risk', 'overdue', 'blocked'].includes(o.status))
    } else if (activeFilter === 'overdue') {
      filtered = filtered.filter(o => o.status === 'overdue')
    } else if (activeFilter === 'blocked') {
      filtered = filtered.filter(o => o.status === 'blocked')
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(o => o.status === 'completed')
    } else if (activeFilter === 'starting_soon') {
      filtered = filtered.filter(o => {
        if (!o.start_date) return false
        const sd = new Date(o.start_date)
        return sd > now && sd <= weekFromNow
      })
    } else if (activeFilter === 'due_week') {
      filtered = filtered.filter(o =>
        o.tasks.some(t => !t.is_completed && t.due_date && t.due_date >= now.toISOString().split('T')[0] && t.due_date <= weekFromNow.toISOString().split('T')[0])
      )
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(o => {
        const name = `${o.employee.first_name} ${o.employee.last_name}`.toLowerCase()
        const pos = (o.employee.position || '').toLowerCase()
        const dept = (o.employee.department || '').toLowerCase()
        const taskMatch = o.tasks.some(t => t.task_label.toLowerCase().includes(q))
        return name.includes(q) || pos.includes(q) || dept.includes(q) || taskMatch
      })
    }

    // Department
    if (deptFilter) {
      filtered = filtered.filter(o => o.employee.department === deptFilter)
    }

    onFilter(filtered)
  }, [onboardings, activeFilter, search, deptFilter, onFilter])

  return (
    <div className="mb-6 space-y-3">
      {/* Status tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {statusTabs.map(tab => {
          const count = tab.key === 'all' ? onboardings.length :
            tab.key === 'starting_soon' ? onboardings.filter(o => {
              if (!o.start_date) return false
              const sd = new Date(o.start_date)
              return sd > new Date() && sd <= new Date(Date.now() + 7 * 24 * 3600 * 1000)
            }).length :
            onboardings.filter(o => o.status === tab.key).length

          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === tab.key
                  ? 'bg-omnia-gold text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${activeFilter === tab.key ? 'text-white/70' : ''}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search + Advanced */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employee, position, department, or task..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            showAdvanced || deptFilter ? 'border-omnia-gold bg-omnia-gold/10 dark:bg-teal-950/30 text-omnia-gold-dark' : 'border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-omnia-gold-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          {deptFilter && (
            <button onClick={() => setDeptFilter('')} className="text-xs text-omnia-gold hover:text-omnia-gold-dark font-medium">
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
