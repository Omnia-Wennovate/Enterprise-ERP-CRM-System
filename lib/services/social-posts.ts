import { createClient } from '@/lib/supabase/client'
import type { SocialPost } from '@/types/marketing'


// ============================================================================
// SOCIAL POSTS CRUD
// ============================================================================

export async function getSocialPosts(filters?: {
  status?: string
  account_id?: string
  campaign_id?: string
  created_by?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('social_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.account_id) query = query.eq('account_id', filters.account_id)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
  if (filters?.created_by) query = query.eq('created_by', filters.created_by)

  const { data, error } = await query
  if (error) throw error
  return data as SocialPost[]
}

export async function getSocialPostById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialPost
}

export async function createSocialPost(post: Partial<SocialPost>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      ...post,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data as SocialPost
}

export async function updateSocialPost(id: string, updates: Partial<SocialPost>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SocialPost
}

export async function deleteSocialPost(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

export async function submitForApproval(postId: string) {
  const supabase = createClient()
  return updateSocialPost(postId, { status: 'pending_approval' })
}

export async function approvePost(postId: string, approverId: string) {
  const supabase = createClient()
  return updateSocialPost(postId, {
    status: 'approved',
    approved_by: approverId,
  })
}

export async function rejectPost(postId: string) {
  const supabase = createClient()
  return updateSocialPost(postId, { status: 'rejected' })
}

export async function schedulePost(postId: string, scheduledFor: string) {
  const supabase = createClient()
  const post = await updateSocialPost(postId, {
    status: 'scheduled',
    scheduled_for: scheduledFor,
  })

  // Create scheduled_posts entry
  await supabase.from('scheduled_posts').insert({
    post_id: postId,
    scheduled_datetime: scheduledFor,
    status: 'pending',
  })

  return post
}

export async function publishPost(postId: string) {
  const supabase = createClient()
  return updateSocialPost(postId, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
}

export async function archivePost(postId: string) {
  const supabase = createClient()
  return updateSocialPost(postId, { status: 'archived' })
}

// ============================================================================
// ENGAGEMENT METRICS & TOP-PERFORMING DETECTION
// ============================================================================

export async function updatePostMetrics(postId: string, metrics: {
  engagement_count?: number
  reach_count?: number
  impressions_count?: number
  likes_count?: number
  shares_count?: number
  comments_count?: number
  clicks_count?: number
}) {
  const supabase = createClient()
  const post = await updateSocialPost(postId, metrics)

  // Check if top-performing (Section 20: Content Performance Feedback Loop)
  if (metrics.engagement_count !== undefined) {
    await checkTopPerforming(postId, metrics.engagement_count)
  }

  return post
}

async function checkTopPerforming(postId: string, engagementCount: number) {
  const supabase = createClient()
  // Get 30-day average engagement for the account
  const post = await getSocialPostById(postId)
  if (!post.account_id) return

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentPosts, error } = await supabase
    .from('social_posts')
    .select('engagement_count')
    .eq('account_id', post.account_id)
    .eq('status', 'published')
    .gte('published_at', thirtyDaysAgo.toISOString())

  if (error || !recentPosts || recentPosts.length === 0) return

  const avgEngagement = recentPosts.reduce((sum, p) => sum + (p.engagement_count || 0), 0) / recentPosts.length
  const threshold = avgEngagement * 1.5 // 50% above average

  if (engagementCount > threshold && !post.is_top_performing) {
    // Flag as top performing
    await supabase
      .from('social_posts')
      .update({ is_top_performing: true })
      .eq('id', postId)

    // Create announcement for Company News Feed (reusing Phase 6 announcements)
    await supabase.from('announcements').insert({
      title: '🏆 Major Content Win!',
      content: `Post "${post.caption?.substring(0, 100) || 'Untitled'}" has exceeded engagement expectations by ${Math.round(((engagementCount / avgEngagement) - 1) * 100)}%! Great work from the social media team.`,
      priority: 'normal',
      category: 'general',
      target_roles: ['super_admin', 'admin', 'sales_agent', 'operations'],
      is_draft: false,
      published_at: new Date().toISOString(),
    })
  }
}

export async function getTopPerformingPosts(limit: number = 5) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('is_top_performing', true)
    .eq('status', 'published')
    .order('engagement_count', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as SocialPost[]
}

export async function getPostsByDateRange(startDate: string, endDate: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .gte('scheduled_for', startDate)
    .lte('scheduled_for', endDate)
    .order('scheduled_for', { ascending: true })

  if (error) throw error
  return data as SocialPost[]
}

export async function getPostCountsByStatus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_posts')
    .select('status')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(p => {
    counts[p.status] = (counts[p.status] || 0) + 1
  })
  return counts
}
