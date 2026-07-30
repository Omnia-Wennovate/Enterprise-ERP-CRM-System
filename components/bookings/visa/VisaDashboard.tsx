'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle, XCircle, Search, AlertTriangle, Calendar, Award, RotateCcw, Ban, CheckCircle2, FileCheck, FolderOpen, Send, Fingerprint, Users, UserCheck, Palmtree, Briefcase, GraduationCap, Building2, ArrowRightLeft, Stethoscope, Presentation, Heart, Shield, FileQuestion
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts'
import type { VisaDashboardKPIs, VisaChartData } from '@/types/visa'

interface VisaDashboardProps {
  kpis: VisaDashboardKPIs
  chartData: VisaChartData
}

export function VisaDashboard({ kpis, chartData }: VisaDashboardProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Applications</h3>
            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
              <FileText className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{kpis.totalApplications}</p>
            <p className="text-xs text-slate-500 mt-1">All time applications</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Preparation</h3>
            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
              <FolderOpen className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{kpis.pendingApplications}</p>
            <p className="text-xs text-slate-500 mt-1">Collecting documents</p>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Under Review</h3>
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900">{kpis.underReviewApplications}</p>
            <p className="text-xs text-slate-500 mt-1">Processing at embassy</p>
          </div>
        </div>

        {/* Action Needed */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Action Needed</h3>
            <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-rose-600">{kpis.visasExpiringSoon}</p>
              <p className="text-xs text-slate-500 mt-1">Visas expiring soon</p>
            </div>
            {kpis.passportsExpiringSoon > 0 && (
              <div className="text-right">
                <p className="text-sm font-bold text-amber-600">{kpis.passportsExpiringSoon}</p>
                <p className="text-[10px] text-slate-500">Expiring passports</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Approved</p>
            <p className="text-xl font-bold text-emerald-600">{kpis.approvedApplications}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-100" />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Rejected</p>
            <p className="text-xl font-bold text-rose-600">{kpis.rejectedApplications}</p>
          </div>
          <XCircle className="w-8 h-8 text-rose-100" />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Submitted Today</p>
            <p className="text-xl font-bold text-teal-600">{kpis.submittedToday}</p>
          </div>
          <Send className="w-8 h-8 text-teal-100" />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Avg Processing</p>
            <p className="text-xl font-bold text-indigo-600">{kpis.averageProcessingDays} <span className="text-xs font-normal text-slate-400">days</span></p>
          </div>
          <Clock className="w-8 h-8 text-indigo-100" />
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-1">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} applications`, 'Count']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 col-span-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">Application Trends (Last 12 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyApplications}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dx={-10} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="approved" name="Approved" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="total" name="Total Processing" stackId="a" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
