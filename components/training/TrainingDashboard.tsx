'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen, Users, Award, Clock, AlertTriangle, Calendar,
  TrendingUp, Target, Shield, BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts'
import type { TrainingKPIs } from '@/types/hr'

interface TrainingDashboardProps {
  onViewCourses: () => void
}

const COLORS = ['#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899']

export function TrainingDashboard({ onViewCourses }: TrainingDashboardProps) {
  const [kpis, setKpis] = useState<TrainingKPIs | null>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [{ getTrainingKPIs }, { getMonthlyCompletions, getDepartmentParticipation }] = await Promise.all([
        import('@/lib/services/training'),
        import('@/lib/services/training'),
      ])

      const [kpiData, monthly, dept] = await Promise.all([
        getTrainingKPIs(),
        getMonthlyCompletions(),
        getDepartmentParticipation(),
      ])

      setKpis(kpiData)
      setMonthlyData(monthly)
      setDeptData(dept)
    } catch (err) {
      console.error('Failed to load training dashboard:', err)
      // Set empty KPIs so the UI renders
      setKpis({
        totalCourses: 0, activeCourses: 0, totalEnrollments: 0,
        completionRate: 0, certificatesIssued: 0, overdueTraining: 0,
        upcomingSessions: 0, avgAssessmentScore: 0, expiringCerts: 0,
        nonCompliantEmployees: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total Courses', value: kpis.totalCourses, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Active Courses', value: kpis.activeCourses, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Enrolled', value: kpis.totalEnrollments, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completion Rate', value: `${kpis.completionRate}%`, icon: Target, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Certificates', value: kpis.certificatesIssued, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: kpis.overdueTraining, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Upcoming Sessions', value: kpis.upcomingSessions, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Avg Score', value: `${kpis.avgAssessmentScore}%`, icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Expiring Certs', value: kpis.expiringCerts, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Non-Compliant', value: kpis.nonCompliantEmployees, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={onViewCourses}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Completions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200/80 p-6"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4">Monthly Completions</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Area type="monotone" dataKey="completions" stroke="#0d9488" fill="url(#colorCompletions)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">
              No completion data yet
            </div>
          )}
        </motion.div>

        {/* Department Participation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-slate-200/80 p-6"
        >
          <h3 className="text-sm font-bold text-slate-800 mb-4">Department Participation</h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="enrolled" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Enrolled" />
                <Bar dataKey="completed" fill="#0d9488" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">
              No department data yet
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
