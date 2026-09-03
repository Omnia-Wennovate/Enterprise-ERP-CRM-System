'use client'

import { useState, useCallback } from 'react'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

const CATEGORIES = [
  'Travel','Flights','Hotels','Visa','Transportation','Fuel','Meals',
  'Office Supplies','Marketing','Utilities','Internet','Phone','Training',
  'Software','Equipment','Maintenance','Salary','Taxes','Insurance','Miscellaneous',
]

const DEPARTMENTS = ['Finance','Operations','HR','Sales','Marketing','IT','Admin','Management']
const PAYMENT_METHODS = ['cash','bank_transfer','card','mobile_money','check','online']
const APPROVAL_STATUSES = ['pending','approved','rejected','returned','not_required']
const EXPENSE_STATUSES = ['unpaid','paid','reimbursed','cancelled','archived']
const CURRENCIES = ['USD','EUR','GBP','AED','SAR','ETB','TRY','EGP']

export interface ExpenseFilters {
  search: string
  category: string
  department: string
  status: string
  approval_status: string
  payment_method: string
  currency: string
  date_from: string
  date_to: string
  amount_min: string
  amount_max: string
}

interface SearchFilterBarProps {
  filters: ExpenseFilters
  onFiltersChange: (filters: ExpenseFilters) => void
  onClear: () => void
}

export const defaultFilters: ExpenseFilters = {
  search: '', category: '', department: '', status: '',
  approval_status: '', payment_method: '', currency: '',
  date_from: '', date_to: '', amount_min: '', amount_max: '',
}

export function SearchFilterBar({ filters, onFiltersChange, onClear }: SearchFilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = useCallback(
    (key: keyof ExpenseFilters, value: string) => {
      onFiltersChange({ ...filters, [key]: value })
    },
    [filters, onFiltersChange]
  )

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v !== ''
  ).length

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Search row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search expense number, employee, vendor, description, reference..."
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500 text-foreground placeholder:text-muted-foreground"
            id="expense-search"
          />
          {filters.search && (
            <button
              onClick={() => update('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            showAdvanced || activeCount > 0
              ? 'bg-omnia-gold/10 text-omnia-gold-dark border-omnia-gold/40'
              : 'bg-muted text-muted-foreground border-border hover:border-omnia-gold/40'
          }`}
          id="expense-filter-toggle"
        >
          <Filter size={14} />
          Filters
          {activeCount > 0 && (
            <span className="bg-omnia-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {(activeCount > 0 || filters.search) && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Quick-filter pills: Dept Requests */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/10">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick:</span>
        <button
          onClick={() => onFiltersChange({ ...defaultFilters, approval_status: 'pending', submission_source: 'department' } as any)}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
            (filters as any).submission_source === 'department'
              ? 'bg-omnia-gold text-[#0d3553] border-omnia-gold'
              : 'bg-card border-border text-muted-foreground hover:border-omnia-gold/40 hover:text-foreground'
          }`}
          id="filter-dept-requests"
        >
          🏢 Dept Requests (Pending)
        </button>
        <button
          onClick={() => onFiltersChange({ ...defaultFilters, approval_status: 'pending' })}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
            filters.approval_status === 'pending' && !(filters as any).submission_source
              ? 'bg-amber-100 text-amber-700 border-amber-300'
              : 'bg-card border-border text-muted-foreground hover:border-amber-300 hover:text-foreground'
          }`}
        >
          ⏳ All Pending
        </button>
        <button
          onClick={() => onFiltersChange({ ...defaultFilters, approval_status: 'approved' })}
          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
            filters.approval_status === 'approved'
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-card border-border text-muted-foreground hover:border-emerald-300 hover:text-foreground'
          }`}
        >
          ✓ Approved
        </button>
      </div>
      {showAdvanced && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Category</label>
            <select
              value={filters.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-category"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Department</label>
            <select
              value={filters.department}
              onChange={(e) => update('department', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-department"
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => update('status', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-status"
            >
              <option value="">All statuses</option>
              {EXPENSE_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {/* Approval Status */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Approval</label>
            <select
              value={filters.approval_status}
              onChange={(e) => update('approval_status', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-approval"
            >
              <option value="">All approvals</option>
              {APPROVAL_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Payment</label>
            <select
              value={filters.payment_method}
              onChange={(e) => update('payment_method', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-payment-method"
            >
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Currency</label>
            <select
              value={filters.currency}
              onChange={(e) => update('currency', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-currency"
            >
              <option value="">All currencies</option>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => update('date_from', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-date-from"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => update('date_to', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-date-to"
            />
          </div>

          {/* Amount Range */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Min Amount</label>
            <input
              type="number"
              placeholder="0"
              value={filters.amount_min}
              onChange={(e) => update('amount_min', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-amount-min"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-1 block">Max Amount</label>
            <input
              type="number"
              placeholder="No limit"
              value={filters.amount_max}
              onChange={(e) => update('amount_max', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-omnia-gold-500"
              id="filter-amount-max"
            />
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/10 border-t border-border">
          {Object.entries(filters)
            .filter(([k, v]) => k !== 'search' && v !== '')
            .map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-1 bg-omnia-gold/15 text-omnia-gold-dark rounded-full text-xs font-medium"
              >
                {key.replace(/_/g, ' ')}: {value}
                <button onClick={() => update(key as keyof ExpenseFilters, '')} className="hover:text-foreground">
                  <X size={10} />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  )
}
