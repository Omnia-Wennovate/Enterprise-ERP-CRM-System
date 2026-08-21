'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, DollarSign, Search, Minus } from 'lucide-react'
import {
  fetchRefunds,
  updateRefundStatusAction,
  markRefundsPaidAction,
} from '@/app/actions/finance'
import type { Refund, RefundStatus } from '@/types/finance'
import { FinanceKPICard, FinanceKPICardSkeleton } from '@/components/finance/FinanceKPICard'
import { FinanceStatusBadge } from '@/components/finance/FinanceStatusBadge'
import { FinanceEmptyState } from '@/components/finance/FinanceEmptyState'

type FilterStatus = 'all' | 'pending' | 'approved' | 'paid' | 'rejected'

const CURRENCY = 'ETB'
const fmt = (n: number) => `${CURRENCY} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchRefunds()
      setRefunds(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // KPIs — using correct field names from Refund interface
  const pendingList   = refunds.filter(r => r.status === 'pending')
  const approvedList  = refunds.filter(r => r.status === 'approved')
  const paidList      = refunds.filter(r => r.status === 'paid')
  const rejectedList  = refunds.filter(r => r.status === 'rejected')

  // Use refund_amount (the correct field) — fall back to 0 if undefined
  const totalRefundAmount   = refunds.reduce((s, r) => s + (r.refund_amount ?? 0), 0)
  const totalPenalties      = refunds.reduce((s, r) => s + (r.supplier_penalty ?? 0), 0)
  const totalNetRefund      = refunds.reduce((s, r) => s + (r.net_refund ?? r.refund_amount ?? 0), 0)
  const pendingAmount       = pendingList.reduce((s, r) => s + (r.refund_amount ?? 0), 0)

  // Filtered list
  const filtered = refunds.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (r.customer_name || '').toLowerCase().includes(q) ||
             (r.cancellation_reason || '').toLowerCase().includes(q)
    }
    return true
  })

  // Selection
  const allSelected = filtered.length > 0 && filtered.every(r => selected.has(r.id))
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map(r => r.id)))

  const handleBulkPay = async () => {
    const ids = Array.from(selected).filter(id => refunds.find(r => r.id === id)?.status === 'approved')
    if (!ids.length) { alert('Select approved refunds to mark as paid'); return }
    setBulkLoading(true)
    try {
      await markRefundsPaidAction(ids)
      setSelected(new Set())
      await load()
    } catch (e) { alert(`Failed: ${e}`) }
    finally { setBulkLoading(false) }
  }

  const handleApprove = async (id: string) => {
    try {
      await updateRefundStatusAction(id, 'approved' as RefundStatus)
      await load()
    } catch (e) { alert(`Failed: ${e}`) }
  }

  const kpiCards = [
    { title: 'Total Refund Amount', value: fmt(totalRefundAmount), icon: <RefreshCw size={18} />, status: 'negative' as const, accent: true, subValue: `${refunds.length} total records` },
    { title: 'Pending', value: fmt(pendingAmount), icon: <Clock size={18} />, status: pendingList.length > 0 ? 'warning' as const : 'positive' as const, subValue: `${pendingList.length} awaiting review` },
    { title: 'Approved', value: String(approvedList.length), icon: <CheckCircle size={18} />, status: 'neutral' as const, subValue: 'Ready for payment' },
    { title: 'Paid', value: String(paidList.length), icon: <DollarSign size={18} />, status: 'positive' as const, subValue: 'Completed' },
    { title: 'Supplier Penalties', value: fmt(totalPenalties), icon: <AlertTriangle size={18} />, status: 'warning' as const, subValue: 'Total withheld' },
    { title: 'Net Refunded', value: fmt(totalNetRefund), icon: <Minus size={18} />, status: 'neutral' as const, subValue: 'After penalties' },
  ]

  const FILTER_TABS: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: refunds.length },
    { key: 'pending',  label: 'Pending',  count: pendingList.length },
    { key: 'approved', label: 'Approved', count: approvedList.length },
    { key: 'paid',     label: 'Paid',     count: paidList.length },
    { key: 'rejected', label: 'Rejected', count: rejectedList.length },
  ]

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#0A1221] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C8A951] text-xs font-bold tracking-[0.25em] uppercase mb-1">Finance</p>
              <h1 className="text-2xl font-bold text-white">Refunds & Cancellations</h1>
              <p className="text-slate-400 text-sm mt-1">Process and track booking refunds</p>
            </div>
            <button onClick={load}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex flex-wrap gap-1">
              {FILTER_TABS.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                    ${filter === t.key ? 'bg-[#0A1221] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.label} ({t.count})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <button onClick={handleBulkPay} disabled={bulkLoading}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all">
                  Mark Paid ({selected.size})
                </button>
              )}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search customer, reason..."
                  className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:border-[#C8A951] bg-slate-50" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Loading...</div>
          ) : filtered.length === 0 ? (
            <FinanceEmptyState
              title="No refunds found"
              description="Refund records are created from approved cancellation requests."
              icon={<RefreshCw size={24} strokeWidth={1.5} />}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                    </th>
                    {['Customer', 'Refund Amount', 'Supplier Penalty', 'Net Refund', 'Reason', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(r.id) ? 'bg-emerald-50/20' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="rounded" />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0A1221]">{r.customer_name || '—'}</td>
                      <td className="px-4 py-3 font-bold font-mono text-red-600">{fmt(r.refund_amount ?? 0)}</td>
                      <td className="px-4 py-3 font-mono text-amber-600">{fmt(r.supplier_penalty ?? 0)}</td>
                      <td className="px-4 py-3 font-bold font-mono text-slate-700">{fmt(r.net_refund ?? r.refund_amount ?? 0)}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate" title={r.cancellation_reason}>
                        {r.cancellation_reason || r.notes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <FinanceStatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        {r.status === 'pending' && (
                          <button onClick={() => handleApprove(r.id)}
                            className="px-3 py-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all">
                            Approve
                          </button>
                        )}
                        {r.status === 'approved' && (
                          <button onClick={() => markRefundsPaidAction([r.id]).then(load)}
                            className="px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all">
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
