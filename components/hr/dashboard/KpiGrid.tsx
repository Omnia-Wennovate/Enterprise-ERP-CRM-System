'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Users, UserPlus, UserMinus, Clock, Calendar, CheckCircle, XCircle, FileText, Gift, Award, Briefcase, CalendarCheck, FileCheck, Percent, Target, AlertTriangle, Monitor, Battery } from 'lucide-react'

interface KpiData {
  title: string
  value: string | number
  trend: number
  trendLabel?: string
  icon: any
  colorClass: string
}

const sparklineData = [10, 20, 15, 25, 20, 30, 35]

function Sparkline({ color, isPositive }: { color: string, isPositive: boolean }) {
  const strokeColor = isPositive ? '#10B981' : '#EF4444' // emerald-500 or red-500
  return (
    <svg width="60" height="20" className="opacity-50" viewBox="0 0 60 20">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,15 10,10 20,12 30,5 40,8 50,2 60,5"
      />
    </svg>
  )
}

function KpiCard({ data, index }: { data: KpiData, index: number }) {
  const Icon = data.icon
  const isPositive = data.trend >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${data.colorClass} opacity-5 rounded-bl-full`}></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${data.colorClass} text-white shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <Sparkline color={data.colorClass} isPositive={isPositive} />
      </div>
      
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground mb-1">{data.title}</p>
        <div className="flex items-end gap-2">
          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
            {data.value}
          </h3>
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 relative z-10">
        <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(data.trend)}%
        </span>
        <span className="text-xs text-muted-foreground">{data.trendLabel || 'vs last month'}</span>
      </div>
    </motion.div>
  )
}

export function KpiGrid({ stats }: { stats: any }) {
  // Map our stats into 20+ KPIs
  const kpis: KpiData[] = [
    { title: 'Total Employees', value: stats.totalEmployees, trend: 4.2, icon: Users, colorClass: 'from-blue-500 to-blue-700' },
    { title: 'Active Employees', value: stats.activeEmployees, trend: 3.8, icon: CheckCircle, colorClass: 'from-emerald-500 to-emerald-700' },
    { title: 'Inactive Employees', value: stats.inactiveEmployees, trend: -1.2, icon: XCircle, colorClass: 'from-slate-500 to-slate-700' },
    { title: 'New Hires', value: 3, trend: 15.0, icon: UserPlus, colorClass: 'from-indigo-500 to-indigo-700' },
    { title: 'Turnover Rate', value: '2.1%', trend: -0.5, trendLabel: 'vs last quarter', icon: UserMinus, colorClass: 'from-red-500 to-red-700' },
    { title: 'Attendance Rate', value: `${stats.attendanceRate}%`, trend: 1.2, icon: Target, colorClass: 'from-teal-500 to-teal-700' },
    { title: 'Late Today', value: stats.lateEmployees, trend: -5.0, trendLabel: 'vs avg', icon: Clock, colorClass: 'from-yellow-500 to-yellow-700' },
    { title: 'Absent Today', value: stats.absentToday, trend: -2.0, trendLabel: 'vs avg', icon: AlertTriangle, colorClass: 'from-orange-500 to-orange-700' },
    { title: 'On Leave', value: stats.onLeave, trend: 0, trendLabel: 'vs avg', icon: Calendar, colorClass: 'from-purple-500 to-purple-700' },
    { title: 'Pending Leaves', value: stats.pendingLeaves, trend: 12.0, icon: FileCheck, colorClass: 'from-pink-500 to-pink-700' },
    { title: 'Avg Work Hours', value: '38.5', trend: 1.5, icon: Clock, colorClass: 'from-cyan-500 to-cyan-700' },
    { title: 'Birthdays Today', value: 2, trend: 0, trendLabel: 'this week', icon: Gift, colorClass: 'from-fuchsia-500 to-fuchsia-700' },
    { title: 'Anniversaries', value: 1, trend: 0, trendLabel: 'this week', icon: Award, colorClass: 'from-amber-500 to-amber-700' },
    { title: 'Monthly Payroll', value: `$${stats.payrollTotal.toLocaleString()}`, trend: 2.4, icon: FileText, colorClass: 'from-green-500 to-green-700' },
    { title: 'Avg Salary', value: '$65k', trend: 4.1, trendLabel: 'vs last year', icon: Percent, colorClass: 'from-blue-600 to-blue-800' },
    { title: 'Overtime Hours', value: 142, trend: -12.5, icon: Clock, colorClass: 'from-rose-500 to-rose-700' },
    { title: 'Open Positions', value: 5, trend: 20.0, icon: Briefcase, colorClass: 'from-violet-500 to-violet-700' },
    { title: 'Upcoming Holidays', value: 1, trend: 0, trendLabel: 'next 30 days', icon: CalendarCheck, colorClass: 'from-sky-500 to-sky-700' },
    { title: 'Assets Assigned', value: 124, trend: 3.5, icon: Monitor, colorClass: 'from-stone-500 to-stone-700' },
    { title: 'Avg Performance', value: '88%', trend: 2.1, trendLabel: 'vs last review', icon: Target, colorClass: 'from-emerald-400 to-emerald-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
      {kpis.map((kpi, idx) => (
        <KpiCard key={idx} data={kpi} index={idx} />
      ))}
    </div>
  )
}
