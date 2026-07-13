'use client'

import { useState, useEffect } from 'react'
import { fetchRefunds } from '@/app/actions/finance'
import type { Refund } from '@/types/finance'

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRefunds()
  }, [])

  const loadRefunds = async () => {
    try {
      setLoading(true)
      const data = await fetchRefunds()
      setRefunds(data)
    } catch (error) {
      console.error('Failed to load refunds:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalRefundAmount = refunds.reduce((sum, r) => sum + r.amount, 0)
  const pendingRefunds = refunds.filter((r) => r.status === 'pending')
  const approvedRefunds = refunds.filter((r) => r.status === 'approved')
  const paidRefunds = refunds.filter((r) => r.status === 'completed')

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Refunds & Cancellations</h1>
          <p className="text-slate-600 mt-1">Manage refunds and booking cancellations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Refunds</p>
            <p className="text-2xl font-bold text-red-600 mt-2">${totalRefundAmount.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">{pendingRefunds.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Approved</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{approvedRefunds.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{paidRefunds.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : refunds.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No refunds</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Booking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Refund Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{refund.booking_id.slice(0, 8)}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {refund.customer_name || '—'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-red-600">
                        ${refund.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{refund.reason}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            refund.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : refund.status === 'approved'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {refund.status}
                        </span>
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
