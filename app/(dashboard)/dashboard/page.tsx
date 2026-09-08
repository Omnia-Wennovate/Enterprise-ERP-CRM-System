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

export default function DashboardPage() {
  const contextProfile = useProfile()
  const [profile, setProfile] = useState<Profile | null>(contextProfile)
  const [isLoading, setIsLoading] = useState(!contextProfile)

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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    )
  }

  if (!profile) return null

  const firstName = resolveUserNames(profile).first_name

  // Role-specific stats
  const getStatsForRole = () => {
    switch (profile.role) {
      case 'sales_agent':
        return [
          { icon: 'DollarSign', label: 'My Revenue', value: '$12,400', trend: 12, accentColor: '#10B981' },
          { icon: 'Plane', label: 'My Bookings', value: '8', trend: 5, accentColor: '#C8A951' },
          { icon: 'Users', label: 'My Leads', value: '12', trend: -3, accentColor: '#F59E0B' },
          { icon: 'Award', label: 'Commission', value: '$620', trend: 8, accentColor: '#0EA5E9' },
        ]
      case 'operations':
        return [
          { icon: 'Plane', label: 'Active Bookings', value: '24', trend: 4, accentColor: '#C8A951' },
          { icon: 'AlertCircle', label: 'Incomplete', value: '3', trend: -2, accentColor: '#EF4444' },
          { icon: 'BookOpen', label: 'Visas Pending', value: '5', trend: 1, accentColor: '#F59E0B' },
          { icon: 'FileText', label: 'Docs to Send', value: '4', trend: -1, accentColor: '#10B981' },
        ]
      case 'accountant':
        return [
          { icon: 'DollarSign', label: 'Revenue', value: '$48,200', trend: 8, accentColor: '#10B981' },
          { icon: 'TrendingDown', label: 'Costs', value: '$31,400', trend: 2, accentColor: '#EF4444' },
          { icon: 'BarChart2', label: 'Profit', value: '$16,800', trend: 12, accentColor: '#C8A951' },
          { icon: 'AlertCircle', label: 'Outstanding', value: '$8,400', trend: -5, accentColor: '#F59E0B' },
        ]
      case 'hr_manager':
        return [
          { icon: 'Users', label: 'Total Staff', value: '8', trend: 0, accentColor: '#C8A951' },
          { icon: 'Calendar', label: 'Leave Pending', value: '3', trend: 1, accentColor: '#F59E0B' },
          { icon: 'Target', label: 'Avg Target', value: '92%', trend: 3, accentColor: '#10B981' },
          { icon: 'DollarSign', label: 'Commission Due', value: '$4,200', trend: 7, accentColor: '#0EA5E9' },
        ]
      case 'marketing':
        return [
          { icon: 'Users', label: 'Followers', value: '12.4K', trend: 8, accentColor: '#C8A951' },
          { icon: 'MessageCircle', label: 'Engagement', value: '3.2%', trend: 5, accentColor: '#10B981' },
          { icon: 'Target', label: 'Campaigns', value: '4', trend: 2, accentColor: '#F59E0B' },
          { icon: 'TrendingUp', label: 'Reach', value: '48K', trend: 12, accentColor: '#0EA5E9' },
        ]
      case 'admin':
      case 'super_admin':
      default:
        return [
          { icon: 'DollarSign', label: 'Revenue', value: '$48,200', trend: 8, accentColor: '#10B981' },
          { icon: 'Plane', label: 'Bookings', value: '124', trend: 12, accentColor: '#C8A951' },
          { icon: 'Users', label: 'Leads', value: '18', trend: -3, accentColor: '#F59E0B' },
          { icon: 'AlertCircle', label: 'Outstanding', value: '$8,400', trend: -5, accentColor: '#EF4444' },
        ]
    }
  }

  const stats = getStatsForRole()

  return (
    <div className="w-full">
      <WelcomeBanner firstName={firstName} role={profile.role} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Advanced Analytics Section - Super Admin Only */}
      {profile.role === 'super_admin' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Data Performance Company Chart */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Data Performance Company</h3>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded font-medium">12 months</button>
                  <button className="px-3 py-1 border border-border text-muted-foreground text-xs rounded hover:border-primary">30 days</button>
                  <button className="px-3 py-1 border border-border text-muted-foreground text-xs rounded hover:border-primary">7 days</button>
                </div>
              </div>
              <div className="relative h-64 mb-6">
                <div className="ml-12 h-full border-l border-b border-[#E5E7EB] relative">
                  <svg className="w-full h-full" style={{position: 'absolute', inset: 0}} preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline points="0,60 8,50 16,55 24,35 32,40 40,25 48,30 56,20 64,25 72,15 80,20 88,10 96,15" fill="none" stroke="#C8A951" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <polygon points="0,60 8,50 16,55 24,35 32,40 40,25 48,30 56,20 64,25 72,15 80,20 88,10 96,15 96,100 0,100" fill="url(#blueGradient)" opacity="0.1" />
                    <polyline points="0,75 8,70 16,72 24,65 32,68 40,60 48,62 56,55 64,58 72,50 80,52 88,45 96,48" fill="none" stroke="#EF4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#C8A951', stopOpacity: 0.3}} />
                        <stop offset="100%" style={{stopColor: '#C8A951', stopOpacity: 0}} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground">$482,000</p>
                  <p className="text-xs text-green-600 mt-1">↑ 8.2% vs last 12 months</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold text-foreground">1,248</p>
                  <p className="text-xs text-green-600 mt-1">↑ 12.4% vs last 12 months</p>
                </div>
              </div>
            </div>

            {/* Company Growth Overview */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Company Growth Overview</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-border">
                <div className="text-center"><p className="text-2xl font-bold text-foreground">1,560</p><p className="text-xs text-muted-foreground mt-1">Total Leads</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-foreground">780</p><p className="text-xs text-muted-foreground mt-1">New Customers</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-foreground">1,248</p><p className="text-xs text-muted-foreground mt-1">Total Bookings</p></div>
              </div>
              <div className="h-48 flex items-end justify-center gap-2">
                {[{blue: 45, pink: 35},{blue: 65, pink: 25},{blue: 40, pink: 40},{blue: 70, pink: 20},{blue: 50, pink: 30},{blue: 75, pink: 15}].map((bar, i) => (
                  <div key={i} className="flex flex-col gap-0 flex-1">
                    <div className="w-full bg-[#C8A951] rounded-t" style={{height: `${bar.blue * 1.2}px`}}></div>
                    <div className="w-full bg-[#F5A3CE] rounded-b" style={{height: `${bar.pink * 1.2}px`}}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity + Upcoming Departures */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground">Data Performance Overview</h3>
              </div>
              <div className="relative h-48">
                <div className="absolute inset-0 flex items-end justify-between px-2">
                  {[35, 42, 38, 48, 45, 52, 48, 55, 50, 58, 55, 60].map((h, i) => (
                    <div key={i} className="flex-1 mx-1">
                      <div className="w-full bg-[#C8A951] rounded" style={{height: `${h * 1.8}px`}}></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-lg font-bold text-foreground">$482,000</p></div>
                <div><p className="text-xs text-muted-foreground">Total Bookings</p><p className="text-lg font-bold text-foreground">1,248</p></div>
                <div><p className="text-xs text-muted-foreground">Total Leads</p><p className="text-lg font-bold text-foreground">218</p></div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {['New booking created – #BK-2025-1245', 'Payment received – John Doe', 'New lead assigned – Sarah J.', 'Quote approved – #QT-2025-089'].map((item, i) => (
                  <div key={i} className="flex gap-3 pb-3 border-b border-border last:border-0">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick KPI cards */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">What would you like to do?</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[{icon:'➕',label:'New Lead',desc:'Add a new potential customer'},{icon:'📋',label:'New Quote',desc:'Create a new quotation'},{icon:'📊',label:'View Reports',desc:'Explore analytics & insights'},{icon:'👥',label:'Manage Staff',desc:'Add or manage team members'}].map((a,i) => (
                <button key={i} className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg mb-3"><span className="text-2xl">{a.icon}</span></div>
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
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 pb-4 border-b border-border last:border-0">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">Activity item {i}</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary font-medium">View all activity →</button>
            </div>
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
              <h3 className="font-semibold text-foreground mb-4">Upcoming Departures</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground font-medium">Booking {i}</p>
                      <p className="text-xs text-muted-foreground">In {i} days</p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Active</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-primary font-medium">View all bookings →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
