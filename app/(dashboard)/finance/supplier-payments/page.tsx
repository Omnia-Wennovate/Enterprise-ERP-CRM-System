'use client'

import { useState, useEffect, useCallback } from 'react'
import { Building2, Clock, CheckCircle, AlertTriangle, Search, RefreshCw, Calendar, CreditCard } from 'lucide-react'
import {
  fetchSupplierPayments,
  fetchOverdueSupplierPayments,
  markSupplierPaymentPaidAction,
} from '@/app/actions/finance'
import type { SupplierPayment, MarkSupplierPaymentFormData } from '@/types/finance'
import { FinanceKPICard, FinanceKPICardSkeleton } from '@/components/finance/FinanceKPICard'
import { FinanceStatusBadge } from '@/components/finance/FinanceStatusBadge'
import { FinanceEmptyState } from '@/components/finance/FinanceEmptyState'

type FilterStatus = 'all' | 'pending' | 'paid' | 'overdue'

const CURRENCY = 'ETB'
const fmt = (n: number) => `${CURRENCY} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [overdue, setOverdue] = useState<SupplierPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [markModal, setMarkModal] = useState<SupplierPayment | null>(null)
  const [markForm, setMarkForm] = useState<Partial<MarkSupplierPaymentFormData>>({})
  const [markLoading, setMarkLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [all, ov] = await Promise.all([fetchSupplierPayments(), fetchOverdueSupplierPayments()])
      setPayments(all)
      setOverdue(ov)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // KPI calculations
  const today = new Date().toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const thisMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const pendingPayments = payments.filter(p => p.status === 'pending')
  const paidPayments    = payments.filter(p => p.status === 'paid')
  const overdueList     = payments.filter(p => p.status === 'pending' && p.due_date && p.due_date < today)
  const dueThisWeek     = pendingPayments.filter(p => p.due_date && p.due_date >= today && p.due_date <= nextWeek)
  const dueThisMonth    = pendingPayments.filter(p => p.due_date && p.due_date >= today && p.due_date <= thisMonthEnd)

  const pendingTotal    = pendingPayments.reduce((s, p) => s + p.amount, 0)
  const paidTotal       = paidPayments.reduce((s, p) => s + p.amount, 0)
  const overdueTotal    = overdueList.reduce((s, p) => s + p.amount, 0)
  const dueWeekTotal    = dueThisWeek.reduce((s, p) => s + p.amount, 0)
  const dueMonthTotal   = dueThisMonth.reduce((s, p) => s + p.amount, 0)

  // Filtered list
  const filtered = payments.filter(p => {
    if (filter === 'overdue') return p.status === 'pending' && p.due_date && p.due_date < today
    if (filter !== 'all' && p.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (p.supplier_name || '').toLowerCase().includes(q) ||
             (p.reference_number || '').toLowerCase().includes(q)
    }
    return true
  })

  const handleMarkPaid = async () => {
    if (!markModal) return
    setMarkLoading(true)
    try {
      await markSupplierPaymentPaidAction({
        supplier_payment_id: markModal.id,
        payment_date: markForm.payment_date || today,
        payment_method: markForm.payment_method || 'bank_transfer',
        reference_number: markForm.reference_number,
      })
      setMarkModal(null)
      setMarkForm({})
      await load()
    } catch (e) {
      alert(`Failed: ${e}`)
    } finally {
      setMarkLoading(false)
    }
  }

  const kpiCards = [
    { title: 'Total Payments', value: String(payments.length), icon: <Building2 size={18} />, status: 'neutral' as const },
    { title: 'Pending Payables', value: fmt(pendingTotal), icon: <Clock size={18} />, status: pendingTotal > 0 ? 'warning' as const : 'positive' as const, subValue: `${pendingPayments.length} records` },
    { title: 'Paid', value: fmt(paidTotal), icon: <CheckCircle size={18} />, status: 'positive' as const, subValue: `${paidPayments.length} records` },
    { title: 'Overdue', value: fmt(overdueTotal), icon: <AlertTriangle size={18} />, status: overdueList.length > 0 ? 'negative' as const : 'positive' as const, subValue: overdueList.length > 0 ? `${overdueList.length} overdue` : 'None overdue' },
    { title: 'Due This Week', value: fmt(dueWeekTotal), icon: <Calendar size={18} />, status: dueThisWeek.length > 0 ? 'warning' as const : 'neutral' as const, subValue: `${dueThisWeek.length} upcoming` },
    { title: 'Due This Month', value: fmt(dueMonthTotal), icon: <CreditCard size={18} />, status: 'neutral' as const, subValue: `${dueThisMonth.length} upcoming` },
  ]

  const FILTER_TABS: { key: FilterStatus; label: string }[] = [
    { key: 'all',     label: `All (${payments.length})` },
    { key: 'pending', label: `Pending (${pendingPayments.length})` },
    { key: 'paid',    label: `Paid (${paidPayments.length})` },
    { key: 'overdue', label: `Overdue (${overdueList.length})` },
  ]

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#0A1221] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C8A951] text-xs font-bold tracking-[0.25em] uppercase mb-1">Finance</p>
              <h1 className="text-2xl font-bold text-white">Supplier Payments</h1>
              <p className="text-slate-400 text-sm mt-1">Manage and track all payments to suppliers</p>
            </div>
            <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <FinanceKPICardSkeleton key={i} />)
            : kpiCards.map(c => <FinanceKPICard key={c.title} {...c} loading={false} />)
          }
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            {/* Filter tabs */}
            <div className="flex gap-1 flex-wrap">
              {FILTER_TABS.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${filter === t.key ? 'bg-[#0A1221] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search supplier, reference..."
                className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:border-[#C8A951] bg-slate-50"
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Loading...</div>
          ) : filtered.length === 0 ? (
            <FinanceEmptyState
              title="No supplier payments found"
              description="Supplier payment records will appear here once bookings are processed."
              icon={<Building2 size={24} strokeWidth={1.5} />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Supplier', 'Amount', 'Status', 'Due Date', 'Paid Date', 'Method', 'Ref #', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const isOverdue = p.status === 'pending' && p.due_date && p.due_date < today
                    return (
                      <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-[#0A1221]">{p.supplier_name || '—'}</td>
                        <td className="px-4 py-3 font-bold font-mono text-[#0A1221]">{fmt(p.amount)}</td>
                        <td className="px-4 py-3">
                          <FinanceStatusBadge status={isOverdue ? 'overdue' : p.status} />
                        </td>
                        <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {p.paid_date ? new Date(p.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{p.payment_method || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{p.reference_number || '—'}</td>
                        <td className="px-4 py-3">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => { setMarkModal(p); setMarkForm({ payment_date: today, payment_method: 'bank_transfer' }) }}
                              className="px-3 py-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {markModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#0A1221] mb-1">Mark as Paid</h3>
            <p className="text-xs text-slate-500 mb-4">
              Recording payment for: <span className="font-semibold text-[#0A1221]">{markModal.supplier_name || 'Supplier'}</span>
              {' '}— <span className="font-bold text-[#C8A951]">{fmt(markModal.amount)}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                <input type="date" value={markForm.payment_date || today}
                  onChange={e => setMarkForm(f => ({ ...f, payment_date: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select value={markForm.payment_method || 'bank_transfer'}
                  onChange={e => setMarkForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951] bg-white">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Number (optional)</label>
                <input type="text" value={markForm.reference_number || ''}
                  onChange={e => setMarkForm(f => ({ ...f, reference_number: e.target.value }))}
                  placeholder="TXN-12345..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951]" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMarkModal(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={handleMarkPaid} disabled={markLoading}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all">
                {markLoading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
