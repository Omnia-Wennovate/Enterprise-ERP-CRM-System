'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Megaphone,
  Share2,
  PenTool,
  CalendarDays,
  Target,
  UserPlus,
  MessageCircle,
  Monitor,
  Star,
  Image as ImageIcon,
  Video,
  ClipboardList,
  Users,
  BarChart2,
  TrendingUp,
  Eye,
  MousePointerClick,
  Plus,
  Loader2,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  getDashboardStats,
  getPlatformMetrics,
  getMonthlyPostPerformance,
} from '@/lib/services/marketing-analytics'
import { getCampaigns } from '@/lib/services/campaigns'
import { getSocialPosts } from '@/lib/services/social-posts'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '@/types/marketing'
import type { MarketingDashboardStats, PlatformMetrics, SocialCampaign, SocialPost } from '@/types/marketing'

export default function MarketingDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<MarketingDashboardStats | null>(null)
  const [platforms, setPlatforms] = useState<PlatformMetrics[]>([])
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([])
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [s, pm, c, p] = await Promise.all([
        getDashboardStats().catch(() => null),
        getPlatformMetrics().catch(() => []),
        getCampaigns().catch(() => []),
        getSocialPosts().catch(() => []),
      ])
      if (s) setStats(s)
      setPlatforms(pm || [])
      setCampaigns(c || [])
      setRecentPosts((p || []).slice(0, 5))
    } catch (err) {
      console.error('Failed to load marketing dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const kpiCards = [
    {
      label: 'Total Followers',
      value: stats?.totalFollowers ? stats.totalFollowers.toLocaleString() : '0',
      change: 'OAuth connected accounts',
      icon: Users,
      color: '#3B82F6',
    },
    {
      label: 'Total Reach',
      value: stats?.totalReach ? stats.totalReach.toLocaleString() : '0',
      change: 'Across published posts',
      icon: Eye,
      color: '#10B981',
    },
    {
      label: 'Engagement Rate',
      value: `${stats?.engagementRate || 0}%`,
      change: `${stats?.totalImpressions ? stats.totalImpressions.toLocaleString() : 0} impressions`,
      icon: TrendingUp,
      color: '#8B5CF6',
    },
    {
      label: 'Leads Generated',
      value: stats?.newLeads ? stats.newLeads.toString() : '0',
      change: `${stats?.conversionRate || 0}% conversion`,
      icon: UserPlus,
      color: '#C8A951',
    },
    {
      label: 'Posts This Month',
      value: stats?.postsPublished ? stats.postsPublished.toString() : '0',
      change: `${stats?.scheduledPosts || 0} scheduled`,
      icon: PenTool,
      color: '#EC4899',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApproval ? stats.pendingApproval.toString() : '0',
      change: 'Content queue',
      icon: Clock,
      color: '#F59E0B',
    },
  ]

  const quickModules = [
    { label: 'Social Accounts', href: '/marketing/accounts', icon: Share2, desc: 'Connect & sync accounts', color: '#3B82F6' },
    { label: 'Create Content', href: '/marketing/content', icon: PenTool, desc: 'Draft & publish posts', color: '#EC4899' },
    { label: 'Content Calendar', href: '/marketing/calendar', icon: CalendarDays, desc: 'Schedule timeline', color: '#10B981' },
    { label: 'Campaigns', href: '/marketing/campaigns', icon: Target, desc: 'Manage marketing goals', color: '#8B5CF6' },
    { label: 'Social Leads', href: '/marketing/leads', icon: UserPlus, desc: 'Track prospect conversions', color: '#C8A951' },
    { label: 'Engagement', href: '/marketing/engagement', icon: MessageCircle, desc: 'Comments & direct messages', color: '#06B6D4' },
    { label: 'Ad Campaigns', href: '/marketing/ads', icon: Monitor, desc: 'Budget & ad management', color: '#EF4444' },
    { label: 'Influencers', href: '/marketing/influencers', icon: Star, desc: 'Partnerships & sponsorships', color: '#F59E0B' },
    { label: 'Media Library', href: '/marketing/media-library', icon: ImageIcon, desc: 'Photos, videos & logos', color: '#6366F1' },
    { label: 'Production', href: '/marketing/production-requests', icon: Video, desc: 'Shoot & video requests', color: '#14B8A6' },
    { label: 'Weekly Planner', href: '/marketing/weekly-planner', icon: ClipboardList, desc: 'Weekly schedule grid', color: '#84CC16' },
    { label: 'Analytics Reports', href: '/marketing/reports', icon: BarChart2, desc: 'In-depth KPI metrics', color: '#A855F7' },
  ]

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Megaphone className="text-omnia-gold w-7 h-7" />
            Marketing & Social Media Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Omnichannel management, campaign tracking, and content operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/marketing/accounts"
            className="px-4 py-2 text-sm font-medium border border-border bg-card hover:bg-muted text-foreground rounded-lg transition-colors flex items-center gap-2"
          >
            <Share2 size={16} />
            Accounts
          </Link>
          <Link
            href="/marketing/content"
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Post
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className="bg-card rounded-xl border border-border shadow-sm p-4 hover:border-omnia-gold/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${kpi.color}15` }}
                >
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground tracking-tight">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{kpi.change}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Access Modules */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles size={18} className="text-omnia-gold" />
            Social Media Team Modules
          </h2>
          <span className="text-xs text-muted-foreground">Click any module to navigate</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {quickModules.map((mod) => {
            const Icon = mod.icon
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="flex flex-col items-start p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background hover:border-omnia-gold/60 transition-all group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${mod.color}15` }}
                >
                  <Icon size={18} style={{ color: mod.color }} />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-omnia-gold transition-colors">
                  {mod.label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                  {mod.desc}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Two Column Layout: Recent Posts & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <PenTool size={18} className="text-primary" />
              Recent Content
            </h2>
            <Link
              href="/marketing/content"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-muted-foreground">No posts created yet</p>
              <Link
                href="/marketing/content"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 hover:underline"
              >
                <Plus size={12} /> Create first post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => {
                const statusColorMap: Record<string, string> = {
                  published: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
                  pending_approval: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                  draft: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
                }
                return (
                  <div
                    key={post.id}
                    className="p-3 rounded-xl border border-border bg-background/50 hover:bg-background transition-all flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {post.caption || 'Untitled Post'}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                        <span className="capitalize">{post.content_type}</span>
                        <span>•</span>
                        <span>
                          {post.scheduled_for
                            ? `Scheduled: ${new Date(post.scheduled_for).toLocaleDateString()}`
                            : post.published_at
                              ? `Published: ${new Date(post.published_at).toLocaleDateString()}`
                              : `Created: ${new Date(post.created_at).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        statusColorMap[post.status] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {post.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Active Campaigns */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Target size={18} className="text-purple-500" />
              Active Campaigns
            </h2>
            <Link
              href="/marketing/campaigns"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </div>

          {campaigns.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-muted-foreground">No active campaigns</p>
              <Link
                href="/marketing/campaigns"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 hover:underline"
              >
                <Plus size={12} /> Launch a campaign
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 4).map((camp) => (
                <div
                  key={camp.id}
                  className="p-3.5 rounded-xl border border-border bg-background/50 hover:bg-background transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{camp.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-medium capitalize">
                      {camp.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                    <div>
                      <span>Budget: </span>
                      <span className="font-semibold text-foreground">
                        ${camp.budget?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div>
                      <span>Leads: </span>
                      <span className="font-semibold text-foreground">
                        {camp.actual_leads || 0} / {camp.expected_leads || 0}
                      </span>
                    </div>
                    <div>
                      <span>ROI: </span>
                      <span className="font-semibold text-emerald-600">
                        {camp.roi ? `${camp.roi}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
