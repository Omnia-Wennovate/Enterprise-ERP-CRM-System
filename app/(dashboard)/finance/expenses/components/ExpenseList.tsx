'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Pencil, Trash2, Copy, Printer, Download, Archive,
  CreditCard, Paperclip, ChevronLeft, ChevronRight,
  AlertTriangle, CheckCircle, Clock, XCircle
} from 'lucide-react'
import type { ExpenseWithRelations } from '@/types/finance'

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const statusBadge = {
  unpaid:     'bg-amber-100 text-amber-700 border-amber-200',
  paid:       'bg-green-100 text-green-700 border-green-200',
  reimbursed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled:  'bg-slate-100 text-slate-600 border-slate-200',
  archived:   'bg-slate-100 text-slate-500 border-slate-200',
}

const approvalBadge = {
  pending:      'bg-amber-100 text-amber-700',
  approved:     'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  returned:     'bg-orange-100 text-orange-700',
  not_required: 'bg-slate-100 text-slate-600',
}

const approvalIcon = {
  pending:      <Clock size={12}/>,
  approved:     <CheckCircle size={12}/>,
  rejected:     <XCircle size={12}/>,
  returned:     <AlertTriangle size={12}/>,
  not_required: <CheckCircle size={12}/>,
}

interface ExpenseListProps {
  expenses: ExpenseWithRelations[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  onPageChange: (page: number) => void
  onView: (expense: ExpenseWithRelations) => void
  onEdit: (expense: ExpenseWithRelations) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onMarkPaid: (id: string) => void
  onExportPDF: (expense: ExpenseWithRelations) => void
}

export function ExpenseList({
  expenses, total, page, pageSize, loading,
  onPageChange, onView, onEdit, onDelete, onDuplicate, onArchive, onMarkPaid, onExportPDF,
}: ExpenseListProps) {
  const [actionOpen, setActionOpen] = useState<string | null>(null)
  const totalPages = Math.ceil(total / pageSize)

  const handlePrint = (exp: ExpenseWithRelations) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Expense ${exp.expense_number}</title>
    <style>body{font-family:sans-serif;padding:40px;color:#1e293b}h1{color:#0d9488}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px 12px;border-bottom:1px solid #e2e8f0}td:first-child{font-weight:600;width:160px;color:#64748b}</style>
    </head><body>
    <h1>Expense ${exp.expense_number ?? ''}</h1>
    <table>
      <tr><td>Date</td><td>${fmtDate(exp.expense_date)}</td></tr>
      <tr><td>Vendor</td><td>${exp.vendor_name ?? '-'}</td></tr>
      <tr><td>Employee</td><td>${exp.employee_name ?? '-'}</td></tr>
      <tr><td>Department</td><td>${exp.department ?? '-'}</td></tr>
      <tr><td>Category</td><td>${exp.category}</td></tr>
      <tr><td>Description</td><td>${exp.description}</td></tr>
      <tr><td>Amount</td><td>${fmt(exp.amount, exp.currency ?? 'USD')}</td></tr>
      <tr><td>Tax</td><td>${fmt(exp.tax ?? 0, exp.currency ?? 'USD')}</td></tr>
      <tr><td>Payment</td><td>${exp.payment_method ?? '-'}</td></tr>
      <tr><td>Status</td><td>${exp.status ?? '-'}</td></tr>
      <tr><td>Approval</td><td>${exp.approval_status ?? '-'}</td></tr>
    </table>
    </body></html>`)
    win.document.close()
    win.print()
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-12 text-center text-muted-foreground">
          <div className="inline-block w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"/>
          <p>Loading expenses...</p>
        </div>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <div className="text-5xl mb-3">📄</div>
        <p className="text-muted-foreground font-medium">No expenses found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or add a new expense</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border">
            <tr>
              {['Expense #','Date','Employee','Dept','Vendor','Category','Description','Amount','Tax','Currency','Payment','Booking','Status','Approval','Attachments','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence>
              {expenses.map((exp) => {
                const statusCls = statusBadge[exp.status as keyof typeof statusBadge] ?? statusBadge.unpaid
                const approvalCls = approvalBadge[exp.approval_status as keyof typeof approvalBadge] ?? approvalBadge.pending
                const approvalIco = approvalIcon[exp.approval_status as keyof typeof approvalIcon] ?? approvalIcon.pending
                return (
                  <motion.tr
                    key={exp.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => onView(exp)} className="text-teal-600 font-semibold hover:text-teal-700">
                        {exp.expense_number ?? 'EXP-???'}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmtDate(exp.expense_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{exp.employee_name ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{exp.department ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{exp.vendor_name ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-foreground">{exp.category}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{exp.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-foreground">
                      {fmt(exp.amount, exp.currency ?? 'USD')}
                      {exp.policy_exceeded && (
                      <span title="Exceeds policy limit">
                        <AlertTriangle size={12} className="inline ml-1 text-amber-500"/>
                      </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{fmt(exp.tax ?? 0, exp.currency ?? 'USD')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-700">{exp.currency ?? 'USD'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground capitalize">
                      {exp.payment_method?.replace('_',' ') ?? '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{exp.booking_reference ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCls}`}>
                        {exp.status ?? 'unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${approvalCls}`}>
                        {approvalIco}
                        {exp.approval_status ?? 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {(exp.attachment_count ?? 0) > 0 ? (
                        <span className="flex items-center gap-1 text-teal-600 text-xs font-medium">
                          <Paperclip size={12}/>{exp.attachment_count}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap relative">
                      <div className="flex items-center gap-1">
                        <button onClick={() => onView(exp)} title="View" className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors"><Eye size={14}/></button>
                        <button onClick={() => onEdit(exp)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Pencil size={14}/></button>
                        <button onClick={() => handlePrint(exp)} title="Print" className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><Printer size={14}/></button>
                        <div className="relative">
                          <button
                            onClick={() => setActionOpen(actionOpen === exp.id ? null : exp.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors text-xs font-bold"
                            title="More"
                          >
                            ···
                          </button>
                          {actionOpen === exp.id && (
                            <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[160px] py-1">
                              <button onClick={() => { onDuplicate(exp.id); setActionOpen(null) }} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left"><Copy size={13}/>Duplicate</button>
                              <button onClick={() => { onMarkPaid(exp.id); setActionOpen(null) }} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left"><CreditCard size={13}/>Mark as Paid</button>
                              <button onClick={() => { onExportPDF(exp); setActionOpen(null) }} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left"><Download size={13}/>Export PDF</button>
                              <button onClick={() => { onArchive(exp.id); setActionOpen(null) }} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left"><Archive size={13}/>Archive</button>
                              <div className="border-t border-border my-1"/>
                              <button onClick={() => { if(confirm('Delete this expense?')) { onDelete(exp.id); setActionOpen(null) } }} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 text-red-600 w-full text-left"><Trash2 size={13}/>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total} expenses
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16}/>
            </button>
            <span className="text-sm font-medium text-foreground px-2">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
