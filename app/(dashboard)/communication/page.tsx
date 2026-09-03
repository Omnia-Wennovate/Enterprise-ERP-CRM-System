'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Bell, Users, Calendar, CheckSquare, Search, Hash, TrendingUp, Zap, Clock, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { getDepartmentConfig } from '@/lib/department-config'
import { getCommunicationDashboardData, type CommunicationDashboardData } from './actions'
import { cn } from '@/lib/utils'

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border border-border animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4 mb-3" />
      <div className="h-8 bg-muted rounded w-1/2" />
    </div>
  )
}

// ─── Relative Time ────────────────────────────────────────────────────────────
function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Daily Digest Sentence ────────────────────────────────────────────────────
function buildDigest(data: CommunicationDashboardData): string {
  const parts: string[] = []
  if (data.unreadMessages > 0) {
    parts.push(`${data.unreadMessages} unread message${data.unreadMessages !== 1 ? 's' : ''}`)
  }
  if (data.pendingTasks > 0) {
    parts.push(`${data.pendingTasks} pending task${data.pendingTasks !== 1 ? 's' : ''}`)
  }
  if (data.upcomingMeetings > 0) {
    parts.push(`${data.upcomingMeetings} upcoming meeting${data.upcomingMeetings !== 1 ? 's' : ''} this week`)
  }
  if (data.unreadAnnouncements > 0) {
    parts.push(`${data.unreadAnnouncements} unread announcement${data.unreadAnnouncements !== 1 ? 's' : ''}`)
  }

  if (parts.length === 0) return "You're all caught up — no pending items right now."
  if (parts.length === 1) return `You have ${parts[0]}.`
  const last = parts.pop()
  return `You have ${parts.join(', ')}, and ${last}.`
}

// ─── Activity Icon ────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { Icon: React.ComponentType<any>; bg: string; color: string }> = {
    message: { Icon: MessageSquare, bg: 'bg-blue-50', color: 'text-blue-500' },
    task: { Icon: CheckSquare, bg: 'bg-amber-50', color: 'text-amber-500' },
    meeting: { Icon: Calendar, bg: 'bg-green-50', color: 'text-green-500' },
    announcement: { Icon: Bell, bg: 'bg-purple-50', color: 'text-purple-500' },
    channel: { Icon: Hash, bg: 'bg-omnia-gold/10', color: 'text-omnia-gold' },
  }
  const { Icon, bg, color } = map[type] || map.channel
  return (
    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', bg)}>
      <Icon className={cn('w-4 h-4', color)} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunicationHub() {
  const [data, setData] = useState<CommunicationDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [role, setRole] = useState<string>('employee')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
        setDepartment(user.department || null)
        setRole(user.role || 'employee')
      }
    } catch {
      setError('Unable to load user profile.')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!profileId) return
    setLoading(true)
    getCommunicationDashboardData(profileId, department)
      .then(setData)
      .catch(() => setError('Failed to load communication data.'))
      .finally(() => setLoading(false))
  }, [profileId, department])

  const deptConfig = getDepartmentConfig(department)

  const quickActions = [
    { icon: MessageSquare, label: 'Direct Messages', href: '/communication/dm', badgeKey: 'unreadMessages' as const },
    { icon: Hash, label: 'Channels', href: '/communication/channels', badgeKey: null },
    { icon: Bell, label: 'Announcements', href: '/communication/announcements', badgeKey: 'unreadAnnouncements' as const },
    { icon: Calendar, label: 'Meetings', href: '/communication/meetings', badgeKey: 'upcomingMeetings' as const },
    { icon: CheckSquare, label: 'Tasks', href: '/communication/tasks', badgeKey: 'pendingTasks' as const },
    { icon: Search, label: 'Search', href: '/communication/search', badgeKey: null },
  ]

  const stats = data
    ? [
        { label: 'Active Conversations', value: data.activeConversations, icon: MessageSquare, color: 'text-blue-500' },
        { label: 'Team Members Online', value: data.onlineMembers, icon: Users, color: 'text-green-500' },
        { label: 'Unread Messages', value: data.unreadMessages, icon: Bell, color: 'text-amber-500' },
        { label: 'Pending Tasks', value: data.pendingTasks, icon: CheckSquare, color: 'text-red-500' },
        { label: 'Upcoming Meetings', value: data.upcomingMeetings, icon: Calendar, color: 'text-purple-500' },
        { label: 'Unread Announcements', value: data.unreadAnnouncements, icon: AlertCircle, color: 'text-indigo-500' },
      ]
    : []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communication Center</h1>
            <p className="text-muted-foreground mt-1">
              Your unified hub for team collaboration and conversations
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
            <kbd className="font-mono">Ctrl+K</kbd>
            <span>to search</span>
          </div>
        </div>

        {/* ── Daily Catch-up Digest ── */}
        {data && (
          <div className="flex items-center gap-3 bg-omnia-gold/8 border border-omnia-gold/20 rounded-xl px-5 py-3.5">
            <Zap className="w-5 h-5 text-omnia-gold flex-shrink-0" />
            <p className="text-sm text-foreground font-medium">{buildDigest(data)}</p>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            const badge = data && action.badgeKey ? data[action.badgeKey] : null
            return (
              <Link
                key={action.label}
                href={action.href}
                className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md hover:border-omnia-gold/30 transition-all relative group"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-omnia-gold/10 flex items-center justify-center group-hover:bg-omnia-gold/15 transition-colors">
                    <Icon className="w-6 h-6 text-omnia-gold" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{action.label}</span>
                </div>
                {badge !== null && badge !== undefined && badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* ── Stats Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-card rounded-xl shadow-sm border border-border p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('w-4 h-4', stat.color)} />
                    <p className="text-xs font-medium text-muted-foreground truncate">{stat.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Department Workspace Summary ── */}
          {department && data?.departmentSummary && (
            <div
              className="bg-card rounded-xl shadow-sm border border-border overflow-hidden"
              style={{ borderTopWidth: 3, borderTopColor: deptConfig.accent, borderTopStyle: 'solid' }}
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{deptConfig.emoji}</span>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm">{deptConfig.label} Workspace</h2>
                    <p className="text-xs text-muted-foreground">Your department overview</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Channels', value: data.departmentSummary.channels, href: '/communication/channels' },
                    { label: 'Unread Messages', value: data.departmentSummary.unreadMessages, href: '/communication/dm' },
                    { label: 'Pending Tasks', value: data.departmentSummary.pendingTasks, href: '/communication/tasks' },
                    { label: 'Upcoming Meetings', value: data.departmentSummary.upcomingMeetings, href: '/communication/meetings' },
                    { label: 'Unread Announcements', value: data.departmentSummary.unreadAnnouncements, href: '/communication/announcements' },
                  ].map(({ label, value, href }) => (
                    <Link
                      key={label}
                      href={href}
                      className="flex items-center justify-between py-1.5 hover:opacity-80 transition-opacity group"
                    >
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className={cn(
                        'text-sm font-semibold px-2 py-0.5 rounded-full',
                        value > 0 ? 'bg-omnia-gold/10 text-omnia-gold-dark' : 'bg-muted text-muted-foreground'
                      )}>
                        {value}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Recent Activity ── */}
          <div className={cn(
            'bg-card rounded-xl shadow-sm border border-border',
            department ? 'lg:col-span-2' : 'lg:col-span-3'
          )}>
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-omnia-gold" />
                Recent Activity
              </h2>
            </div>

            {loading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentActivity.length === 0 ? (
              <div className="p-10 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Start a conversation to see activity here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(data?.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.actorName}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {relativeTime(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Super Admin Department Overview ── */}
        {(role === 'super_admin' || role === 'admin') && (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-omnia-gold" />
                All Departments Overview
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Communication status across the company</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {['sales', 'operations', 'finance', 'hr', 'marketing', 'management'].map((dept) => {
                  const config = getDepartmentConfig(dept)
                  return (
                    <Link
                      key={dept}
                      href="/communication/channels"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-omnia-gold/30 hover:shadow-sm transition-all group"
                      style={{ borderLeftWidth: 3, borderLeftColor: config.accent, borderLeftStyle: 'solid' }}
                    >
                      <span className="text-xl">{config.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground">View channels →</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Keyboard Shortcut Hint ── */}
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground pb-4">
          <Info className="w-3.5 h-3.5" />
          <span>Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">Ctrl+K</kbd> anywhere in Communication Center to open the command palette</span>
        </div>

      </div>
    </div>
  )
}
