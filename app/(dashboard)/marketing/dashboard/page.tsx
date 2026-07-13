'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import type { MarketingDashboardStats } from '@/types/marketing'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import { Loader2, Users, Eye, BarChart3, MousePointerClick, Target, UserPlus, TrendingUp, Award, Calendar, Clock, Send, Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getDashboardStats, getPlatformMetrics, getFollowersGrowth, getCampaignROIData } from '@/lib/services/marketing-analytics'
import { getTopPerformingPosts } from '@/lib/services/social-posts'

export default function MarketingDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<MarketingDashboardStats | null>(null)
  const [platformData, setPlatformData] = useState<any[]>([])
  const [topPosts, setTopPosts] = useState<any[]>([])
  const [campaignROI, setCampaignROI] = useState<any[]>([])

  useEffect(() => {
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) { router.push('/login'); return }
    try {
      setProfile(JSON.parse(authUser))
    } catch { router.push('/login') }
  }, [router])

  useEffect(() => {
    if (!profile) return
    loadData()
  }, [profile])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [s, pm, tp, roi] = await Promise.all([
        getDashboardStats(),
        getPlatformMetrics(),
        getTopPerformingPosts(5),
        getCampaignROIData(),
      ])
      setStats(s)
      setPlatformData(pm)
      setTopPosts(tp)
      setCampaignROI(roi)
    } catch (err) {
      console.error('Failed to load marketing dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!profile) return null

  const statCards = [
    { icon: Users, label: 'Total Followers', value: stats?.totalFollowers?.toLocaleString() || '0', color: '#3B82F6', trend: 12 },
    { icon: Eye, label: 'Total Reach', value: stats?.totalReach?.toLocaleString() || '0', color: '#10B981', trend: 8 },
    { icon: BarChart3, label: 'Total Impressions', value: stats?.totalImpressions?.toLocaleString() || '0', color: '#8B5CF6', trend: 15 },
    { icon: MousePointerClick, label: 'Engagement Rate', value: `${stats?.engagementRate || 0}%`, color: '#F59E0B', trend: 3 },
    { icon: Target, label: 'Click Through Rate', value: `${stats?.clickThroughRate || 0}%`, color: '#0A8FA8', trend: 5 },
    { icon: TrendingUp, label: 'Conversion Rate', value: `${stats?.conversionRate || 0}%`, color: '#EF4444', trend: -2 },
    { icon: UserPlus, label: 'New Leads', value: stats?.newLeads?.toString() || '0', color: '#06B6D4', trend: 18 },
    { icon: Award, label: 'Campaign ROI', value: `${stats?.campaignPerformance || 0}%`, color: '#22C55E', trend: 7 },
  ]

  const postCards = [
    { icon: Send, label: 'Published This Month', value: stats?.postsPublished?.toString() || '0', color: '#22C55E' },
    { icon: Clock, label: 'Scheduled Posts', value: stats?.scheduledPosts?.toString() || '0', color: '#3B82F6' },
    { icon: Calendar, label: 'Pending Approval', value: stats?.pendingApproval?.toString() || '0', color: '#F59E0B' },
    { icon: Star, label: 'Best Platform', value: stats?.bestPlatform || 'N/A', color: '#8B5CF6' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0B1F33]">Marketing Dashboard</h1>
                <p className="text-sm text-[#4B6B7A] mt-1">Social media performance overview and analytics</p>
              </div>

              {/* KPI Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, i) => {
                  const Icon = card.icon
                  const isPositive = card.trend >= 0
                  return (
                    <div key={i} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm hover:shadow-md transition-all p-5">
                      <div className="w-full h-1 -mx-5 -mt-5 mb-4 rounded-t-xl" style={{ backgroundColor: card.color }} />
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-[#4B6B7A] font-medium">{card.label}</p>
                          <p className="text-xl font-bold text-[#0B1F33] mt-1">{card.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            {isPositive ? (
                              <ArrowUpRight size={14} className="text-[#10B981]" />
                            ) : (
                              <ArrowDownRight size={14} className="text-[#EF4444]" />
                            )}
                            <span className={`text-xs font-medium ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              {card.trend > 0 ? '+' : ''}{card.trend}%
                            </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                          <Icon size={20} style={{ color: card.color }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Content Stats + Platform Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Post Stats */}
                <div className="lg:col-span-1 grid grid-cols-2 gap-4">
                  {postCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                      <div key={i} className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-4">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${card.color}15` }}>
                          <Icon size={16} style={{ color: card.color }} />
                        </div>
                        <p className="text-xs text-[#4B6B7A]">{card.label}</p>
                        <p className="text-lg font-bold text-[#0B1F33] mt-1">{card.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Platform Comparison Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-6">Platform Comparison</h3>
                  {platformData.length > 0 ? (
                    <div className="space-y-4">
                      {platformData.map((p: any, i: number) => {
                        const maxFollowers = Math.max(...platformData.map((d: any) => d.followers))
                        const width = maxFollowers > 0 ? (p.followers / maxFollowers) * 100 : 0
                        const color = PLATFORM_COLORS[p.platform as keyof typeof PLATFORM_COLORS] || '#6B7280'
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-[#0B1F33]">
                                {PLATFORM_LABELS[p.platform as keyof typeof PLATFORM_LABELS] || p.platform}
                              </span>
                              <div className="flex items-center gap-4 text-xs text-[#4B6B7A]">
                                <span>{p.followers.toLocaleString()} followers</span>
                                <span>{p.posts} posts</span>
                              </div>
                            </div>
                            <div className="w-full h-3 bg-[#F0F7FA] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${width}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-[#4B6B7A] text-sm">
                      No platform data yet. Connect your social accounts to see metrics.
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign ROI + Top Performing Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Campaign ROI */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-6">Campaign ROI</h3>
                  {campaignROI.length > 0 ? (
                    <div className="space-y-4">
                      {campaignROI.map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#F0F7FA] rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B1F33] truncate">{c.name}</p>
                            <p className="text-xs text-[#4B6B7A]">Budget: ${c.budget.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#0B1F33]">{c.leads} leads</p>
                            <p className={`text-xs font-medium ${c.roi >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                              ROI: {c.roi}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-[#4B6B7A] text-sm">
                      No campaign data yet. Create campaigns to track ROI.
                    </div>
                  )}
                </div>

                {/* Best Performing Content */}
                <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                  <h3 className="font-semibold text-[#0B1F33] mb-6">🏆 Best Performing Content</h3>
                  {topPosts.length > 0 ? (
                    <div className="space-y-3">
                      {topPosts.map((post: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gradient-to-r from-[#F0F7FA] to-white rounded-lg border border-[#DBEAFE]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0A8FA8] to-[#06B6D4] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            #{i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0B1F33] truncate">
                              {post.caption || 'Untitled Post'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-[#4B6B7A]">👁 {post.reach_count?.toLocaleString() || 0}</span>
                              <span className="text-xs text-[#4B6B7A]">❤️ {post.engagement_count?.toLocaleString() || 0}</span>
                              <span className="text-xs text-[#4B6B7A]">🔗 {post.clicks_count?.toLocaleString() || 0}</span>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981] font-medium flex-shrink-0">
                            Top ⚡
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-[#4B6B7A] text-sm">
                      No top-performing content yet. Publish posts and track engagement.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-[#DBEAFE] shadow-sm p-6">
                <h3 className="font-semibold text-[#0B1F33] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    { label: 'New Post', href: '/marketing/content', emoji: '✏️' },
                    { label: 'New Campaign', href: '/marketing/campaigns', emoji: '🎯' },
                    { label: 'View Calendar', href: '/marketing/calendar', emoji: '📅' },
                    { label: 'Manage Leads', href: '/marketing/leads', emoji: '👥' },
                    { label: 'View Ads', href: '/marketing/ads', emoji: '📊' },
                    { label: 'Media Library', href: '/marketing/media-library', emoji: '🖼️' },
                    { label: 'Reports', href: '/marketing/reports', emoji: '📈' },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => router.push(action.href)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#DBEAFE] hover:border-[#0A8FA8] hover:shadow-md transition-all"
                    >
                      <span className="text-2xl">{action.emoji}</span>
                      <span className="text-xs font-medium text-[#0B1F33]">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
