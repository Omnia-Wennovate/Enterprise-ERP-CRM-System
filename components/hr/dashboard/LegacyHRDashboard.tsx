'use client'

import { Users, Clock, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface LegacyHRDashboardProps {
  stats: {
    totalEmployees: number
    activeEmployees: number
    onLeave: number
    pendingLeaves: number
    payrollTotal: number
    absentToday: number
  }
}

export function LegacyHRDashboard({ stats }: LegacyHRDashboardProps) {
  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-50 dark:bg-blue-950/30',
      href: '/hr/employees',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: TrendingUp,
      color: 'bg-green-50 dark:bg-green-950/30',
      href: '/hr/employees',
    },
    {
      title: 'On Leave Today',
      value: stats.onLeave,
      icon: Calendar,
      color: 'bg-yellow-50 dark:bg-yellow-950/30',
      href: '/hr/leave',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingLeaves,
      icon: AlertCircle,
      color: 'bg-red-50 dark:bg-red-950/30',
      href: '/hr/leave',
    },
    {
      title: 'This Month Payroll',
      value: `$${stats.payrollTotal.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-50 dark:bg-purple-950/30',
      href: '/hr/payroll',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: Clock,
      color: 'bg-orange-50 dark:bg-orange-950/30',
      href: '/hr/attendance',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">HR Overview</h1>
        <p className="text-muted-foreground mt-1">Manage employees, attendance, leave, and payroll</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <Link key={i} href={card.href}>
              <div className={`${card.color} border border-border rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{card.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-muted-foreground opacity-60" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/hr/employees" className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-center transition-all">
            <p className="font-semibold text-foreground text-sm">👤 Add Employee</p>
          </Link>
          <Link href="/hr/attendance" className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-center transition-all">
            <p className="font-semibold text-foreground text-sm">🕐 Mark Attendance</p>
          </Link>
          <Link href="/hr/leave" className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-center transition-all">
            <p className="font-semibold text-foreground text-sm">📅 Leave Requests</p>
          </Link>
          <Link href="/hr/payroll" className="p-4 border border-border rounded-lg hover:border-primary hover:bg-primary/5 text-center transition-all">
            <p className="font-semibold text-foreground text-sm">💰 Process Payroll</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Leave Requests</h3>
          {stats.pendingLeaves > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-semibold text-foreground text-sm">Pending Approvals</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stats.pendingLeaves} requests awaiting action</p>
                </div>
                <Link href="/hr/leave" className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full hover:opacity-80 transition-opacity">
                  Review →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">✅ No pending leave requests</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Today's Attendance</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.activeEmployees - stats.absentToday - stats.onLeave}</p>
              <p className="text-xs text-muted-foreground mt-1">Present</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.absentToday}</p>
              <p className="text-xs text-muted-foreground mt-1">Absent</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.onLeave}</p>
              <p className="text-xs text-muted-foreground mt-1">On Leave</p>
            </div>
          </div>
          <Link href="/hr/attendance" className="mt-4 block text-center text-sm text-primary font-medium hover:underline">
            View full attendance →
          </Link>
        </div>
      </div>
    </div>
  )
}
