import { createClient } from '@/lib/supabase/client'
import type { MarketingDashboardStats, PlatformMetrics, ChartDataPoint } from '@/types/marketing'


// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(): Promise<MarketingDashboardStats> {
  const supabase = createClient()
  // Total followers from all connected accounts
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('followers_count, platform')
    .eq('status', 'connected')

  const totalFollowers = (accounts || []).reduce((sum, a) => sum + (a.followers_count || 0), 0)

  // Post metrics
  const { data: posts } = await supabase
    .from('social_posts')
    .select('reach_count, impressions_count, engagement_count, clicks_count, status, is_top_performing, caption')
    .eq('status', 'published')

  const totalReach = (posts || []).reduce((sum, p) => sum + (p.reach_count || 0), 0)
  const totalImpressions = (posts || []).reduce((sum, p) => sum + (p.impressions_count || 0), 0)
  const totalEngagement = (posts || []).reduce((sum, p) => sum + (p.engagement_count || 0), 0)
  const totalClicks = (posts || []).reduce((sum, p) => sum + (p.clicks_count || 0), 0)

  const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0
  const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  // Leads
  const { count: newLeads } = await supabase
    .from('social_leads')
    .select('*', { count: 'exact', head: true })

  const { count: convertedLeads } = await supabase
    .from('social_leads')
    .select('*', { count: 'exact', head: true })
    .eq('converted', true)

  const conversionRate = (newLeads || 0) > 0 ? ((convertedLeads || 0) / (newLeads || 0)) * 100 : 0

  // Campaign performance
  const { data: campaigns } = await supabase
    .from('social_campaigns')
    .select('roi')
    .eq('status', 'active')

  const avgROI = (campaigns || []).length > 0
    ? (campaigns || []).reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns!.length
    : 0

  // Posts this month
  const firstOfMonth = new Date()
  firstOfMonth.setDate(1)
  firstOfMonth.setHours(0, 0, 0, 0)

  const { count: postsPublished } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', firstOfMonth.toISOString())

  const { count: scheduledPosts } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')

  const { count: pendingApproval } = await supabase
    .from('social_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_approval')

  // Best platform by engagement
  const platformEngagement: Record<string, number> = {}
  if (accounts && posts) {
    // simplified: count posts per platform via accounts
    for (const account of accounts) {
      platformEngagement[account.platform] = (platformEngagement[account.platform] || 0) + account.followers_count
    }
  }
  const bestPlatform = Object.entries(platformEngagement).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Best content
  const topPost = (posts || []).find(p => p.is_top_performing)
  const bestContent = topPost?.caption?.substring(0, 50) || 'N/A'

  return {
    totalFollowers,
    totalReach,
    totalImpressions,
    engagementRate: Math.round(engagementRate * 100) / 100,
    clickThroughRate: Math.round(clickThroughRate * 100) / 100,
    conversionRate: Math.round(conversionRate * 100) / 100,
    newLeads: newLeads || 0,
    campaignPerformance: Math.round(avgROI * 100) / 100,
    bestPlatform,
    bestContent,
    postsPublished: postsPublished || 0,
    scheduledPosts: scheduledPosts || 0,
    pendingApproval: pendingApproval || 0,
    topEmployee: 'N/A',
  }
}

// ============================================================================
// PLATFORM METRICS
// ============================================================================

export async function getPlatformMetrics(): Promise<PlatformMetrics[]> {
  const supabase = createClient()
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('id, platform, followers_count')
    .eq('status', 'connected')

  if (!accounts || accounts.length === 0) return []

  const metrics: Record<string, PlatformMetrics> = {}

  for (const account of accounts) {
    if (!metrics[account.platform]) {
      metrics[account.platform] = {
        platform: account.platform,
        followers: 0,
        engagement: 0,
        reach: 0,
        posts: 0,
      }
    }
    metrics[account.platform].followers += account.followers_count || 0

    // Get post counts for this account
    const { count } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id)
      .eq('status', 'published')

    metrics[account.platform].posts += count || 0
  }

  return Object.values(metrics)
}

// ============================================================================
// CHART DATA
// ============================================================================

export async function getFollowersGrowth(): Promise<ChartDataPoint[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('social_accounts')
    .select('platform, followers_count')
    .eq('status', 'connected')

  if (!data) return []

  return data.map(a => ({
    label: a.platform,
    value: a.followers_count || 0,
  }))
}

export async function getMonthlyPostPerformance(): Promise<ChartDataPoint[]> {
  const supabase = createClient()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString(),
    })
  }

  const results: ChartDataPoint[] = []
  for (const month of months) {
    const { count } = await supabase
      .from('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', month.start)
      .lte('published_at', month.end)

    results.push({ label: month.label, value: count || 0 })
  }

  return results
}

export async function getCampaignROIData() {
  const supabase = createClient()
  const { data } = await supabase
    .from('social_campaigns')
    .select('name, budget, actual_leads, roi')
    .in('status', ['active', 'completed'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (!data) return []

  return data.map(c => ({
    name: c.name,
    budget: c.budget || 0,
    leads: c.actual_leads || 0,
    roi: c.roi || 0,
  }))
}

export async function getLeadConversionData() {
  const supabase = createClient()
  const { data } = await supabase
    .from('social_leads')
    .select('platform, converted')

  if (!data) return []

  const platformData: Record<string, { total: number; converted: number }> = {}
  data.forEach(l => {
    if (!platformData[l.platform]) {
      platformData[l.platform] = { total: 0, converted: 0 }
    }
    platformData[l.platform].total++
    if (l.converted) platformData[l.platform].converted++
  })

  return Object.entries(platformData).map(([platform, d]) => ({
    label: platform,
    value: d.total,
    value2: d.converted,
  }))
}

// ============================================================================
// EMPLOYEE CONTENT STATUS
// ============================================================================

export async function getEmployeeContentStatuses() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('employee_content_status')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateEmployeeContentStatus(
  employeeId: string,
  status: string,
  currentTask?: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('employee_content_status')
    .upsert({
      employee_id: employeeId,
      current_status: status,
      current_task: currentTask || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSocialMediaTeam() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, position, department, employment_status, avatar_url')
    .eq('department', 'social_media')
    .eq('is_active', true)
    .order('first_name', { ascending: true })

  if (error) throw error
  return data || []
}
