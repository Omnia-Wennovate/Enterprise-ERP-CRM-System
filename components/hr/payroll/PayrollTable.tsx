'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, Download,
  CheckCircle2, Clock, FileText, Eye, Check, X, Filter,
} from 'lucide-react'
import type { PayrollRecord } from '@/lib/services/payroll'
import { actionUpdateStatus } from '@/app/actions/payroll'

interface Props {
  records: PayrollRecord[]
  onRefresh: () => void
  onSelectRecord: (record: PayrollRecord) => void
}

type SortKey = 'name' | 'department' | 'basic_salary' | 'allowances' | 'bonuses' | 'commission_amount' | 'tax' | 'deductions' | 'net_salary' | 'status'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: FileText },
  approved: { label: 'Approved', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 },
  paid: { label: 'Paid', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Check },
}

function fmt(n: number) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export function PayrollTable({ records, onRefresh, onSelectRecord }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deptFilter, setDeptFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('net_salary')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [updating, setUpdating] = useState<string | null>(null)
  const PAGE_SIZE = 15

  const departments = useMemo(() => {
    const depts = new Set(records.map((r) => r.employee?.department || 'Unassigned'))
    return ['all', ...Array.from(depts).filter(Boolean).sort()]
  }, [records])

  const filtered = useMemo(() => {
    let res = [...records]
    if (search) {
      const q = search.toLowerCase()
      res = res.filter((r) => {
        const name = `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.toLowerCase()
        return name.includes(q) || (r.employee?.department || '').toLowerCase().includes(q) || (r.employee?.position || '').toLowerCase().includes(q)
      })
    }
    if (statusFilter !== 'all') res = res.filter((r) => r.status === statusFilter)
    if (deptFilter !== 'all') res = res.filter((r) => (r.employee?.department || 'Unassigned') === deptFilter)

    res.sort((a, b) => {
      let av: string | number = 0
      let bv: string | number = 0
      if (sortKey === 'name') {
        av = `${a.employee?.first_name} ${a.employee?.last_name}`
        bv = `${b.employee?.first_name} ${b.employee?.last_name}`
      } else if (sortKey === 'department') {
        av = a.employee?.department || ''
        bv = b.employee?.department || ''
      } else if (sortKey === 'status') {
        av = a.status; bv = b.status
      } else {
        av = Number(a[sortKey as keyof PayrollRecord]) || 0
        bv = Number(b[sortKey as keyof PayrollRecord]) || 0
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return res
  }, [records, search, statusFilter, deptFilter, sortKey, sortDir])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      : <ChevronsUpDown className="w-3 h-3 opacity-30" />

  const handleUpdateStatus = async (rec: PayrollRecord, status: 'draft' | 'approved' | 'paid') => {
    setUpdating(rec.employee_id)
    try {
      await actionUpdateStatus(rec.employee_id, rec.period_month, rec.period_year, status)
      onRefresh()
    } finally {
      setUpdating(null)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Employee', 'Department', 'Position', 'Basic Salary', 'Allowances', 'Bonuses', 'Commission', 'Tax', 'Deductions', 'Net Salary', 'Status'],
      ...filtered.map((r) => [
        `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim(),
        r.employee?.department || '',
        r.employee?.position || '',
        r.basic_salary, r.allowances, r.bonuses, r.commission_amount, r.tax, r.deductions, r.net_salary, r.status,
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `payroll-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search employees…"
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1) }}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-background border border-border hover:border-indigo-500/50 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" />CSV
        </button>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {records.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No payroll records</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Generate payroll for this period to see employees here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                {[
                  { label: 'Employee', k: 'name' as SortKey },
                  { label: 'Department', k: 'department' as SortKey },
                  { label: 'Basic', k: 'basic_salary' as SortKey },
                  { label: 'Allowances', k: 'allowances' as SortKey },
                  { label: 'Bonuses', k: 'bonuses' as SortKey },
                  { label: 'Commission', k: 'commission_amount' as SortKey },
                  { label: 'Tax', k: 'tax' as SortKey },
                  { label: 'Deductions', k: 'deductions' as SortKey },
                  { label: 'Net Salary', k: 'net_salary' as SortKey },
                  { label: 'Status', k: 'status' as SortKey },
                  { label: 'Actions', k: null },
                ].map(({ label, k }) => (
                  <th
                    key={label}
                    onClick={() => k && handleSort(k)}
                    className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider ${k ? 'cursor-pointer hover:text-foreground' : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {k && <SortIcon k={k} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((rec) => {
                const name = `${rec.employee?.first_name || 'Unknown'} ${rec.employee?.last_name || ''}`.trim()
                const status = STATUS_CONFIG[rec.status] || STATUS_CONFIG.draft
                const StatusIcon = status.icon
                return (
                  <motion.tr
                    key={rec.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                          {name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-xs">{name}</p>
                          <p className="text-muted-foreground text-xs">{rec.employee?.position || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{rec.employee?.department || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-foreground">{fmt(rec.basic_salary)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-emerald-400">{fmt(rec.allowances)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-yellow-400">{fmt(rec.bonuses)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-violet-400">{fmt(rec.commission_amount)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-orange-400">{fmt(rec.tax)}</td>
                    <td className="px-4 py-3 text-xs font-mono text-red-400">{fmt(rec.deductions)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">{fmt(rec.net_salary)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSelectRecord(rec)}
                          className="p-1.5 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Payslip"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {rec.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateStatus(rec, 'approved')}
                            disabled={updating === rec.employee_id}
                            className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {rec.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(rec, 'paid')}
                            disabled={updating === rec.employee_id}
                            className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                  p === page ? 'bg-indigo-600 text-white' : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
