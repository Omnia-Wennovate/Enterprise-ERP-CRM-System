'use client'

import { useEffect, useState } from 'react'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/context/profile-context'
import { resolveUserNames } from '@/lib/utils/user-name'
import type { Profile } from '@/types'
import { Loader2 } from 'lucide-react'

interface DashboardStat {
  icon: string
  label: string
  value: string
  trend: number
  accentColor: string
}

interface RecentActivityItem {
  id: string
  description: string
  created_at: string
}

interface UpcomingBookingItem {
  id: string
  booking_reference: string
  destination: string
  trip_start_date: string
  status: string
}

export default function DashboardPage() {
  const contextProfile = useProfile()
  const [profile, setProfile] = useState<Profile | null>(contextProfile)
  const [isLoading, setIsLoading] = useState(!contextProfile)
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBookingItem[]>([])
  const [overviewStats, setOverviewStats] = useState({ revenue: 0, bookings: 0, leads: 0 })

  // ── Load profile ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile)
      setIsLoading(false)
      return
    }

    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const resolved = resolveUserNames(data, user.email)
      const safeProfile: Profile = {
        id: user.id,
        full_name: resolved.full_name,
        first_name: resolved.first_name,
        last_name: data?.last_name || '',
        role: data?.role || 'sales_agent',
        avatar_url: data?.avatar_url || null,
        phone: data?.phone || null,
        is_active: data?.is_active ?? true,
        department: data?.department || '',
        position: data?.position || '',
        created_at: data?.created_at || new Date().toISOString(),
      }
      setProfile(safeProfile)
      setIsLoading(false)
    }
    loadProfile()
  }, [contextProfile])

  // ── Load role-specific stats from real database ───────────────────────────────
  useEffect(() => {
    if (!profile) return

    const loadStats = async () => {
      setStatsLoading(true)
      const supabase = createClient()

      try {
        switch (profile.role) {
          case 'sales_agent': {
            const { data: myBookings } = await supabase
              .from('bookings')
              .select('total_revenue, status')
              .eq('assigned_to', profile.id)
            const myRevenue = (myBookings || []).reduce((s, b) => s + (Number(b.total_revenue) || 0), 0)
            const myBookingCount = (myBookings || []).length

            const { count: myLeads } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_to', profile.id)
              .eq('status', 'active')

            const { data: myComm } = await supabase
              .from('commissions')
              .select('commission_amount')
              .eq('agent_id', profile.id)
              .eq('status', 'pending')
            const myCommTotal = (myComm || []).reduce((s, c) => s + (Number(c.commission_amount) || 0), 0)

            setStats([
              { icon: 'DollarSign', label: 'My Revenue', value: myRevenue > 0 ? `$${myRevenue.toLocaleString()}` : '—', trend: 0, accentColor: '#10B981' },
              { icon: 'Plane', label: 'My Bookings', value: String(myBookingCount), trend: 0, accentColor: '#C8A951' },
              { icon: 'Users', label: 'My Leads', value: String(myLeads ?? 0), trend: 0, accentColor: '#F59E0B' },
              { icon: 'Award', label: 'Commission Pending', value: myCommTotal > 0 ? `$${myCommTotal.toLocaleString()}` : '—', trend: 0, accentColor: '#0EA5E9' },
            ])
            break
          }

          case 'operations': {
            const { count: activeCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .in('status', ['confirmed', 'in_progress'])

            const { count: pendingCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')

            let visaCount: number | null = 0
            try {
              const { count } = await supabase
                .from('visa_applications')
                .select('*', { count: 'exact', head: true })
                .in('status', ['not_started', 'in_progress', 'submitted'])
              visaCount = count
            } catch {
              visaCount = 0
            }

            setStats([
              { icon: 'Plane', label: 'Active Bookings', value: String(activeCount ?? 0), trend: 0, accentColor: '#C8A951' },
              { icon: 'AlertCircle', label: 'Pending', value: String(pendingCount ?? 0), trend: 0, accentColor: '#EF4444' },
              { icon: 'BookOpen', label: 'Visas In Progress', value: String(visaCount ?? 0), trend: 0, accentColor: '#F59E0B' },
              { icon: 'FileText', label: 'Docs to Send', value: '—', trend: 0, accentColor: '#10B981' },
            ])
            break
          }

          case 'accountant': {
            const { data: invoices } = await supabase.from('invoices').select('total_amount, status')
            const totalRevenue = (invoices || [])
              .filter(i => i.status === 'paid')
              .reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
            const outstanding = (invoices || [])
              .filter(i => ['sent', 'overdue', 'draft', 'partially_paid'].includes(i.status))
              .reduce((s, i) => s + (Number(i.total_amount) || 0), 0)

            const { data: expenses } = await supabase.from('expenses').select('amount')
            const totalCosts = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)

            setStats([
              { icon: 'DollarSign', label: 'Revenue', value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '—', trend: 0, accentColor: '#10B981' },
              { icon: 'TrendingDown', label: 'Costs', value: totalCosts > 0 ? `$${totalCosts.toLocaleString()}` : '—', trend: 0, accentColor: '#EF4444' },
              { icon: 'BarChart2', label: 'Net Profit', value: (totalRevenue - totalCosts) > 0 ? `$${(totalRevenue - totalCosts).toLocaleString()}` : '—', trend: 0, accentColor: '#C8A951' },
              { icon: 'AlertCircle', label: 'Outstanding', value: outstanding > 0 ? `$${outstanding.toLocaleString()}` : '—', trend: 0, accentColor: '#F59E0B' },
            ])
            break
          }

          case 'hr_manager': {
            const { count: totalStaff } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('is_active', true)

            const { count: leavePending } = await supabase
              .from('leave_requests')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending')

            const { data: commDue } = await supabase
              .from('commissions')
              .select('commission_amount')
              .eq('status', 'pending')
            const commTotal = (commDue || []).reduce((s, c) => s + (Number(c.commission_amount) || 0), 0)

            const now = new Date()
            const { data: reviews } = await supabase
              .from('performance_reviews')
              .select('achievement_percent')
              .eq('period_year', now.getFullYear())
            const avgTarget = reviews && reviews.length > 0
              ? Math.round(reviews.reduce((s, r) => s + (Number(r.achievement_percent) || 0), 0) / reviews.length)
              : null

            setStats([
              { icon: 'Users', label: 'Active Staff', value: String(totalStaff ?? 0), trend: 0, accentColor: '#C8A951' },
              { icon: 'Calendar', label: 'Leave Pending', value: String(leavePending ?? 0), trend: 0, accentColor: '#F59E0B' },
              { icon: 'Target', label: 'Avg Achievement', value: avgTarget !== null ? `${avgTarget}%` : '—', trend: 0, accentColor: '#10B981' },
              { icon: 'DollarSign', label: 'Commission Pending', value: commTotal > 0 ? `$${commTotal.toLocaleString()}` : '—', trend: 0, accentColor: '#0EA5E9' },
            ])
            break
          }

          case 'marketing': {
            const { count: leads } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active')

            setStats([
              { icon: 'Users', label: 'Social Followers', value: '—', trend: 0, accentColor: '#C8A951' },
              { icon: 'MessageCircle', label: 'Engagement Rate', value: '—', trend: 0, accentColor: '#10B981' },
              { icon: 'Target', label: 'Active Campaigns', value: '—', trend: 0, accentColor: '#F59E0B' },
              { icon: 'TrendingUp', label: 'Active Leads', value: String(leads ?? 0), trend: 0, accentColor: '#0EA5E9' },
            ])
            break
          }

          case 'admin':
          case 'super_admin':
          default: {
            const { data: paidInvoices } = await supabase
              .from('invoices')
              .select('total_amount')
              .eq('status', 'paid')
            const totalRevenue = (paidInvoices || []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0)

            const { count: bookingCount } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })

            const { count: leadCount } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'active')

            const { data: openInvoices } = await supabase
              .from('invoices')
              .select('total_amount')
              .in('status', ['sent', 'overdue', 'draft', 'partially_paid'])
            const outstanding = (openInvoices || []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0)

            setStats([
              { icon: 'DollarSign', label: 'Revenue', value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '—', trend: 0, accentColor: '#10B981' },
              { icon: 'Plane', label: 'Bookings', value: String(bookingCount ?? 0), trend: 0, accentColor: '#C8A951' },
              { icon: 'Users', label: 'Active Leads', value: String(leadCount ?? 0), trend: 0, accentColor: '#F59E0B' },
              { icon: 'AlertCircle', label: 'Outstanding', value: outstanding > 0 ? `$${outstanding.toLocaleString()}` : '—', trend: 0, accentColor: '#EF4444' },
            ])

            setOverviewStats({
              revenue: totalRevenue,
              bookings: bookingCount ?? 0,
              leads: leadCount ?? 0,
            })
            break
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
        setStats([])
      } finally {
        setStatsLoading(false)
      }
    }

    loadStats()
  }, [profile])

  // ── Load recent activity + upcoming bookings (all roles) ──────────────────────
  useEffect(() => {
    if (!profile) return

    const loadActivity = async () => {
      const supabase = createClient()
      try {
        const { data: events } = await supabase
          .from('booking_timeline_events')
          .select('id, description, created_at')
          .order('created_at', { ascending: false })
          .limit(4)
        setRecentActivity(events || [])

        const today = new Date().toISOString().split('T')[0]
        const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        const { data: upcoming } = await supabase
          .from('bookings')
          .select('id, booking_reference, destination, trip_start_date, status')
          .gte('trip_start_date', today)
          .lte('trip_start_date', in30)
          .order('trip_start_date', { ascending: true })
          .limit(3)
        setUpcomingBookings(upcoming || [])
      } catch (err) {
        console.error('Failed to load activity:', err)
      }
    }

    loadActivity()
  }, [profile])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    )
  }

  if (!profile) return null

  const firstName = resolveUserNames(profile).first_name

  return (
    <div className="w-full">
      <WelcomeBanner firstName={firstName} role={profile.role} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))
          : stats.map((stat, i) => <StatsCard key={i} {...stat} />)
        }
      </div>

      {/* Advanced Analytics Section - Super Admin Only */}
      {profile.role === 'super_admin' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Live Company Overview */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Company Overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{overviewStats.leads.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{overviewStats.bookings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {overviewStats.revenue > 0 ? `$${overviewStats.revenue.toLocaleString()}` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Paid Revenue</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">All values reflect current live database records.</p>
            </div>

            {/* Live Recent Activity */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0
                  ? recentActivity.map((item) => (
                      <div key={item.id} className="flex gap-3 pb-3 border-b border-border last:border-0">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  : (
                      <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet.</p>
                    )
                }
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">What would you like to do?</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: '➕', label: 'New Lead', desc: 'Add a new potential customer' },
                { icon: '📋', label: 'New Quote', desc: 'Create a new quotation' },
                { icon: '📊', label: 'View Reports', desc: 'Explore analytics & insights' },
                { icon: '👥', label: 'Manage Staff', desc: 'Add or manage team members' },
              ].map((a, i) => (
                <button key={i} className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mb-3">
                    <span className="text-2xl">{a.icon}</span>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{a.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* For all other roles */}
      {profile.role !== 'super_admin' && (
        <>
          <QuickActions role={profile.role} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.length > 0
                  ? recentActivity.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 pb-4 border-b border-border last:border-0">
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium truncate">{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  : (
                      <p className="text-sm text-muted-foreground text-center py-6">No recent activity yet.</p>
                    )
                }
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary font-medium">View all activity →</button>
            </div>

            {/* Upcoming Departures */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Upcoming Departures</h3>
              <div className="space-y-4">
                {upcomingBookings.length > 0
                  ? upcomingBookings.map((booking) => {
                      const daysUntil = Math.ceil(
                        (new Date(booking.trip_start_date).getTime() - Date.now()) / 86400000
                      )
                      return (
                        <div key={booking.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm text-foreground font-medium">{booking.booking_reference}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.destination} · In {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                            {booking.status}
                          </span>
                        </div>
                      )
                    })
                  : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No departures in the next 30 days.
                      </p>
                    )
                }
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary font-medium">View all bookings →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
