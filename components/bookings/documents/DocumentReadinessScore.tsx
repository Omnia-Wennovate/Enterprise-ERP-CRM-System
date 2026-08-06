'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react'
import type { BookingReadinessResult, ReadinessCategoryStatus } from '@/types/documents'

export function DocumentReadinessScore({ result }: { result: BookingReadinessResult }) {
  const data = [
    { name: 'Approved', value: result.totalApproved, color: '#10b981' },
    { name: 'Missing', value: result.totalRequired - result.totalApproved, color: '#f1f5f9' },
  ]

  const isComplete = result.score === 100

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Travel Readiness Score</h3>
          <p className="text-sm text-muted-foreground">Document completion for this booking</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
          isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        }`}>
          {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {isComplete ? 'Ready for Travel' : 'Action Required'}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={45}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold text-foreground">{result.score}%</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {result.categoryBreakdown.map(cat => (
            <CategoryStatusItem key={cat.documentType} item={cat} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CategoryStatusItem({ item }: { item: ReadinessCategoryStatus }) {
  const getIcon = () => {
    switch (item.status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-rose-500" />
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />
      default: return <AlertTriangle className="w-4 h-4 text-slate-300" />
    }
  }

  const Clock = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

  return (
    <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-muted/50">
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium text-slate-700">{item.label}</span>
      </div>
      {item.status === 'approved' && item.expirationSeverity && (
        <span className={`w-2 h-2 rounded-full ${
          item.expirationSeverity === 'expired' || item.expirationSeverity === 'critical' ? 'bg-red-500' :
          item.expirationSeverity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} title={item.expirationSeverity} />
      )}
    </div>
  )
}
