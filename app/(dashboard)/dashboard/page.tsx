'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get profile from localStorage (set during login)
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) {
      router.push('/login')
      return
    }

    try {
      const user = JSON.parse(authUser)
      setProfile(user)
    } catch (err) {
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F7FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const firstName = profile.full_name.split(' ')[0]

  // Role-specific stats
  const getStatsForRole = () => {
    switch (profile.role) {
      case 'sales_agent':
        return [
          {
            icon: 'DollarSign',
            label: 'My Revenue',
            value: '$12,400',
            trend: 12,
            accentColor: '#10B981',
          },
          {
            icon: 'Plane',
            label: 'My Bookings',
            value: '8',
            trend: 5,
            accentColor: '#0A8FA8',
          },
          {
            icon: 'Users',
            label: 'My Leads',
            value: '12',
            trend: -3,
            accentColor: '#F59E0B',
          },
          {
            icon: 'Award',
            label: 'Commission',
            value: '$620',
            trend: 8,
            accentColor: '#0EA5E9',
          },
        ]
      case 'operations':
        return [
          {
            icon: 'Plane',
            label: 'Active Bookings',
            value: '24',
            trend: 4,
            accentColor: '#0A8FA8',
          },
          {
            icon: 'AlertCircle',
            label: 'Incomplete',
            value: '3',
            trend: -2,
            accentColor: '#EF4444',
          },
          {
            icon: 'BookOpen',
            label: 'Visas Pending',
            value: '5',
            trend: 1,
            accentColor: '#F59E0B',
          },
          {
            icon: 'FileText',
            label: 'Docs to Send',
            value: '4',
            trend: -1,
            accentColor: '#10B981',
          },
        ]
      case 'accountant':
        return [
          {
            icon: 'DollarSign',
            label: 'Revenue',
            value: '$48,200',
            trend: 8,
            accentColor: '#10B981',
          },
          {
            icon: 'TrendingDown',
            label: 'Costs',
            value: '$31,400',
            trend: 2,
            accentColor: '#EF4444',
          },
          {
            icon: 'BarChart2',
            label: 'Profit',
            value: '$16,800',
            trend: 12,
            accentColor: '#0A8FA8',
          },
          {
            icon: 'AlertCircle',
            label: 'Outstanding',
            value: '$8,400',
            trend: -5,
            accentColor: '#F59E0B',
          },
        ]
      case 'hr_manager':
        return [
          {
            icon: 'Users',
            label: 'Total Staff',
            value: '8',
            trend: 0,
            accentColor: '#0A8FA8',
          },
          {
            icon: 'Calendar',
            label: 'Leave Pending',
            value: '3',
            trend: 1,
            accentColor: '#F59E0B',
          },
          {
            icon: 'Target',
            label: 'Avg Target',
            value: '92%',
            trend: 3,
            accentColor: '#10B981',
          },
          {
            icon: 'DollarSign',
            label: 'Commission Due',
            value: '$4,200',
            trend: 7,
            accentColor: '#0EA5E9',
          },
        ]
      case 'admin':
      case 'super_admin':
      default:
        return [
          {
            icon: 'DollarSign',
            label: 'Revenue',
            value: '$48,200',
            trend: 8,
            accentColor: '#10B981',
          },
          {
            icon: 'Plane',
            label: 'Bookings',
            value: '124',
            trend: 12,
            accentColor: '#0A8FA8',
          },
          {
            icon: 'Users',
            label: 'Leads',
            value: '18',
            trend: -3,
            accentColor: '#F59E0B',
          },
          {
            icon: 'AlertCircle',
            label: 'Outstanding',
            value: '$8,400',
            trend: -5,
            accentColor: '#EF4444',
          },
        ]
    }
  }

  const stats = getStatsForRole()

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
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
              {/* Data Performance Company + Company Growth Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Data Performance Company Chart */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-[#0B1F33]">Data Performance Company</h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-[#0A8FA8] text-white text-xs rounded font-medium">12 months</button>
                      <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">30 days</button>
                      <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">7 days</button>
                      <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">24 hours</button>
                    </div>
                  </div>

                  {/* Multi-line Chart Area */}
                  <div className="relative h-64 mb-6">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[#4B6B7A] pr-2">
                      <span>$5k</span>
                      <span>$4k</span>
                      <span>$3k</span>
                      <span>$2k</span>
                      <span>$1k</span>
                      <span>$0</span>
                    </div>

                    {/* Chart area with grid */}
                    <div className="ml-12 h-full border-l border-b border-[#E5E7EB] relative">
                      {/* SVG-like area chart simulation */}
                      <svg className="w-full h-full" style={{position: 'absolute', inset: 0}} preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Blue line (Revenue) */}
                        <polyline points="0,60 8,50 16,55 24,35 32,40 40,25 48,30 56,20 64,25 72,15 80,20 88,10 96,15" fill="none" stroke="#0A8FA8" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        {/* Blue fill under line */}
                        <polygon points="0,60 8,50 16,55 24,35 32,40 40,25 48,30 56,20 64,25 72,15 80,20 88,10 96,15 96,100 0,100" fill="url(#blueGradient)" opacity="0.1" />

                        {/* Red line (Costs) */}
                        <polyline points="0,75 8,70 16,72 24,65 32,68 40,60 48,62 56,55 64,58 72,50 80,52 88,45 96,48" fill="none" stroke="#EF4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                        {/* Red fill under line */}
                        <polygon points="0,75 8,70 16,72 24,65 32,68 40,60 48,62 56,55 64,58 72,50 80,52 88,45 96,48 96,100 0,100" fill="url(#redGradient)" opacity="0.1" />

                        {/* Gradient definitions */}
                        <defs>
                          <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{stopColor: '#0A8FA8', stopOpacity: 0.3}} />
                            <stop offset="100%" style={{stopColor: '#0A8FA8', stopOpacity: 0}} />
                          </linearGradient>
                          <linearGradient id="redGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{stopColor: '#EF4444', stopOpacity: 0.2}} />
                            <stop offset="100%" style={{stopColor: '#EF4444', stopOpacity: 0}} />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* X-axis labels */}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-[#4B6B7A] ml-12">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'].map((day, i) => (
                          <span key={i} className="flex-1 text-center">{day}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-2 gap-4 pt-4 border-t border-[#DBEAFE]">
                    <div>
                      <p className="text-xs text-[#4B6B7A]">Total Revenue</p>
                      <p className="text-2xl font-bold text-[#0B1F33]">$482,000</p>
                      <p className="text-xs text-[#10B981] mt-1">↑ 8.2% vs last 12 months</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#4B6B7A]">Total Bookings</p>
                      <p className="text-2xl font-bold text-[#0B1F33]">1,248</p>
                      <p className="text-xs text-[#10B981] mt-1">↑ 12.4% vs last 12 months</p>
                    </div>
                  </div>
                </div>

                {/* Company Growth Overview */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-[#0B1F33]">Company Growth Overview</h3>
                    <button className="text-xs text-[#4B6B7A] hover:text-[#0A8FA8]">Sort by Newest ▼</button>
                  </div>

                  {/* KPI Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-[#DBEAFE]">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#0B1F33]">1,560</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">Total Leads</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#0B1F33]">780</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">New Customers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#0B1F33]">1,560</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">Total Bookings</p>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="h-48 flex items-end justify-center gap-2">
                    {[
                      {blue: 45, pink: 35},
                      {blue: 65, pink: 25},
                      {blue: 40, pink: 40},
                      {blue: 70, pink: 20},
                      {blue: 50, pink: 30},
                      {blue: 75, pink: 15},
                    ].map((bar, i) => (
                      <div key={i} className="flex flex-col gap-0 flex-1">
                        <div className="w-full bg-gradient-to-b from-[#0A8FA8] to-[#0A8FA8] rounded-t" style={{height: `${bar.blue * 1.2}px`}}></div>
                        <div className="w-full bg-gradient-to-b from-[#F5A3CE] to-[#F5A3CE] rounded-b" style={{height: `${bar.pink * 1.2}px`}}></div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-center text-xs text-[#4B6B7A]">
                    Jan • Feb • Mar • Apr • May • Jun
                  </div>
                </div>
              </div>

              {/* Bottom Analytics Cards Row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Data Performance Donut */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-4">Data Performance Company</h3>
                  <div className="flex justify-center mb-4">
                    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
                      <circle cx="70" cy="70" r="60" fill="none" stroke="#F0F7FA" strokeWidth="20" />
                      <circle cx="70" cy="70" r="60" fill="none" stroke="#0A8FA8" strokeWidth="20" strokeDasharray="94.2 282.6" strokeDashoffset="0" transform="rotate(-90 70 70)" />
                      <circle cx="70" cy="70" r="40" fill="white" />
                    </svg>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#0A8FA8] rounded-full"></span> Product A</span>
                      <span className="font-medium">$5.2k +17%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#F5A3CE] rounded-full"></span> Product B</span>
                      <span className="font-medium">$3.4k -5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#E5E7EB] rounded-full"></span> Product C</span>
                      <span className="font-medium">$2.1k -8%</span>
                    </div>
                  </div>
                </div>

                {/* Ads Promotion Circle */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-6">Ads Promotion</h3>
                  <div className="flex justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F7FA" strokeWidth="15" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#0A8FA8" strokeWidth="15" strokeDasharray="78.5 314" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                      <text x="60" y="65" textAnchor="middle" className="text-xl font-bold" fill="#0B1F33">5</text>
                    </svg>
                  </div>
                  <p className="text-center text-xs text-[#4B6B7A] mt-4">Days Left</p>
                </div>

                {/* SEO Performance */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-6">Seo Performance</h3>
                  <div className="flex justify-center">
                    <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F0F7FA" strokeWidth="15" />
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#EF4444" strokeWidth="15" strokeDasharray="235.5 314" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                      <text x="60" y="70" textAnchor="middle" className="text-3xl font-bold" fill="#0B1F33">90%</text>
                    </svg>
                  </div>
                </div>

                {/* Budget Allocation Preview */}
                <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-4">Budget Allocation</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#4B6B7A]">Marketing</span>
                        <span className="text-xs font-medium text-[#0B1F33]">49%</span>
                      </div>
                      <div className="w-full h-2 bg-[#F0F7FA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#F59E0B] rounded-full" style={{width: '49%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#4B6B7A]">Operations</span>
                        <span className="text-xs font-medium text-[#0B1F33]">68%</span>
                      </div>
                      <div className="w-full h-2 bg-[#F0F7FA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#0A8FA8] rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#4B6B7A]">Development</span>
                        <span className="text-xs font-medium text-[#0B1F33]">59%</span>
                      </div>
                      <div className="w-full h-2 bg-[#F0F7FA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#8B5CF6] rounded-full" style={{width: '59%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Allocation Full Table */}
              <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-[#0B1F33]">Budget Allocation</h3>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1 border border-[#DBEAFE] rounded hover:border-[#0A8FA8] text-[#4B6B7A]">7 Days</button>
                    <button className="text-xs px-3 py-1 border border-[#DBEAFE] rounded hover:border-[#0A8FA8] text-[#4B6B7A]">1 Month</button>
                    <button className="text-xs px-3 py-1 border border-[#DBEAFE] rounded hover:border-[#0A8FA8] text-[#4B6B7A]">3 Months</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#DBEAFE]">
                        <th className="text-left py-3 px-4 font-semibold text-[#0B1F33]">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#0B1F33]">Budget</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#0B1F33]">Spent</th>
                        <th className="text-left py-3 px-4 font-semibold text-[#0B1F33]">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {category: 'Marketing', icon: '🎨', budget: '$5,000', spent: '$2,486', progress: 49},
                        {category: 'Operations', icon: '⚙️', budget: '$8,000', spent: '$5,456', progress: 68},
                        {category: 'Development', icon: '💻', budget: '$6,000', spent: '$3,567', progress: 59},
                        {category: 'HR & Training', icon: '👥', budget: '$4,000', spent: '$1,234', progress: 31},
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#DBEAFE] last:border-0">
                          <td className="py-3 px-4"><span className="mr-2">{row.icon}</span>{row.category}</td>
                          <td className="py-3 px-4 font-medium text-[#0B1F33]">{row.budget}</td>
                          <td className="py-3 px-4 font-medium text-[#0B1F33]">{row.spent}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-[#F0F7FA] rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-[#0A8FA8] to-[#0A8FA8] rounded-full" style={{width: `${row.progress}%`}}></div>
                              </div>
                              <span className="text-xs font-medium text-[#4B6B7A]">{row.progress}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* What would you like to do - Quick Actions */}
          {profile.role === 'super_admin' && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#0B1F33] mb-4">What would you like to do?</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="bg-white border border-[#DBEAFE] rounded-lg p-6 hover:border-[#0A8FA8] hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#E0F2F7] rounded-lg mb-3">
                    <span className="text-2xl">➕</span>
                  </div>
                  <h4 className="font-semibold text-[#0B1F33] text-sm">New Lead</h4>
                  <p className="text-xs text-[#4B6B7A] mt-1">Add a new potential customer</p>
                </button>
                <button className="bg-white border border-[#DBEAFE] rounded-lg p-6 hover:border-[#0A8FA8] hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#E0F2F7] rounded-lg mb-3">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h4 className="font-semibold text-[#0B1F33] text-sm">New Quote</h4>
                  <p className="text-xs text-[#4B6B7A] mt-1">Create a new quotation</p>
                </button>
                <button className="bg-white border border-[#DBEAFE] rounded-lg p-6 hover:border-[#0A8FA8] hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#E0F2F7] rounded-lg mb-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="font-semibold text-[#0B1F33] text-sm">View Reports</h4>
                  <p className="text-xs text-[#4B6B7A] mt-1">Explore analytics & insights</p>
                </button>
                <button className="bg-white border border-[#DBEAFE] rounded-lg p-6 hover:border-[#0A8FA8] hover:shadow-md transition-all text-left">
                  <div className="flex items-center justify-center w-10 h-10 bg-[#E0F2F7] rounded-lg mb-3">
                    <span className="text-2xl">👥</span>
                  </div>
                  <h4 className="font-semibold text-[#0B1F33] text-sm">Manage Staff</h4>
                  <p className="text-xs text-[#4B6B7A] mt-1">Add or manage team members</p>
                </button>
              </div>
            </div>
          )}

          {/* Data Performance + Recent Activity + Upcoming Departures */}
          {profile.role === 'super_admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Data Performance Overview - 2 columns */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-[#0B1F33]">Data Performance Overview</h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-[#0A8FA8] text-white text-xs rounded font-medium">12 Months</button>
                    <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">30 Days</button>
                    <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">7 Days</button>
                    <button className="px-3 py-1 border border-[#DBEAFE] text-[#4B6B7A] text-xs rounded hover:border-[#0A8FA8]">24 Hours</button>
                  </div>
                </div>

                <div className="relative h-64">
                  <div className="absolute inset-0 flex items-end justify-between px-2">
                    {[35, 42, 38, 48, 45, 52, 48, 55, 50, 58, 55, 60].map((h, i) => (
                      <div key={i} className="flex-1 mx-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-gradient-to-t from-[#0A8FA8] to-[#0A8FA8] rounded" style={{height: `${h * 2}px`}}></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-[#DBEAFE]">
                  <div>
                    <p className="text-xs text-[#4B6B7A] font-medium">Total Revenue</p>
                    <p className="text-xl font-bold text-[#0B1F33] mt-1">$482,000</p>
                    <p className="text-xs text-[#10B981] mt-1">↑ 8.2% vs last 12 months</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B6B7A] font-medium">Total Bookings</p>
                    <p className="text-xl font-bold text-[#0B1F33] mt-1">1,248</p>
                    <p className="text-xs text-[#10B981] mt-1">↑ 12.4% vs last 12 months</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#4B6B7A] font-medium">Total Leads</p>
                    <p className="text-xl font-bold text-[#0B1F33] mt-1">218</p>
                    <p className="text-xs text-[#EF4444] mt-1">↓ 3.2% vs last 12 months</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity - 1 column */}
              <div className="bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#0B1F33]">Recent Activity</h3>
                  <button className="text-xs text-[#0A8FA8] hover:text-[#088096] font-medium">View all</button>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3 pb-4 border-b border-[#DBEAFE]">
                    <div className="w-8 h-8 bg-[#E0F2F7] rounded flex items-center justify-center flex-shrink-0 text-sm">📁</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1F33]">New booking created</p>
                      <p className="text-xs text-[#4B6B7A]">Booking #BK-2025-1245</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">2 min ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pb-4 border-b border-[#DBEAFE]">
                    <div className="w-8 h-8 bg-[#E0F2F7] rounded flex items-center justify-center flex-shrink-0 text-sm">💳</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1F33]">Payment received</p>
                      <p className="text-xs text-[#4B6B7A]">From John Doe</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">15 min ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pb-4 border-b border-[#DBEAFE]">
                    <div className="w-8 h-8 bg-[#E0F2F7] rounded flex items-center justify-center flex-shrink-0 text-sm">👤</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1F33]">New lead assigned</p>
                      <p className="text-xs text-[#4B6B7A]">Sarah Johnson</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">1 hour ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 pb-4 border-b border-[#DBEAFE]">
                    <div className="w-8 h-8 bg-[#E0F2F7] rounded flex items-center justify-center flex-shrink-0 text-sm">📋</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1F33]">Quote approved</p>
                      <p className="text-xs text-[#4B6B7A]">Quote #QT-2025-089</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-[#E0F2F7] rounded flex items-center justify-center flex-shrink-0 text-sm">📄</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#0B1F33]">Invoice sent</p>
                      <p className="text-xs text-[#4B6B7A]">Invoice #INV-2025-567</p>
                      <p className="text-xs text-[#4B6B7A] mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Departures - will be in next row */}
            </div>
          )}

          {profile.role === 'super_admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Upcoming Departures */}
              <div className="lg:col-span-1 bg-white rounded-lg border border-[#DBEAFE] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#0B1F33]">Upcoming Departures</h3>
                  <button className="text-xs text-[#0A8FA8] hover:text-[#088096] font-medium">View all</button>
                </div>
                <div className="space-y-3">
                  <div className="border border-[#DBEAFE] rounded-lg p-3 hover:border-[#0A8FA8] transition-colors">
                    <div className="flex gap-3">
                      <img src="https://images.unsplash.com/photo-1512453075961-9a832e62fb50?w=100&h=100&fit=crop" alt="Dubai" className="w-16 h-16 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B1F33]">Booking #BK-2025-1245</p>
                        <p className="text-xs text-[#4B6B7A]">Dubai, UAE</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-[#4B6B7A]">📅 May 17, 2025</span>
                          <span className="text-xs bg-[#E0F2F7] text-[#0A8FA8] px-2 py-0.5 rounded-full font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border border-[#DBEAFE] rounded-lg p-3 hover:border-[#0A8FA8] transition-colors">
                    <div className="flex gap-3">
                      <img src="https://images.unsplash.com/photo-1537905904737-13e908bfc85f?w=100&h=100&fit=crop" alt="Maldives" className="w-16 h-16 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B1F33]">Booking #BK-2025-1246</p>
                        <p className="text-xs text-[#4B6B7A]">Maldives</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-[#4B6B7A]">📅 May 18, 2025</span>
                          <span className="text-xs bg-[#E0F2F7] text-[#0A8FA8] px-2 py-0.5 rounded-full font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border border-[#DBEAFE] rounded-lg p-3 hover:border-[#0A8FA8] transition-colors">
                    <div className="flex gap-3">
                      <img src="https://images.unsplash.com/photo-1504681869696-d977e2a54b4b?w=100&h=100&fit=crop" alt="Turkey" className="w-16 h-16 rounded object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B1F33]">Booking #BK-2025-1247</p>
                        <p className="text-xs text-[#4B6B7A]">Turkey</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-[#4B6B7A]">📅 May 19, 2025</span>
                          <span className="text-xs bg-[#E0F2F7] text-[#0A8FA8] px-2 py-0.5 rounded-full font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: '👤', label: 'New Leads', value: '7', trend: 16, color: 'bg-blue-50' },
                  { icon: '👥', label: 'New Customers', value: '5', trend: 25, color: 'bg-purple-50' },
                  { icon: '🎯', label: 'Conversion Rate', value: '28.6%', trend: 3, color: 'bg-yellow-50' },
                  { icon: '💰', label: 'Avg. Booking Value', value: '$2,450', trend: 6, color: 'bg-green-50' },
                  { icon: '💳', label: 'Payments Received', value: '$32,100', trend: 9, color: 'bg-blue-50' },
                  { icon: '✓', label: 'Tasks Pending', value: '12', trend: -3, color: 'bg-red-50', trendColor: 'text-red-600' },
                ].map((card, i) => (
                  <div key={i} className={`${card.color} rounded-lg p-4 border border-opacity-0 hover:border hover:border-[#DBEAFE]`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">{card.icon}</span>
                    </div>
                    <p className="text-xs text-[#4B6B7A] font-medium mb-1">{card.label}</p>
                    <p className="text-xl font-bold text-[#0B1F33]">{card.value}</p>
                    <p className={`text-xs mt-2 ${card.trendColor || 'text-[#10B981]'}`}>
                      {card.trend > 0 ? '↑' : '↓'} {Math.abs(card.trend)}% this week
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* For non-super-admin roles */}
          {profile.role !== 'super_admin' && (
            <>
              <QuickActions role={profile.role} />

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 pb-4 border-b border-[#DBEAFE] last:border-0">
                        <div className="w-2 h-2 bg-[#0A8FA8] rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0B1F33] font-medium truncate">Activity item {i}</p>
                          <p className="text-xs text-[#4B6B7A]">2 hours ago</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-[#0A8FA8] hover:text-[#088096] font-medium transition-colors">
                    View all activity →
                  </button>
                </div>

                {/* Upcoming Departures */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-4">Upcoming Departures</h3>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between pb-4 border-b border-[#DBEAFE] last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#0B1F33] font-medium">Booking {i}</p>
                          <p className="text-xs text-[#4B6B7A]">In {i} days</p>
                        </div>
                        <span className="text-xs bg-[#F0F7FA] text-[#0A8FA8] px-2 py-1 rounded-full flex-shrink-0">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 py-2 text-sm text-[#0A8FA8] hover:text-[#088096] font-medium transition-colors">
                    View all bookings →
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
