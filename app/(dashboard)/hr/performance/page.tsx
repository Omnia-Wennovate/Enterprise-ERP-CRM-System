'use client'

import { useState } from 'react'
import { TrendingUp, BarChart3 } from 'lucide-react'

interface PerformanceReview {
  id: string
  employeeName: string
  month: string
  kpiScore: number
  targetScore: number
  achievement: number
  status: 'pending' | 'completed'
}

export default function PerformancePage() {
  const [reviews] = useState<PerformanceReview[]>([
    {
      id: '1',
      employeeName: 'John Smith',
      month: 'November 2024',
      kpiScore: 85,
      targetScore: 80,
      achievement: 106,
      status: 'completed',
    },
    {
      id: '2',
      employeeName: 'Sarah Johnson',
      month: 'November 2024',
      kpiScore: 78,
      targetScore: 80,
      achievement: 98,
      status: 'completed',
    },
    {
      id: '3',
      employeeName: 'Mike Davis',
      month: 'November 2024',
      kpiScore: 0,
      targetScore: 80,
      achievement: 0,
      status: 'pending',
    },
  ])

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Performance Reviews</h1>
          <p className="text-slate-600 mt-1">Track employee performance and KPIs</p>
        </div>

        {/* Performance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">KPI Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Achievement %</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">{review.employeeName}</td>
                    <td className="px-6 py-4 text-slate-600">{review.month}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{review.kpiScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{review.targetScore}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{review.achievement}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
