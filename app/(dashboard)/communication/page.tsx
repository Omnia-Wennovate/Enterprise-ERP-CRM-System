'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Bell, Users, Calendar, CheckSquare, Search } from 'lucide-react'
import Link from 'next/link'

export default function CommunicationHub() {
  const [unreadDMs, setUnreadDMs] = useState(3)
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(2)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    // Mock data - replace with real Supabase calls
    setRecentActivity([
      {
        id: 1,
        type: 'message',
        actor: 'John Smith',
        action: 'sent you a direct message',
        timestamp: '5 minutes ago',
      },
      {
        id: 2,
        type: 'announcement',
        actor: 'HR Department',
        action: 'posted Payroll Completed announcement',
        timestamp: '2 hours ago',
      },
      {
        id: 3,
        type: 'meeting',
        actor: 'Jane Doe',
        action: 'invited you to Team Meeting',
        timestamp: '4 hours ago',
      },
      {
        id: 4,
        type: 'task',
        actor: 'Robert Johnson',
        action: 'assigned you a task: Complete project report',
        timestamp: '6 hours ago',
      },
    ])
  }, [])

  const quickActions = [
    {
      icon: MessageSquare,
      label: 'Direct Messages',
      href: '/communication/dm',
      badge: unreadDMs > 0 ? unreadDMs : null,
    },
    {
      icon: Users,
      label: 'Channels',
      href: '/communication/channels',
      badge: null,
    },
    {
      icon: Bell,
      label: 'Announcements',
      href: '/communication/announcements',
      badge: unreadAnnouncements > 0 ? unreadAnnouncements : null,
    },
    {
      icon: Calendar,
      label: 'Meetings',
      href: '/communication/meetings',
      badge: null,
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      href: '/communication/tasks',
      badge: 1,
    },
    {
      icon: Search,
      label: 'Search',
      href: '/communication/search',
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F0F7FA]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Communication Center</h1>
          <p className="text-slate-600 mt-2">Your unified hub for team collaboration and conversations</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow relative group"
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className="w-8 h-8 text-teal-600 mb-3" />
                  <span className="text-sm font-medium text-slate-900">{action.label}</span>
                  {action.badge && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {action.badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Active Conversations</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">12</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Team Members Online</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">8</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Unread Messages</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{unreadDMs}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-slate-600 text-sm font-medium">Pending Tasks</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">3</p>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  {activity.type === 'message' && <MessageSquare className="w-5 h-5 text-teal-600" />}
                  {activity.type === 'announcement' && <Bell className="w-5 h-5 text-teal-600" />}
                  {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-teal-600" />}
                  {activity.type === 'task' && <CheckSquare className="w-5 h-5 text-teal-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-medium">{activity.actor}</p>
                  <p className="text-slate-600 text-sm">{activity.action}</p>
                  <p className="text-slate-400 text-xs mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
