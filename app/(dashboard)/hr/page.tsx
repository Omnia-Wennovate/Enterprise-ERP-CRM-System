'use client'

import { useState, useEffect } from 'react'
import { Users, Clock, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface HRStats {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  pendingApprovals: number
  thisMonthPayroll: number
  absentToday: number
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    pendingApprovals: 0,
    thisMonthPayroll: 0,
    absentToday: 0,
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      // Mock data for now - will be replaced with actual API calls
      setStats({
        totalEmployees: 45,
        activeEmployees: 42,
        onLeave: 2,
        pendingApprovals: 5,
        thisMonthPayroll: 125000,
        absentToday: 1,
      })
    } catch (error) {
      console.error('Failed to load HR stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-50',
      href: '/hr/employees',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: TrendingUp,
      color: 'bg-green-50',
      href: '/hr/employees',
    },
    {
      title: 'On Leave Today',
      value: stats.onLeave,
      icon: Calendar,
      color: 'bg-yellow-50',
      href: '/hr/leave',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'bg-red-50',
      href: '/hr/leave',
    },
    {
      title: 'This Month Payroll',
      value: `$${stats.thisMonthPayroll.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-50',
      href: '/hr/payroll',
    },
    {
      title: 'Absent Today',
      value: stats.absentToday,
      icon: Clock,
      color: 'bg-orange-50',
      href: '/hr/attendance',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage employees, attendance, leave, and payroll</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, i) => {
            const Icon = card.icon
            return (
              <Link key={i} href={card.href}>
                <div className={`${card.color} rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-600 text-sm font-medium">{card.title}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                    </div>
                    <Icon className="w-8 h-8 text-slate-400" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/hr/employees/new" className="p-4 border border-slate-200 rounded-lg hover:border-teal-600 text-center transition-colors">
              <p className="font-semibold text-slate-900">Add Employee</p>
            </Link>
            <Link href="/hr/attendance" className="p-4 border border-slate-200 rounded-lg hover:border-teal-600 text-center transition-colors">
              <p className="font-semibold text-slate-900">Mark Attendance</p>
            </Link>
            <Link href="/hr/leave" className="p-4 border border-slate-200 rounded-lg hover:border-teal-600 text-center transition-colors">
              <p className="font-semibold text-slate-900">Leave Requests</p>
            </Link>
            <Link href="/hr/payroll" className="p-4 border border-slate-200 rounded-lg hover:border-teal-600 text-center transition-colors">
              <p className="font-semibold text-slate-900">Process Payroll</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Leave Requests</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between p-3 border border-slate-100 rounded">
                  <div>
                    <p className="font-semibold text-slate-900">Employee Name</p>
                    <p className="text-sm text-slate-600">Requested 2 days ago</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Pending</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-slate-100 rounded">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-2"></div>
                  <div>
                    <p className="font-semibold text-slate-900">Event Name</p>
                    <p className="text-sm text-slate-600">Dec 15, 2024</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
