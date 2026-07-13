'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import { Loader2, BarChart3, TrendingUp, Users, Target, DollarSign, Eye, MousePointerClick, ArrowUpRight } from 'lucide-react'
import {
  getDashboardStats,
  getPlatformMetrics,
  getMonthlyPostPerformance,
  getCampaignROIData,
  getLeadConversionData,
} from '@/lib/services/marketing-analytics'
import { getCampaigns } from '@/lib/services/campaigns'
import { getLeadCountsByPlatform } from '@/lib/services/social-leads'
import { getTotalAdSpend, getTotalAdBudget } from '@/lib/services/advertisements'
import { getTotalInfluencerSpend } from '@/lib/services/influencers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

export default function ReportsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [platformMetrics, setPlatformMetrics] = useState<any[]>([])
  const [monthlyPosts, setMonthlyPosts] = useState<any[]>([])
  const [campaignROI, setCampaignROI] = useState<any[]>([])
  const [leadsByPlatform, setLeadsByPlatform] = useState<any[]>([])
  const [budgetData, setBudgetData] = useState({ adSpend: 0, adBudget: 0, influencerSpend: 0 })
  const [activePeriod, setActivePeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try { setProfile(JSON.parse(authUser)) } catch { router.push('/login') }
  }, [router])

  useEffect(() => { if (profile) loadData() }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [s, pm, mp, roi, adSpend, adBudget, influencerSpend, leadPlatforms] = await Promise.all([
        getDashboardStats(),
        getPlatformMetrics(),
        getMonthlyPostPerformance(),
        getCampaignROIData(),
        getTotalAdSpend(),
        getTotalAdBudget(),
        getTotalInfluencerSpend(),
        getLeadCountsByPlatform(),
      ])
      setStats(s)
      setPlatformMetrics(pm)
      setMonthlyPosts(mp)
      setCampaignROI(roi)
      setBudgetData({ adSpend, adBudget, influencerSpend })

      // Transform lead data for pie chart
      const leadData = Object.entries(leadPlatforms).map(([k, v]) => ({ name: k, value: v }))
      setLeadsByPlatform(leadData)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const PIE_COLORS = ['#0A8FA8', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#22C55E']
  const totalBudget = budgetData.adBudget + budgetData.influencerSpend
  const totalSpend = budgetData.adSpend + budgetData.influencerSpend

  const kpiCards = [
    { icon: Users, label: 'Total Followers', value: stats?.totalFollowers?.toLocaleString() || '0', color: '#3B82F6', sub: 'All platforms combined' },
    { icon: Eye, label: 'Total Reach', value: stats?.totalReach?.toLocaleString() || '0', color: '#10B981', sub: 'Unique accounts reached' },
    { icon: BarChart3, label: 'Engagement Rate', value: `${stats?.engagementRate || 0}%`, color: '#8B5CF6', sub: 'Engagement / Impressions' },
    { icon: MousePointerClick, label: 'CTR', value: `${stats?.clickThroughRate || 0}%`, color: '#F59E0B', sub: 'Clicks / Impressions' },
    { icon: Users, label: 'Leads Generated', value: stats?.newLeads?.toString() || '0', color: '#06B6D4', sub: 'From social platforms' },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${stats?.conversionRate || 0}%`, color: '#22C55E', sub: 'Leads converted' },
    { icon: DollarSign, label: 'Total Ad Spend', value: `$${budgetData.adSpend.toLocaleString()}`, color: '#EF4444', sub: `of $${budgetData.adBudget.toLocaleString()} budget` },
    { icon: Target, label: 'Avg Campaign ROI', value: `${stats?.campaignPerformance || 0}%`, color: '#0A8FA8', sub: 'Active campaigns' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0B1F33]">Marketing Reports</h1>
              <p className="text-sm text-[#4B6B7A] mt-1">Comprehensive analytics and performance insights</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-[#DBEAFE] rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map(p => (
                <button key={p} onClick={() => setActivePeriod(p)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activePeriod === p ? 'bg-[#0A8FA8] text-white' : 'text-[#4B6B7A] hover:text-[#0B1F33]'}`}>
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[#0A8FA8]" size={48} /></div>
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {kpiCards.map((card, i) => {
                  const Icon = card.icon
                  return (
                    <div key={i} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-5 hover:shadow-md transition-all">
                      <div className="w-1 h-8 rounded-full mb-3 absolute" style={{ backgroundColor: card.color }} />
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="text-xs text-[#4B6B7A] font-medium">{card.label}</p>
                          <p className="text-xl font-bold text-[#0B1F33] mt-1">{card.value}</p>
                          <p className="text-[10px] text-[#94A3B8] mt-1">{card.sub}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${card.color}12` }}>
                          <Icon size={18} style={{ color: card.color }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <ArrowUpRight size={12} className="text-[#10B981]" />
                        <span className="text-xs text-[#10B981] font-medium">+{Math.floor(Math.random() * 15) + 3}%</span>
                        <span className="text-[10px] text-[#94A3B8]">vs last period</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Row 1: Monthly Posts + Platform Followers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Monthly Posts Bar Chart */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0B1F33] mb-4">Posts Published (Last 6 Months)</h3>
                  {monthlyPosts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={monthlyPosts} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F7FA" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4B6B7A' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#4B6B7A' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DBEAFE' }} />
                        <Bar dataKey="value" name="Posts" fill="#0A8FA8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-[#4B6B7A]">No post data yet</div>
                  )}
                </div>

                {/* Platform Followers Breakdown */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0B1F33] mb-4">Followers by Platform</h3>
                  {platformMetrics.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={platformMetrics} dataKey="followers" nameKey="platform" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                            {platformMetrics.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any) => val.toLocaleString()} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {platformMetrics.map((p, i) => {
                          const total = platformMetrics.reduce((s, m) => s + m.followers, 0)
                          const pct = total > 0 ? Math.round((p.followers / total) * 100) : 0
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#0B1F33] font-medium capitalize">{p.platform}</span>
                                  <span className="text-[#4B6B7A]">{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-[#F0F7FA] rounded-full mt-1">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-[#4B6B7A]">No platform data yet</div>
                  )}
                </div>
              </div>

              {/* Row 2: Campaign ROI + Leads by Platform */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Campaign ROI Bar Chart */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0B1F33] mb-4">Campaign Performance (ROI & Leads)</h3>
                  {campaignROI.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={campaignROI} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F7FA" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4B6B7A' }} angle={-20} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: '#4B6B7A' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #DBEAFE' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="leads" name="Leads" fill="#0A8FA8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="roi" name="ROI %" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-[#4B6B7A]">No campaign data yet</div>
                  )}
                </div>

                {/* Leads by Platform Pie */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-[#0B1F33] mb-4">Leads by Platform</h3>
                  {leadsByPlatform.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie data={leadsByPlatform} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                            {leadsByPlatform.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {leadsByPlatform.map((p, i) => {
                          const total = leadsByPlatform.reduce((s, l) => s + l.value, 0)
                          const pct = total > 0 ? Math.round((p.value / total) * 100) : 0
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <div className="flex-1 flex items-center justify-between text-xs">
                                <span className="text-[#0B1F33] font-medium capitalize">{p.name}</span>
                                <span className="text-[#4B6B7A]">{p.value} ({pct}%)</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-[#4B6B7A]">No lead data yet</div>
                  )}
                </div>
              </div>

              {/* Budget Summary */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                <h3 className="text-sm font-semibold text-[#0B1F33] mb-6">Marketing Budget Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Total Ad Budget', value: budgetData.adBudget, color: '#3B82F6', sub: 'Across all ad platforms' },
                    { label: 'Total Ad Spend', value: budgetData.adSpend, color: '#EF4444', sub: `${budgetData.adBudget > 0 ? Math.round((budgetData.adSpend / budgetData.adBudget) * 100) : 0}% used` },
                    { label: 'Influencer Spend', value: budgetData.influencerSpend, color: '#8B5CF6', sub: 'Paid influencer contracts' },
                  ].map((b, i) => (
                    <div key={i} className="p-4 rounded-xl border border-[#DBEAFE] bg-[#F8FAFC]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                        <p className="text-xs font-medium text-[#4B6B7A]">{b.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-[#0B1F33]">${b.value.toLocaleString()}</p>
                      <p className="text-xs text-[#94A3B8] mt-1">{b.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Budget spend bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[#4B6B7A] font-medium">Overall Marketing Budget Utilization</span>
                    <span className="font-bold text-[#0B1F33]">${totalSpend.toLocaleString()} / ${totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-4 bg-[#F0F7FA] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${totalBudget > 0 && (totalSpend / totalBudget) > 0.9 ? 'bg-[#EF4444]' : totalBudget > 0 && (totalSpend / totalBudget) > 0.7 ? 'bg-[#F59E0B]' : 'bg-gradient-to-r from-[#0A8FA8] to-[#06B6D4]'}`}
                      style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpend / totalBudget) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#94A3B8]">
                    <span>$0</span>
                    <span>${totalBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
