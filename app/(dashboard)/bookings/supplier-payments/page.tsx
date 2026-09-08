'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2, Plus, RefreshCw, Search, Clock, CheckCircle, AlertTriangle, X
} from 'lucide-react'
import {
  fetchMySupplierPaymentsAction,
  fetchSuppliersAction,
  createSupplierPaymentAction,
  createSupplierAction,
} from '@/app/actions/finance'
import type { SupplierPayment, Supplier, CreateSupplierPaymentFormData } from '@/types/finance'
import Link from 'next/link'

const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'AED', 'SAR']

function statusLabel(status: string): string {
  switch (status) {
    case 'pending':  return 'Pending Finance'
    case 'paid':     return 'Paid'
    case 'overdue':  return 'Overdue'
    default:         return status
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    paid:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold border rounded-full ${map[status] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {status === 'pending'  && <Clock size={9} />}
      {status === 'paid'     && <CheckCircle size={9} />}
      {status === 'overdue'  && <AlertTriangle size={9} />}
      {statusLabel(status)}
    </span>
  )
}

function fmt(n: number) {
  return `ETB ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

interface AddModalProps {
  suppliers: Supplier[]
  onClose: () => void
  onSuccess: () => void
  onSupplierCreated?: (supplier: Supplier) => void
}

function AddPaymentModal({ suppliers, onClose, onSuccess, onSupplierCreated }: AddModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<Partial<CreateSupplierPaymentFormData>>({ currency: 'ETB' })
  const [supplierSearch, setSupplierSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)

  // Quick add supplier inline state
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierCat, setNewSupplierCat] = useState('')
  const [addingSupplier, setAddingSupplier] = useState(false)

  const handleQuickAddSupplier = async () => {
    if (!newSupplierName.trim()) return
    setAddingSupplier(true)
    setError(null)
    try {
      const created = await createSupplierAction({
        name: newSupplierName.trim(),
        category: newSupplierCat.trim() || undefined,
      })
      if (onSupplierCreated) onSupplierCreated(created)
      setForm(f => ({ ...f, supplier_id: created.id }))
      setShowAddSupplier(false)
      setNewSupplierName('')
      setNewSupplierCat('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add supplier')
    } finally {
      setAddingSupplier(false)
    }
  }

  const filteredSuppliers = suppliers.filter(s =>
    (s.name || '').toLowerCase().includes(supplierSearch.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(supplierSearch.toLowerCase())
  )

  const selectedSupplier = suppliers.find(s => s.id === form.supplier_id)

  const handleSubmit = async () => {
    setAttempted(true)
    if (!form.supplier_id) {
      setError('Please select a supplier from the list.')
      return
    }
    if (!form.amount || form.amount <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createSupplierPaymentAction({
        supplier_id:      form.supplier_id!,
        supplier_name:    selectedSupplier?.name || '',
        amount:           Number(form.amount),
        currency:         form.currency || 'ETB',
        due_date:         form.due_date || undefined,
        reference_number: form.reference_number || undefined,
        booking_id:       form.booking_id || undefined,
        description:      form.description || undefined,
      })
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit payment request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#0A1221]">Add Supplier Payment</h3>
            <p className="text-xs text-slate-400 mt-0.5">Request will go to Finance for processing</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-all">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Supplier Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Supplier <span className="text-red-500">*</span>
              </label>
              {!selectedSupplier && (
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(s => !s)}
                  className="text-xs font-medium text-[#C8A951] hover:text-[#b89840] flex items-center gap-1 transition-colors"
                >
                  <Plus size={12} /> {showAddSupplier ? 'Search Existing List' : 'Add New Supplier'}
                </button>
              )}
            </div>

            {showAddSupplier ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <p className="text-xs font-semibold text-[#0A1221]">Quick Add New Supplier</p>
                <input
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  placeholder="Supplier Name (e.g., Ethiopian Airlines, Hilton Addis)..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#C8A951] bg-white"
                />
                <input
                  value={newSupplierCat}
                  onChange={e => setNewSupplierCat(e.target.value)}
                  placeholder="Category (e.g. Airline, Hotel, Transport - optional)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#C8A951] bg-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleQuickAddSupplier}
                    disabled={!newSupplierName.trim() || addingSupplier}
                    className="flex-1 px-3 py-1.5 text-xs font-bold bg-[#0A1221] text-white rounded-lg hover:bg-[#0A1221]/90 disabled:opacity-50 transition-all"
                  >
                    {addingSupplier ? 'Saving...' : 'Save & Select Supplier'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplier(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg bg-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selectedSupplier ? (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-[#0A1221]">{selectedSupplier.name}</p>
                  {selectedSupplier.category && <p className="text-xs text-slate-500">{selectedSupplier.category}</p>}
                </div>
                <button onClick={() => { setForm(f => ({ ...f, supplier_id: undefined })); setSupplierSearch('') }}
                  className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline">Change</button>
              </div>
            ) : (
              <div>
                <div className="relative mb-2">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={supplierSearch}
                    onChange={e => setSupplierSearch(e.target.value)}
                    placeholder="Search or select supplier..."
                    className={`w-full pl-8 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none bg-slate-50 ${
                      attempted && !form.supplier_id ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-[#C8A951]'
                    }`}
                  />
                </div>
                {suppliers.length === 0 ? (
                  <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2">No suppliers registered in database yet.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplier(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#C8A951] text-[#0A1221] rounded-lg hover:bg-[#C8A951]/90 transition-all shadow-sm"
                    >
                      <Plus size={12} /> Add Supplier Now
                    </button>
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="text-center py-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-400 mb-1.5">No suppliers match &ldquo;{supplierSearch}&rdquo;</p>
                    <button
                      type="button"
                      onClick={() => { setNewSupplierName(supplierSearch); setShowAddSupplier(true) }}
                      className="text-xs font-bold text-[#C8A951] hover:underline"
                    >
                      + Add &ldquo;{supplierSearch}&rdquo; as new supplier
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-100 shadow-inner">
                    {filteredSuppliers.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, supplier_id: s.id }))
                          setError(null)
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50/60 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-[#0A1221]">{s.name}</span>
                        {s.category && <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{s.category}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {attempted && !form.supplier_id && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">Please select a supplier from the list above.</p>
                )}
              </div>
            )}
          </div>

          {/* Amount & Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Amount <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount ?? ''}
                onChange={e => {
                  setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                  setError(null)
                }}
                placeholder="0.00"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none ${
                  attempted && (!form.amount || form.amount <= 0)
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-200 focus:border-[#C8A951]'
                }`}
              />
              {attempted && (!form.amount || form.amount <= 0) && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">Please enter an amount greater than 0.</p>
              )}
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Currency</label>
              <select value={form.currency ?? 'ETB'} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8A951] bg-white">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Due Date</label>
            <input type="date" value={form.due_date ?? ''} min={today} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951]" />
          </div>

          {/* Reference / PO */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reference / PO Number</label>
            <input type="text" value={form.reference_number ?? ''} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
              placeholder="e.g. PO-2026-001" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951]" />
          </div>

          {/* Related Booking ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Related Booking ID <span className="font-normal text-slate-400">(optional)</span></label>
            <input type="text" value={form.booking_id ?? ''} onChange={e => setForm(f => ({ ...f, booking_id: e.target.value || undefined }))}
              placeholder="Leave blank if not related to a booking" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951]" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description / Purpose</label>
            <textarea value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What is this payment for?" rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8A951] resize-none" />
          </div>
        </div>

        {/* Sticky Footer with Error Display */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl space-y-3">
          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              <AlertTriangle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 bg-white rounded-xl hover:bg-slate-100 transition-all text-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#0A1221] text-white rounded-xl hover:bg-[#0A1221]/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <RefreshCw size={14} className="animate-spin text-[#C8A951]" />}
              {loading ? 'Submitting to Finance...' : 'Submit to Finance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OpsSupplierPaymentsPage() {
  const [payments, setPayments]   = useState<SupplierPayment[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pays, supps] = await Promise.all([
        fetchMySupplierPaymentsAction(),
        fetchSuppliersAction(),
      ])
      setPayments(pays)
      setSuppliers(supps)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = payments.filter(p => {
    const isOverdue = p.status === 'pending' && p.due_date && p.due_date < today
    if (filter === 'overdue') return isOverdue
    if (filter !== 'all' && p.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (p.supplier_name || '').toLowerCase().includes(q) || (p.reference_number || '').toLowerCase().includes(q)
    }
    return true
  })

  const pending = payments.filter(p => p.status === 'pending')
  const paid    = payments.filter(p => p.status === 'paid')
  const overdue = payments.filter(p => p.status === 'pending' && p.due_date && p.due_date < today)

  const TABS = [
    { key: 'all' as const,     label: `All (${payments.length})` },
    { key: 'pending' as const, label: `Pending Finance (${pending.length})` },
    { key: 'paid' as const,    label: `Paid (${paid.length})` },
    { key: 'overdue' as const, label: `Overdue (${overdue.length})` },
  ]

  return (
    <div className="min-h-screen bg-[#F8F6F0]">
      <div className="bg-[#0A1221] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#C8A951] text-xs font-bold tracking-[0.25em] uppercase mb-1">Operations</p>
              <h1 className="text-2xl font-bold text-white">Supplier Payments</h1>
              <p className="text-slate-400 text-sm mt-1">Submit and track supplier payment requests</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={load} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white/5 text-slate-300 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                <RefreshCw size={13} /> Refresh
              </button>
              <button id="add-supplier-payment-btn" onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#C8A951] text-[#0A1221] rounded-lg hover:bg-[#C8A951]/90 transition-all shadow-sm">
                <Plus size={13} /> Add Supplier Payment
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Requests', value: payments.length, icon: <Building2 size={16} />, color: 'text-slate-600' },
            { label: 'Pending Finance', value: pending.length, icon: <Clock size={16} />, color: 'text-amber-600' },
            { label: 'Paid', value: paid.length, icon: <CheckCircle size={16} />, color: 'text-emerald-600' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-3">
              <span className={k.color}>{k.icon}</span>
              <div>
                <p className="text-xl font-bold text-[#0A1221]">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
            <div className="flex gap-1 flex-wrap">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${filter === t.key ? 'bg-[#0A1221] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search supplier, reference..."
                className="pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:border-[#C8A951] bg-slate-50" />
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 size={32} className="mx-auto text-slate-200 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-slate-500">{payments.length === 0 ? 'No supplier payment requests yet' : 'No records match your filter'}</p>
              {payments.length === 0 && (
                <>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Use the button above to submit your first request to Finance.</p>
                  <button onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#C8A951] text-[#0A1221] rounded-lg hover:bg-[#C8A951]/90 transition-all">
                    <Plus size={12} /> Add Supplier Payment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Supplier', 'Amount', 'Status', 'Due Date', 'Reference', 'Submitted'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const isOverdue = p.status === 'pending' && p.due_date && p.due_date < today
                    return (
                      <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50/70 transition-colors ${isOverdue ? 'bg-red-50/20' : ''}`}>
                        <td className="px-4 py-3 font-semibold text-[#0A1221]">{p.supplier_name || '—'}</td>
                        <td className="px-4 py-3 font-bold font-mono text-[#0A1221]">{fmt(p.amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={isOverdue ? 'overdue' : p.status} /></td>
                        <td className={`px-4 py-3 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {p.due_date ? new Date(p.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{p.reference_number || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-4">
          Payments submitted here go directly to Finance for processing. Status updates appear here automatically.
        </p>
      </div>
      {showAdd && (
        <AddPaymentModal
          suppliers={suppliers}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); load() }}
          onSupplierCreated={(newSup) => setSuppliers(prev => [newSup, ...prev])}
        />
      )}
    </div>
  )
}
