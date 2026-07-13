'use client'

import { useState, useEffect } from 'react'
import { fetchSupplierPayments, fetchOverdueSupplierPayments } from '@/app/actions/finance'
import type { SupplierPayment } from '@/types/finance'

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([])
  const [overdue, setOverdue] = useState<SupplierPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const [paymentsData, overdueData] = await Promise.all([
        fetchSupplierPayments(),
        fetchOverdueSupplierPayments(),
      ])
      setPayments(paymentsData)
      setOverdue(overdueData)
    } catch (error) {
      console.error('Failed to load supplier payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const pendingTotal = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
  const paidTotal = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Supplier Payments</h1>
          <p className="text-slate-600 mt-1">Manage payments to suppliers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Payments</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{payments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">
              ${pendingTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">${paidTotal.toFixed(2)}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
            <p className="text-red-700 text-sm font-medium">Overdue</p>
            <p className="text-2xl font-bold text-red-700 mt-2">{overdue.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No supplier payments</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{payment.supplier_name || '—'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            payment.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {payment.due_date
                          ? new Date(payment.due_date).toLocaleDateString()
                          : '—'}
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
