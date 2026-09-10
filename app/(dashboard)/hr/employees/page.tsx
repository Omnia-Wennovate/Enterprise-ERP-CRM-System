'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// Known real employee names — same map used in actions.ts
const KNOWN_EMPLOYEE_NAMES: Record<string, { full: string; position?: string }> = {
  'bekan.bekele74@gmail.com': { full: 'Bekan Bekele', position: 'Operations Officer' },
  'kalkidantesfaye21971@gmail.com': { full: 'Kalkidan Tesfaye', position: 'Sales Agent' },
  'nurfaris08@gmail.com': { full: 'Nur Faris', position: 'Operations Officer' },
  'alaminfsiraj@gmail.com': { full: 'Alamin Siraj', position: 'HR Manager' },
  'davidbezuneh@gmail.com': { full: 'David Bezuneh', position: 'Social Media Manager' },
  'melika.wennovate@gmail.com': { full: 'Melika Wennovate', position: 'Accountant' },
  'belenwolde2@gmail.com': { full: 'Belen Wolde', position: 'Social Media Officer' },
  'zuludalo98@gmail.com': { full: 'Zulu Dalo', position: 'Sales Agent' },
  'admin@omniatravel.com': { full: 'Omnia Admin', position: 'System Administrator' },
  'manager@omniatravel.com': { full: 'Operations Manager', position: 'Operations Manager' },
  'hr@omniatravel.com': { full: 'HR Team', position: 'HR Officer' },
  'marketing@omniatravel.com': { full: 'Marketing Team', position: 'Marketing Officer' },
  'sales@omniatravel.com': { full: 'Sales Team', position: 'Sales Agent' },
  'ops@omniatravel.com': { full: 'Ops Team', position: 'Operations Officer' },
}

function resolveDisplayName(profile: {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  position?: string | null
}): { full: string; position: string } {
  const email = (profile.email || '').toLowerCase().trim()
  const known = KNOWN_EMPLOYEE_NAMES[email]
  const isGenericFirstName = !profile.first_name || profile.first_name.trim().toLowerCase() === 'user'

  let full: string
  if (!isGenericFirstName) {
    full = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  } else if (known) {
    full = known.full
  } else {
    const local = email.split('@')[0] || ''
    const derived = local.replace(/\d+/g, '').replace(/[._\-+]/g, ' ').trim()
    const words = derived.split(/\s+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    full = words.join(' ') || email || 'Team Member'
  }

  const position = profile.position || known?.position || '—'
  return { full, position }
}

interface Employee {
  id: string
  full_name: string
  email: string
  position: string
  department: string
  status: string
  date_joined: string | null
  is_active: boolean
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  useEffect(() => {
    async function loadEmployees() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, position, job_title, department, is_active, employment_status, date_joined')
          .order('email', { ascending: true })

        if (error) throw error

        const mapped: Employee[] = (data || []).map((p: any) => {
          const { full, position } = resolveDisplayName(p)
          return {
            id: p.id,
            full_name: full,
            email: p.email || '',
            position: p.job_title || position,
            department: p.department || '—',
            status: p.is_active ? (p.employment_status || 'active') : 'inactive',
            date_joined: p.date_joined || null,
            is_active: p.is_active ?? true,
          }
        })

        setEmployees(mapped)
      } catch (err: any) {
        setError(err.message || 'Failed to load employees')
      } finally {
        setLoading(false)
      }
    }
    loadEmployees()
  }, [])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterStatus || emp.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'inactive':
        return 'bg-red-100 text-red-700'
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-700'
      case 'probation':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-muted text-slate-700'
    }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'on_leave') return 'On Leave'
    if (status === 'probation') return 'Probation'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-omnia-gold" />
          <span>Loading employees…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground mt-1">
              {employees.length} team member{employees.length !== 1 ? 's' : ''} in the system
            </p>
          </div>
          <Link
            href="/hr/employees/new"
            className="flex items-center gap-2 px-4 py-2 bg-omnia-gold text-primary-foreground rounded-lg hover:bg-omnia-gold-dark font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email or department…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:border-omnia-gold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-omnia-gold"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
              <option value="probation">Probation</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      {searchTerm || filterStatus
                        ? 'No employees match your search.'
                        : 'No employees found.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-omnia-gold/15 flex items-center justify-center text-xs font-semibold text-omnia-gold-dark flex-shrink-0">
                            {emp.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-foreground">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{emp.email}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{emp.position}</td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{emp.department}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(emp.status)}`}>
                          {getStatusLabel(emp.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {emp.date_joined
                          ? new Date(emp.date_joined).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          className="text-omnia-gold hover:text-omnia-gold-dark font-medium text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
