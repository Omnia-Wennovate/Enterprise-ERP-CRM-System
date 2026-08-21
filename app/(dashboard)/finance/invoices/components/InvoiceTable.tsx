'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, ChevronUp, ChevronDown, Download,
  CheckSquare, Square, MoreHorizontal, Eye, Send, XCircle,
  Copy, Printer, ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react'
import type { InvoiceWithRelations } from '@/lib/services/invoice-dashboard'

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  partially_paid: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-muted text-muted-foreground dark:bg-gray-800 dark:text-muted-foreground',
}

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-600',
  medium: 'bg-amber-100 text-amber-600',
  low: 'bg-slate-100 text-slate-500',
  urgent: 'bg-red-200 text-red-800',
}

const fmt = (n: number, cur = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)

interface InvoiceTableProps {
  invoices: InvoiceWithRelations[]
  total: number
  loading: boolean
  page: number
  pageSize: number
  search: string
  activeFilter: Record<string, string>
  onPageChange: (p: number) => void
  onSearch: (s: string) => void
  onSelectInvoice: (inv: InvoiceWithRelations) => void
  onClearFilters: () => void
  onFilterChange?: (f: Record<string, string>) => void
}

type SortKey = 'invoice_number' | 'issued_date' | 'due_date' | 'total_amount' | 'status'

export default function InvoiceTable({
  invoices, total, loading, page, pageSize, search,
  activeFilter, onPageChange, onSearch, onSelectInvoice, onClearFilters, onFilterChange,
}: InvoiceTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>('issued_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; inv: InvoiceWithRelations } | null>(null)
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal')
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
  const [showColPicker, setShowColPicker] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...invoices].sort((a, b) => {
      const av = a[sortKey] ?? ''; const bv = b[sortKey] ?? ''
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [invoices, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const toggleAll = () => {
    if (selected.size === sorted.length) setSelected(new Set())
    else setSelected(new Set(sorted.map(i => i.id)))
  }

  const SortIcon = ({ col }: { col: SortKey }) => sortKey === col
    ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)
    : <ChevronDown size={12} className="opacity-30"/>

  const TH = ({ col, children, className = '' }: { col: SortKey; children: React.ReactNode; className?: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className={`px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground group whitespace-nowrap ${className}`}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon col={col}/>
      </div>
    </th>
  )

  const rowPy = density === 'compact' ? 'py-1.5' : density === 'comfortable' ? 'py-4' : 'py-2.5'

  const COLUMNS = [
    'Invoice #', 'Customer', 'Booking', 'Issued', 'Due Date',
    'Currency', 'Total', 'Paid', 'Remaining', 'Status', 'Priority', 'Approval', 'Actions',
  ]

  const exportCSV = () => {
    const rows = sorted.map(inv => [
      inv.invoice_number, inv.customer_name || inv.customer_id,
      inv.booking_reference || '', inv.issued_date, inv.due_date,
      inv.currency, inv.total_amount, inv.paid_amount ?? 0,
      inv.outstanding ?? 0, inv.status, inv.priority || '', inv.approval_status,
    ])
    const csv = [
      ['Invoice #', 'Customer', 'Booking', 'Issued', 'Due', 'Currency', 'Total', 'Paid', 'Remaining', 'Status', 'Priority', 'Approval'],
      ...rows,
    ].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv' }))
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const hasFilters = Object.keys(activeFilter).length > 0 || statusFilter !== 'all'

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-border flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search invoice #, customer, booking..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={13} className="text-muted-foreground hover:text-foreground"/>
            </button>
          )}
        </div>

        {/* Status quick filter */}
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); onFilterChange?.({ status: e.target.value }) }}
          className="text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Active filter chips */}
        {Object.entries(activeFilter).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
            {k}: {v}
            <button onClick={() => onClearFilters()}><X size={10}/></button>
          </span>
        ))}
        {hasFilters && (
          <button onClick={onClearFilters} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {/* Density */}
          <button
            onClick={() => setDensity(d => d === 'compact' ? 'normal' : d === 'normal' ? 'comfortable' : 'compact')}
            title={`Density: ${density}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal size={15}/>
          </button>

          {/* Col picker */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(v => !v)}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal size={15}/>
            </button>
            <AnimatePresence>
              {showColPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-xl shadow-xl z-30 p-2"
                >
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">Toggle Columns</div>
                  {COLUMNS.map(col => (
                    <button
                      key={col}
                      onClick={() => setHiddenCols(s => { const n = new Set(s); n.has(col) ? n.delete(col) : n.add(col); return n })}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                      {hiddenCols.has(col) ? <Square size={12} className="text-muted-foreground"/> : <CheckSquare size={12} className="text-blue-500"/>}
                      {col}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-3 px-4 py-2.5 bg-omnia-gold/5 dark:bg-blue-900/20 border-b border-border text-sm overflow-hidden"
          >
            <span className="font-semibold text-blue-700 dark:text-blue-300">{selected.size} selected</span>
            <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs hover:bg-blue-200 transition-colors">
              <Send size={11}/> Send Reminders
            </button>
            <button className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors">
              <Download size={11}/> Export Selected
            </button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground">
              <X size={13}/>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto" onClick={() => setContextMenu(null)}>
        <table className="w-full min-w-[900px]">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="px-3 py-3 w-10">
                <button onClick={toggleAll}>
                  {selected.size === sorted.length && sorted.length > 0
                    ? <CheckSquare size={14} className="text-blue-500"/>
                    : <Square size={14} className="text-muted-foreground"/>}
                </button>
              </th>
              {!hiddenCols.has('Invoice #') && <TH col="invoice_number">Invoice #</TH>}
              {!hiddenCols.has('Customer') && <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Customer</th>}
              {!hiddenCols.has('Booking') && <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Booking</th>}
              {!hiddenCols.has('Issued') && <TH col="issued_date">Issued</TH>}
              {!hiddenCols.has('Due Date') && <TH col="due_date">Due</TH>}
              {!hiddenCols.has('Currency') && <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cur.</th>}
              {!hiddenCols.has('Total') && <TH col="total_amount" className="text-right">Total</TH>}
              {!hiddenCols.has('Paid') && <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid</th>}
              {!hiddenCols.has('Remaining') && <th className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remaining</th>}
              {!hiddenCols.has('Status') && <TH col="status">Status</TH>}
              {!hiddenCols.has('Priority') && <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>}
              {!hiddenCols.has('Approval') && <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Approval</th>}
              {!hiddenCols.has('Actions') && <th className="px-3 py-3 w-16"/>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-3"><div className="w-4 h-4 rounded bg-muted"/></td>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-3 rounded bg-muted w-full"/></td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-16 text-center text-sm text-muted-foreground">
                  No invoices found
                </td>
              </tr>
            ) : (
              sorted.map(inv => {
                const isSelected = selected.has(inv.id)
                const isOverdue = inv.status === 'overdue'
                const progress = inv.total_amount > 0 ? Math.min(100, ((inv.paid_amount ?? 0) / inv.total_amount) * 100) : 0

                return (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`group transition-colors hover:bg-muted/30 cursor-pointer ${isSelected ? 'bg-omnia-gold/5/50 dark:bg-blue-900/10' : ''} ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/5' : ''}`}
                    onContextMenu={e => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, inv }) }}
                    onClick={() => onSelectInvoice(inv)}
                  >
                    <td className="px-3" onClick={e => { e.stopPropagation(); toggleSelect(inv.id) }}>
                      {isSelected ? <CheckSquare size={14} className="text-blue-500"/> : <Square size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100"/>}
                    </td>

                    {!hiddenCols.has('Invoice #') && (
                      <td className={`px-3 ${rowPy} whitespace-nowrap`}>
                        <span className="font-mono text-xs font-semibold text-foreground">{inv.invoice_number}</span>
                      </td>
                    )}
                    {!hiddenCols.has('Customer') && (
                      <td className={`px-3 ${rowPy} whitespace-nowrap max-w-[160px] truncate text-sm text-foreground`}>
                        {inv.customer_name || <span className="text-muted-foreground italic text-xs">Unknown</span>}
                      </td>
                    )}
                    {!hiddenCols.has('Booking') && (
                      <td className={`px-3 ${rowPy} text-xs text-muted-foreground font-mono`}>{inv.booking_reference || '—'}</td>
                    )}
                    {!hiddenCols.has('Issued') && (
                      <td className={`px-3 ${rowPy} text-xs text-muted-foreground whitespace-nowrap`}>{inv.issued_date}</td>
                    )}
                    {!hiddenCols.has('Due Date') && (
                      <td className={`px-3 ${rowPy} text-xs whitespace-nowrap ${isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}`}>
                        {inv.due_date}
                      </td>
                    )}
                    {!hiddenCols.has('Currency') && (
                      <td className={`px-3 ${rowPy} text-xs font-medium text-muted-foreground`}>{inv.currency}</td>
                    )}
                    {!hiddenCols.has('Total') && (
                      <td className={`px-3 ${rowPy} text-sm font-semibold text-foreground text-right whitespace-nowrap`}>
                        {fmt(inv.total_amount, inv.currency)}
                      </td>
                    )}
                    {!hiddenCols.has('Paid') && (
                      <td className={`px-3 ${rowPy} text-sm text-emerald-600 text-right whitespace-nowrap`}>
                        {fmt(inv.paid_amount ?? 0, inv.currency)}
                      </td>
                    )}
                    {!hiddenCols.has('Remaining') && (
                      <td className={`px-3 ${rowPy} text-right whitespace-nowrap`}>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-sm font-medium ${(inv.outstanding ?? 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {fmt(inv.outstanding ?? 0, inv.currency)}
                          </span>
                          {inv.total_amount > 0 && (
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}/>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {!hiddenCols.has('Status') && (
                      <td className={`px-3 ${rowPy} whitespace-nowrap`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[inv.status] || STATUS_STYLES.draft}`}>
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                    )}
                    {!hiddenCols.has('Priority') && (
                      <td className={`px-3 ${rowPy} whitespace-nowrap`}>
                        {inv.priority && (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[inv.priority?.toLowerCase()] || PRIORITY_STYLES.low}`}>
                            {inv.priority}
                          </span>
                        )}
                      </td>
                    )}
                    {!hiddenCols.has('Approval') && (
                      <td className={`px-3 ${rowPy} text-xs text-muted-foreground`}>{inv.approval_status || '—'}</td>
                    )}
                    {!hiddenCols.has('Actions') && (
                      <td className={`px-3 ${rowPy}`} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Eye size={13} className="text-muted-foreground"/>
                        </button>
                      </td>
                    )}
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100 }}
            className="bg-popover border border-border rounded-xl shadow-2xl w-44 py-1"
            onClick={e => e.stopPropagation()}
          >
            {[
              { icon: Eye, label: 'View Details', action: () => { onSelectInvoice(contextMenu.inv); setContextMenu(null) } },
              { icon: Send, label: 'Send Invoice', action: () => setContextMenu(null) },
              { icon: Copy, label: 'Duplicate', action: () => setContextMenu(null) },
              { icon: Printer, label: 'Print', action: () => setContextMenu(null) },
              { icon: XCircle, label: 'Cancel', action: () => setContextMenu(null) },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <item.icon size={13} className="text-muted-foreground"/>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {total > 0 ? `${((page - 1) * pageSize) + 1}–${Math.min(page * pageSize, total)} of ${total} invoices` : '0 invoices'}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15}/>
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2
            if (p < 1 || p > totalPages) return null
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={15}/>
          </button>
        </div>
      </div>
    </div>
  )
}
