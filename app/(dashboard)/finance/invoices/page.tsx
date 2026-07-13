'use client'

import { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { fetchInvoices, fetchInvoicesFiltered, exportInvoicesAction } from '@/app/actions/invoices'
import { InvoicesTable } from '@/components/finance/InvoicesTable'
import type { Invoice, InvoiceStatus } from '@/types/finance'

const statusOptions: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [exporting, setExporting] = useState(false)

  // Load invoices
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await fetchInvoices()
      setInvoices(data)
      applyFilters(data, selectedStatus, searchTerm)
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (data: Invoice[], status: InvoiceStatus | 'all', search: string) => {
    let filtered = data

    if (status !== 'all') {
      filtered = filtered.filter((inv) => inv.status === status)
    }

    if (search) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
          inv.customer_id.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredInvoices(filtered)
  }

  const handleStatusChange = (status: InvoiceStatus | 'all') => {
    setSelectedStatus(status)
    applyFilters(invoices, status, searchTerm)
  }

  const handleSearch = (search: string) => {
    setSearchTerm(search)
    applyFilters(invoices, selectedStatus, search)
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const csv = await exportInvoicesAction(filteredInvoices)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export invoices:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
            <p className="text-slate-600 mt-1">Create and manage customer invoices</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <Link
              href="/finance/invoices/new"
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              New Invoice
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search invoice number or customer..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === option.value
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No invoices found</div>
          ) : (
            <InvoicesTable invoices={filteredInvoices} onRefresh={loadInvoices} />
          )}
        </div>
      </div>
    </div>
  )
}
