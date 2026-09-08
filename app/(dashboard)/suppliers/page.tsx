'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Tag,
  Trash2,
  X,
  CreditCard,
  Building,
} from 'lucide-react'
import Link from 'next/link'
import {
  fetchSuppliersAction,
  createSupplierAction,
  deleteSupplierAction,
} from '@/app/actions/finance'
import type { Supplier } from '@/types/finance'

export default function SuppliersDatabasePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSuppliersAction()
      setSuppliers(data)
    } catch (err) {
      console.error('Failed to load suppliers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  const categories = Array.from(
    new Set(
      suppliers
        .map(s => s.category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  )

  const filtered = suppliers.filter(s => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || s.category?.toLowerCase() === categoryFilter.toLowerCase()

    return matchesSearch && matchesCategory
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError('Supplier name is required')
      return
    }

    setSaving(true)
    setFormError(null)

    try {
      const newSup = await createSupplierAction({
        name: name.trim(),
        category: category.trim() || undefined,
        contact_person: contactPerson.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })

      setSuppliers(prev => [newSup, ...prev])
      setShowAddModal(false)
      setName('')
      setCategory('')
      setContactPerson('')
      setEmail('')
      setPhone('')
      setAddress('')
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save supplier')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, supplierName: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${supplierName}"?`)) return
    setDeletingId(id)
    try {
      await deleteSupplierAction(id)
      setSuppliers(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(`Could not delete supplier: ${err instanceof Error ? err.message : err}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F0] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <span>Operations & Finance</span>
              <span>/</span>
              <span className="text-[#C8A951]">Supplier Database</span>
            </div>
            <h1 className="text-2xl font-black text-[#0A1221] flex items-center gap-2">
              <Building className="text-[#C8A951]" size={28} />
              Suppliers Directory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage airlines, hotels, transport providers, and vendors used across Bookings and Finance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/bookings/supplier-payments"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <CreditCard size={14} className="text-[#C8A951]" />
              Supplier Payments
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#0A1221] text-white rounded-xl hover:bg-[#0A1221]/90 transition-all shadow-sm"
            >
              <Plus size={14} className="text-[#C8A951]" />
              Add New Supplier
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Suppliers</p>
              <p className="text-2xl font-black text-[#0A1221] mt-1">{suppliers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#C8A951]">
              <Building2 size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</p>
              <p className="text-2xl font-black text-[#0A1221] mt-1">{categories.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Tag size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Status</p>
              <p className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to Supabase
              </p>
            </div>
            <button
              onClick={loadSuppliers}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all"
              title="Refresh suppliers"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, contact, email, category..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-[#0A1221] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      categoryFilter.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#0A1221] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400">
              <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-[#C8A951]" />
              <p className="text-xs font-semibold">Loading suppliers database...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 size={40} className="mx-auto text-slate-200 mb-3" strokeWidth={1.5} />
              <p className="text-base font-bold text-slate-700">
                {suppliers.length === 0 ? 'No suppliers in the database yet' : 'No suppliers match your search'}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-5 max-w-sm mx-auto">
                {suppliers.length === 0
                  ? 'Add your first supplier (airline, hotel, transfer service, or guide) to start managing payments.'
                  : 'Try adjusting your search keywords or category filters.'}
              </p>
              {suppliers.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#C8A951] text-[#0A1221] rounded-xl hover:bg-[#C8A951]/90 transition-all shadow-sm"
                >
                  <Plus size={14} /> Add First Supplier
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Supplier Name
                    </th>
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Category
                    </th>
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Contact Person
                    </th>
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Contact Details
                    </th>
                    <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Address
                    </th>
                    <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#0A1221]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C8A951] flex items-center justify-center font-black text-xs border border-amber-100 flex-shrink-0">
                            {(s.name || 'S').slice(0, 2).toUpperCase()}
                          </div>
                          <span>{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {s.category ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {s.category}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-700 font-medium">
                        {s.contact_person || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {s.email && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Mail size={11} className="text-slate-400" />
                              <a href={`mailto:${s.email}`} className="hover:text-[#C8A951] underline-offset-2 hover:underline">
                                {s.email}
                              </a>
                            </div>
                          )}
                          {s.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone size={11} className="text-slate-400" />
                              <a href={`tel:${s.phone}`} className="hover:text-[#C8A951]">
                                {s.phone}
                              </a>
                            </div>
                          )}
                          {!s.email && !s.phone && <span className="text-slate-300">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {s.address ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={11} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[200px]" title={s.address}>{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/bookings/supplier-payments`}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-[#0A1221] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Request Payment"
                          >
                            Pay
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            disabled={deletingId === s.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Supplier"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0A1221]">Add New Supplier</h3>
                <p className="text-xs text-slate-400 mt-0.5">Save vendor details for payments and operations</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supplier / Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Ethiopian Airlines, Sheraton Addis"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g., Airline, Hotel, Guide"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Contact Person
                  </label>
                  <input
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="sales@supplier.com"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+251 91 123 4567"
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Office Address
                </label>
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g., Bole Road, Addis Ababa"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#C8A951] bg-slate-50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 px-4 py-2.5 text-xs font-bold bg-[#0A1221] text-white rounded-xl hover:bg-[#0A1221]/90 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
