'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Calendar, Tag, DollarSign, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Paperclip } from 'lucide-react'
import type { ExpenseWithRelations } from '@/types/finance'

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const STATUS_CONFIG = {
  pending: { label: 'Pending Review', icon: <Clock size={12} />, cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', icon: <CheckCircle size={12} />, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', icon: <XCircle size={12} />, cls: 'bg-red-100 text-red-700 border-red-200' },
  returned: { label: 'Returned', icon: <AlertTriangle size={12} />, cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  not_required: { label: 'N/A', icon: <CheckCircle size={12} />, cls: 'bg-slate-100 text-slate-600 border-slate-200' },
}

interface DeptExpenseListProps {
  expenses: ExpenseWithRelations[]
  total: number
  loading: boolean
  page: number
  pageSize: number
  onPageChange: (p: number) => void
  onView: (e: ExpenseWithRelations) => void
}

export function DeptExpenseList({ expenses, total, loading, page, pageSize, onPageChange, onView }: DeptExpenseListProps) {
  const totalPages = Math.ceil(total / pageSize)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <FileText size={40} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">No expenses submitted yet</p>
        <p className="text-xs mt-1">Click &ldquo;+ Submit Expense&rdquo; to create your first expense</p>
      </div>
    )
  }

  // Group by trip_reference for bundle display
  interface TripGroup {
    tripRef: string
    expenses: ExpenseWithRelations[]
    total: number
    expanded: boolean
  }

  const standaloneExpenses = expenses.filter((e) => !(e as any).trip_reference)
  const bundleMap: Record<string, ExpenseWithRelations[]> = {}
  expenses.forEach((e) => {
    const ref = (e as any).trip_reference
    if (ref) {
      if (!bundleMap[ref]) bundleMap[ref] = []
      bundleMap[ref].push(e)
    }
  })

  const ExpenseRow = ({ expense, indent = false }: { expense: ExpenseWithRelations; indent?: boolean }) => {
    const statusKey = (expense.approval_status || 'pending') as keyof typeof STATUS_CONFIG
    const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-4 px-5 py-4 bg-card border border-border rounded-xl hover:border-omnia-gold/30 hover:shadow-sm transition-all group cursor-pointer ${indent ? 'ml-6 border-l-4 border-l-omnia-gold/30' : ''}`}
        onClick={() => onView(expense)}
      >
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-28 flex-shrink-0">
          <Calendar size={12} />
          <span>{fmtDate(expense.expense_date)}</span>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground w-28 flex-shrink-0">
          <Tag size={12} className="text-omnia-gold" />
          <span className="truncate">{expense.category}</span>
        </div>

        {/* Description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{expense.description}</p>
          {expense.notes && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{expense.notes}</p>
          )}
        </div>

        {/* Amount */}
        <div className="flex items-center gap-1 text-sm font-bold text-foreground flex-shrink-0 w-28 text-right">
          <DollarSign size={13} className="text-omnia-gold" />
          <span>{fmt(expense.amount, expense.currency ?? 'USD').replace('$', '')}</span>
        </div>

        {/* Status */}
        <div className="flex-shrink-0 w-32">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.cls}`}>
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Document */}
        <div className="flex-shrink-0 w-16 text-center">
          {(expense.attachment_count ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs text-omnia-gold">
              <Paperclip size={12} />
              {expense.attachment_count}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">—</span>
          )}
        </div>

        {/* View */}
        <button
          className="flex-shrink-0 p-1.5 rounded-lg bg-muted/40 hover:bg-omnia-gold/10 text-muted-foreground hover:text-omnia-gold transition-all opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onView(expense) }}
          title="View details"
        >
          <Eye size={14} />
        </button>

        {/* Policy flag */}
        {expense.policy_exceeded && (
          <span title="Exceeds policy limit" className="flex-shrink-0">
            <AlertTriangle size={14} className="text-amber-500" />
          </span>
        )}
      </motion.div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="flex items-center gap-4 px-5 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        <span className="w-28 flex-shrink-0">Date</span>
        <span className="w-28 flex-shrink-0">Category</span>
        <span className="flex-1">Description</span>
        <span className="w-28 flex-shrink-0 text-right">Amount</span>
        <span className="w-32 flex-shrink-0">Status</span>
        <span className="w-16 flex-shrink-0 text-center">Docs</span>
        <span className="w-8 flex-shrink-0" />
      </div>

      {/* Standalone expenses */}
      {standaloneExpenses.map((exp) => (
        <ExpenseRow key={exp.id} expense={exp} />
      ))}

      {/* Trip bundles */}
      {Object.entries(bundleMap).map(([tripRef, tripExps]) => {
        const bundleTotal = tripExps.reduce((s, e) => s + (e.amount || 0), 0)
        const hasApproved = tripExps.every((e) => e.approval_status === 'approved')
        const hasPending = tripExps.some((e) => e.approval_status === 'pending')

        return (
          <div key={tripRef} className="space-y-2">
            {/* Bundle header */}
            <div className="flex items-center gap-3 px-5 py-3 bg-omnia-gold/5 border border-omnia-gold/20 rounded-xl">
              <span className="text-xs font-bold text-omnia-gold uppercase tracking-wide">🧳 Trip Bundle</span>
              <span className="text-sm font-semibold text-foreground">{tripRef}</span>
              <span className="ml-auto text-xs text-muted-foreground">{tripExps.length} items · {fmt(bundleTotal)}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${hasApproved ? STATUS_CONFIG.approved.cls : hasPending ? STATUS_CONFIG.pending.cls : STATUS_CONFIG.rejected.cls}`}>
                {hasApproved ? <CheckCircle size={10} /> : hasPending ? <Clock size={10} /> : <XCircle size={10} />}
                {hasApproved ? 'All Approved' : hasPending ? 'Pending' : 'Has Rejections'}
              </span>
            </div>
            {/* Individual items */}
            {tripExps.map((exp) => (
              <ExpenseRow key={exp.id} expense={exp} indent />
            ))}
          </div>
        )
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-muted-foreground px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
