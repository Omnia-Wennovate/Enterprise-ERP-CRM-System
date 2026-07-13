'use client'

import { useState, useEffect } from 'react'
import { fetchCommissions } from '@/app/actions/finance'
import type { Commission } from '@/types/finance'

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommissions()
  }, [])

  const loadCommissions = async () => {
    try {
      setLoading(true)
      const data = await fetchCommissions()
      setCommissions(data)
    } catch (error) {
      console.error('Failed to load commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalCommission = commissions.reduce((sum, c) => sum + c.commission_amount, 0)
  const pendingCommission = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0)
  const paidCommission = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0)

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Commissions</h1>
          <p className="text-slate-600 mt-1">Sales commissions and statements</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Total Commission</p>
            <p className="text-2xl font-bold text-teal-600 mt-2">${totalCommission.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-2">
              ${pendingCommission.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ${paidCommission.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Records</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{commissions.length}</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-600">Loading...</div>
          ) : commissions.length === 0 ? (
            <div className="p-8 text-center text-slate-600">No commissions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Agent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Base Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900">{commission.agent_name || '—'}</td>
                      <td className="px-6 py-4 text-slate-600">
                        ${commission.base_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-teal-600">
                        ${commission.commission_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {commission.period_month}/{commission.period_year}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            commission.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : commission.status === 'approved'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {commission.status}
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
