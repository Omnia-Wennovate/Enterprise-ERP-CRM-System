'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, X, ChevronLeft, ChevronRight, ChevronDown,
  Download, Eye, MoreHorizontal, ChevronsUpDown, ArrowUpDown,
  SlidersHorizontal, RotateCcw
} from 'lucide-react'
import type { PaymentWithRelations, PaymentFilter } from '@/types/finance'

const fmtCurrency = (v: number, currency = 'ETB') =>
  `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v)}`

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

const statusStyles: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-200',
  failed: 'bg-red-500/10 text-red-700 border-red-200',
  refunded: 'bg-purple-500/10 text-purple-700 border-purple-200',
}

interface PaymentTableProps {
  payments: PaymentWithRelations[]
  total: number
  page: number
  pageSize: number
  loading: boolean
  filters: PaymentFilter
  onPageChange: (page: number) => void
  onFilterChange: (filters: Partial<PaymentFilter>) => void
  onViewPayment: (payment: PaymentWithRelations) => void
  onExport?: () => void
}

export default function PaymentTable({
  payments, total, page, pageSize, loading,
  filters, onPageChange, onFilterChange, onViewPayment, onExport,
}: PaymentTableProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [showFilters, setShowFilters] = useState(false)
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortCol, setSortCol] = useState<string>(filters.sortBy || 'payment_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(filters.sortOrder || 'desc')

  const totalPages = Math.ceil(total / pageSize)
  const hasActiveFilters = !!(filters.status || filters.paymentMethod || filters.currency || filters.startDate || filters.amountMin)

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value)
    // Debounce
    const timeout = setTimeout(() => {
      onFilterChange({ search: value || undefined })
    }, 300)
    return () => clearTimeout(timeout)
  }, [onFilterChange])

  const handleSort = useCallback((col: string) => {
    const newDir = sortCol === col && sortDir === 'desc' ? 'asc' : 'desc'
    setSortCol(col)
    setSortDir(newDir)
    onFilterChange({ sortBy: col, sortOrder: newDir })
  }, [sortCol, sortDir, onFilterChange])

  const handleClearFilters = () => {
    setSearchInput('')
    onFilterChange({
      search: undefined, status: undefined, paymentMethod: undefined,
      currency: undefined, startDate: undefined, endDate: undefined,
      amountMin: undefined, amountMax: undefined, customerId: undefined,
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === payments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(payments.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const densityPadding = density === 'compact' ? 'px-4 py-2' : density === 'comfortable' ? 'px-6 py-5' : 'px-5 py-3.5'

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <button
      onClick={() => handleSort(col)}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${
        sortCol === col ? 'opacity-100 text-omnia-gold' : ''
      }`} />
    </button>
  )

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-border/30 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search payments, customers, invoices, references..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30 focus:border-omnia-gold/50 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); onFilterChange({ search: undefined }) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-omnia-gold/100/10 border-omnia-gold/30 text-omnia-gold-dark'
                  : 'bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-omnia-gold/100" />
              )}
            </button>

            {/* Density */}
            <div className="flex items-center bg-muted/30 rounded-lg border border-border/40 p-0.5">
              {(['compact', 'normal', 'comfortable'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                    density === d ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>

            {/* Export */}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-muted/30 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                <select
                  value={filters.status || ''}
                  onChange={(e) => onFilterChange({ status: e.target.value || undefined })}
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>

                <select
                  value={filters.paymentMethod || ''}
                  onChange={(e) => onFilterChange({ paymentMethod: e.target.value || undefined })}
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                >
                  <option value="">All Methods</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>

                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => onFilterChange({ startDate: e.target.value || undefined })}
                  placeholder="From Date"
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                />

                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onFilterChange({ endDate: e.target.value || undefined })}
                  placeholder="To Date"
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                />

                <input
                  type="number"
                  value={filters.amountMin || ''}
                  onChange={(e) => onFilterChange({ amountMin: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Min Amount"
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                />

                <input
                  type="number"
                  value={filters.amountMax || ''}
                  onChange={(e) => onFilterChange({ amountMax: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Max Amount"
                  className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-omnia-gold-500/30"
                />
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1.5 text-xs font-medium text-omnia-gold hover:text-omnia-gold-dark transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30 border-b border-border/30">
            <tr>
              <th className={`${densityPadding} text-left`}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === payments.length && payments.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className={densityPadding}><SortHeader col="payment_date" label="Date" /></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</span></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoice</span></th>
              <th className={densityPadding}><SortHeader col="amount" label="Amount" /></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Method</span></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reference</span></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Remaining</span></th>
              <th className={densityPadding}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recorded By</span></th>
              <th className={`${densityPadding} text-right`}><span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className={densityPadding}><div className="w-4 h-4 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-28 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-24 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-16 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-16 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className={densityPadding}><div className="h-4 w-8 bg-muted rounded" /></td>
                </tr>
              ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-12 text-sm text-muted-foreground">
                  No payments found matching your criteria.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => onViewPayment(payment)}
                >
                  <td className={densityPadding} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(payment.id)}
                      onChange={() => toggleSelect(payment.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className={`${densityPadding} whitespace-nowrap text-sm text-foreground`}>
                    {fmtDate(payment.payment_date)}
                  </td>
                  <td className={`${densityPadding} text-sm`}>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[160px]">{payment.customer_name || '—'}</p>
                      {payment.booking_reference && (
                        <p className="text-xs text-muted-foreground">{payment.booking_reference}</p>
                      )}
                    </div>
                  </td>
                  <td className={`${densityPadding} text-sm text-muted-foreground font-mono`}>
                    {payment.invoice_number || payment.invoice_id?.slice(0, 8) + '...'}
                  </td>
                  <td className={`${densityPadding} whitespace-nowrap text-sm font-semibold text-omnia-gold`}>
                    {fmtCurrency(payment.amount, payment.invoice_currency)}
                  </td>
                  <td className={`${densityPadding} text-sm text-muted-foreground`}>
                    <span className="capitalize">{(payment.payment_method || '').replace('_', ' ')}</span>
                  </td>
                  <td className={`${densityPadding} text-sm text-muted-foreground font-mono`}>
                    {payment.reference_number || '—'}
                  </td>
                  <td className={densityPadding}>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                      statusStyles[payment.status || 'completed'] || statusStyles.completed
                    }`}>
                      {payment.status || 'completed'}
                    </span>
                  </td>
                  <td className={`${densityPadding} whitespace-nowrap text-sm`}>
                    {payment.remaining_amount !== undefined && payment.remaining_amount > 0 ? (
                      <span className="text-amber-600 font-medium">
                        {fmtCurrency(payment.remaining_amount, payment.invoice_currency)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs">Fully Paid</span>
                    )}
                  </td>
                  <td className={`${densityPadding} text-sm text-muted-foreground truncate max-w-[120px]`}>
                    {payment.recorded_by_name || '—'}
                  </td>
                  <td className={`${densityPadding} text-right`} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onViewPayment(payment)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total} payments
            {selectedIds.size > 0 && (
              <span className="text-omnia-gold font-medium"> • {selectedIds.size} selected</span>
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page + i - 2
              if (pageNum < 1 || pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                    pageNum === page
                      ? 'bg-omnia-gold/100/10 text-omnia-gold-dark border border-omnia-gold/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
