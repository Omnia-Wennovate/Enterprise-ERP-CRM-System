'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, CheckCircle, XCircle, Search, AlertTriangle, Calendar, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { DocumentDashboardKPIs, DocumentChartData } from '@/types/documents'

export function DocumentsDashboard({ kpis, chartData }: { kpis: DocumentDashboardKPIs, chartData: DocumentChartData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Documents" value={kpis.totalDocuments} subtitle="All time" icon={FileText} color="bg-blue-50 text-blue-600" />
        <KPICard title="Pending Review" value={kpis.pendingDocuments} subtitle="Needs attention" icon={Clock} color="bg-amber-50 text-amber-600" />
        <KPICard title="Approved" value={kpis.approvedDocuments} subtitle="Ready for travel" icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <KPICard title="Expiring Soon" value={kpis.expiringSoon} subtitle="Within 30 days" icon={AlertTriangle} color="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Expiration Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.expirationTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="expiring" name="Expiring" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expired" name="Expired" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
          <h3 className="font-semibold text-foreground mb-4">Documents by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.byCategory} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {chartData.byCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
             {chartData.byCategory.map(c => (
               <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                 <span className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></span>
                 {c.name.replace('_', ' ')}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function KPICard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm hover:border-border transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  )
}
