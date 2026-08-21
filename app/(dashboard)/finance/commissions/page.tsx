'use client'

import { useState, useEffect, useCallback } from 'react'
import { Award, Clock, CheckCircle, DollarSign, Search, RefreshCw, Users, Settings } from 'lucide-react'
import {
  fetchCommissions,
  fetchCommissionRules,
  approveCommissionsAction,
  markCommissionsAsPaidAction,
} from '@/app/actions/finance'
import type { Commission, CommissionRule } from '@/types/finance'
import { FinanceKPICard, FinanceKPICardSkeleton } from '@/components/finance/FinanceKPICard'
import { FinanceStatusBadge } from '@/components/finance/FinanceStatusBadge'
import { FinanceEmptyState } from '@/components/finance/FinanceEmptyState'

type FilterStatus = 'all' | 'pending' | 'approved' | 'paid'
type ViewMode = 'commissions' | 'rules'

const CURRENCY = 'ETB'
const fmt = (n: number) => `${CURRENCY} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('commissions')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [periodFilter, setPeriodFilter] = useState<{ month: number; year: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [commsData, rulesData] = await Promise.all([fetchCommissions(), fetchCommissionRules()])
      setCommissions(commsData)
      setRules(rulesData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // KPIs
  const pendingList   = commissions.filter(c => c.status === 'pending')
  const approvedList  = commissions.filter(c => c.status === 'approved')
  const paidList      = commissions.filter(c => c.status === 'paid')

  const totalCommission    = commissions.reduce((s, c) => s + c.commission_amount, 0)
  const pendingAmount      = pendingList.reduce((s, c) => s + c.commission_amount, 0)
  const approvedAmount     = approvedList.reduce((s, c) => s + c.commission_amount, 0)
  const paidAmount         = paidList.reduce((s, c) => s + c.commission_amount, 0)
  const outstandingAmount  = pendingAmount + approvedAmount

  // Available periods
  const periods = Array.from(
    new Set(commissions.map(c => `${c.period_year}-${String(c.period_month).padStart(2, '0')}`))
  ).sort().reverse().slice(0, 12)

  // Filtered list
  const filtered = commissions.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (periodFilter) {
      if (c.period_month !== periodFilter.month || c.period_year !== periodFilter.year) return false
    }
    if (search) {
      const q = search.toLowerCase()
      return (c.agent_name || '').toLowerCase().includes(q) ||
             (c.booking_reference || '').toLowerCase().includes(q)
    }
    return true
  })

  // Selection
  const allSelected = filtered.length > 0 && filtered.every(c => selected.has(c.id))
  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }
  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleBulkApprove = async () => {
    const ids = Array.from(selected).filter(id => commissions.find(c => c.id === id)?.status === 'pending')
    if (!ids.length) { alert('Select pending commissions to approve'); return }
    setBulkLoading(true)
    try {
      await approveCommissionsAction(ids)
      setSelected(new Set())
      await load()
    } catch (e) { alert(`Failed: ${e}`) }
    finally { setBulkLoading(false) }
  }

  const handleBulkPay = async () => {
    const ids = Array.from(selected).filter(id => commissions.find(c => c.id === id)?.status === 'approved')
    if (!ids.length) { alert('Select approved commissions to mark as paid'); return }
    setBulkLoading(true)
    try {
      await markCommissionsAsPaidAction(ids)
      setSelected(new Set())
      await load()
    } catch (e) { alert(`Failed: ${e}`) }
    finally { setBulkLoading(false) }
  }

  const kpiCards = [
    { title: 'Total Commission', value: fmt(totalCommission), icon: <Award size={18} />, status: 'neutral' as const, accent: true },
    { title: 'Pending Approval', value: fmt(pendingAmount), icon: <Clock size={18} />, status: pendingList.length > 0 ? 'warning' as const : 'positive' as const, subValue: `${pendingList.length} records` },
    { title: 'Approved', value: fmt(approvedAmount), icon: <CheckCircle size={18} />, status: 'neutral' as const, subValue: `${approvedList.length} records` },
    { title: 'Paid', value: fmt(paidAmount), icon: <DollarSign size={18} />, status: 'positive' as const, subValue: `${paidList.length} records` },
    { title: 'Outstanding', value: fmt(outstandingAmount), icon: <Clock size={18} />, status: outstandingAmount > 0 ? 'warning' as const : 'positive' as const, subValue: 'Pending + Approved' },
    { title: 'Records', value: String(commissions.length), icon: <Users size={18} />, status: 'neutral' as const },
  ]

  const FILTER_TABS: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: commissions.length },
    { key: 'pending',  label: 'Pending',  count: pendingList.length },
    { key: 'approved', label: 'Approved', count: approvedList.length },
    { key: 'paid',     label: 'Paid',     count: paidList.length },
  ]

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      {/* Header */}
      <div className="bg-[#0A1221] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C8A951] text-xs font-bold tracking-[0.25em] uppercase mb-1">Finance</p>
              <h1 className="text-2xl font-bold text-white">Sales Commissions</h1>
              <p className="text-slate-400 text-sm mt-1">Review, approve, and pay agent commissions</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView(v => v === 'commissions' ? 'rules' : 'commissions')}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                <Settings size={13} /> {view === 'commissions' ? 'View Rules' : 'View Commissions'}
              </button>
              <button onClick={load}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
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

        {/* Commission Rules View */}
        {view === 'rules' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-[#0A1221]">Commission Rules</h2>
              <p className="text-xs text-slate-400 mt-0.5">Active rules that govern commission calculations for each role</p>
            </div>
            {rules.length === 0 ? (
              <FinanceEmptyState title="No commission rules defined" description="Commission rules determine how much agents earn per booking." icon={<Settings size={24} strokeWidth={1.5} />} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Role', 'Type', 'Rate', 'Applies To', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => (
                      <tr key={rule.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-[#0A1221] capitalize">{rule.role.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-slate-600 capitalize">{rule.rule_type}</td>
                        <td className="px-4 py-3 font-bold font-mono text-[#C8A951]">
                          {rule.rule_type === 'percentage' ? `${rule.rate}%` : fmt(rule.rate)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 capitalize">{rule.applies_to}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Commissions List View */}
        {view === 'commissions' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Filter tabs */}
                <div className="flex gap-1">
                  {FILTER_TABS.map(t => (
                    <button key={t.key} onClick={() => setFilter(t.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all
                        ${filter === t.key ? 'bg-[#0A1221] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                      {t.label} ({t.count})
                    </button>
                  ))}
                </div>
                {/* Period filter */}
                <select
                  value={periodFilter ? `${periodFilter.year}-${String(periodFilter.month).padStart(2, '0')}` : ''}
                  onChange={e => {
                    const v = e.target.value
                    if (!v) { setPeriodFilter(null); return }
                    const [y, m] = v.split('-')
                    setPeriodFilter({ year: parseInt(y), month: parseInt(m) })
                  }}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-[#C8A951]"
                >
                  <option value="">All periods</option>
                  {periods.map(p => {
                    const [y, m] = p.split('-')
                    const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
                    return <option key={p} value={p}>{label}</option>
                  })}
                </select>
              </div>
              <div className="flex items-center gap-2">
                {/* Bulk actions */}
                {selected.size > 0 && (
                  <div className="flex gap-2">
                    <button onClick={handleBulkApprove} disabled={bulkLoading}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all">
                      Approve ({selected.size})
                    </button>
                    <button onClick={handleBulkPay} disabled={bulkLoading}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all">
                      Mark Paid ({selected.size})
                    </button>
                  </div>
                )}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search agent, booking..."
                    className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg w-52 focus:outline-none focus:border-[#C8A951] bg-slate-50" />
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Loading...</div>
            ) : filtered.length === 0 ? (
              <FinanceEmptyState
                title="No commissions found"
                description="Commission records are created when bookings are completed and the commission calculation runs."
                icon={<Award size={24} strokeWidth={1.5} />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-3 w-8">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
                      </th>
                      {['Agent', 'Booking', 'Base Amount', 'Commission', 'Period', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${selected.has(c.id) ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="rounded" />
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#0A1221]">{c.agent_name || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono">{c.booking_reference || c.booking_id?.slice(0, 8) || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">{fmt(c.base_amount)}</td>
                        <td className="px-4 py-3 font-bold font-mono text-[#C8A951]">{fmt(c.commission_amount)}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(c.period_year, c.period_month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <FinanceStatusBadge status={c.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
