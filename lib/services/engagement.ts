import { createClient } from '@/lib/supabase/client'
import type { SocialComment, SocialMessage } from '@/types/marketing'


// ============================================================================
// COMMENTS
// ============================================================================

export async function getComments(filters?: {
  account_id?: string
  post_id?: string
  is_replied?: boolean
  sentiment?: string
  priority?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('social_comments')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.account_id) query = query.eq('account_id', filters.account_id)
  if (filters?.post_id) query = query.eq('post_id', filters.post_id)
  if (filters?.is_replied !== undefined) query = query.eq('is_replied', filters.is_replied)
  if (filters?.sentiment) query = query.eq('sentiment', filters.sentiment)
  if (filters?.priority) query = query.eq('priority', filters.priority)

  const { data, error } = await query
  if (error) throw error
  return data as SocialComment[]
}

export async function createComment(comment: Partial<SocialComment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_comments')
    .insert(comment)
    .select()
    .single()

  if (error) throw error
  return data as SocialComment
}

export async function replyToComment(commentId: string, replyContent: string, repliedBy: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_comments')
    .update({
      is_replied: true,
      replied_by: repliedBy,
      replied_at: new Date().toISOString(),
      reply_content: replyContent,
    })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data as SocialComment
}

export async function updateCommentSentiment(commentId: string, sentiment: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_comments')
    .update({ sentiment })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data as SocialComment
}

export async function updateCommentPriority(commentId: string, priority: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_comments')
    .update({ priority })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data as SocialComment
}

export async function getUnansweredCommentsCount() {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('social_comments')
    .select('*', { count: 'exact', head: true })
    .eq('is_replied', false)

  if (error) throw error
  return count || 0
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function getMessages(filters?: {
  account_id?: string
  is_answered?: boolean
}) {
  const supabase = createClient()
  let query = supabase
    .from('social_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.account_id) query = query.eq('account_id', filters.account_id)
  if (filters?.is_answered !== undefined) query = query.eq('is_answered', filters.is_answered)

  const { data, error } = await query
  if (error) throw error
  return data as SocialMessage[]
}

export async function createMessage(message: Partial<SocialMessage>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data as SocialMessage
}

export async function answerMessage(messageId: string, responseContent: string, answeredBy: string) {
  const supabase = createClient()
  const message = await getMessageById(messageId)
  const createdAt = new Date(message.created_at)
  const now = new Date()
  const responseTimeMinutes = Math.round((now.getTime() - createdAt.getTime()) / 60000)

  const { data, error } = await supabase
    .from('social_messages')
    .update({
      is_answered: true,
      answered_by: answeredBy,
      response_content: responseContent,
      response_time_minutes: responseTimeMinutes,
    })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data as SocialMessage
}

export async function getMessageById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_messages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SocialMessage
}

export async function getUnansweredMessagesCount() {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('social_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_answered', false)

  if (error) throw error
  return count || 0
}

export async function getAverageResponseTime() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('social_messages')
    .select('response_time_minutes')
    .eq('is_answered', true)
    .not('response_time_minutes', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return 0

  const total = data.reduce((sum, m) => sum + (m.response_time_minutes || 0), 0)
  return Math.round(total / data.length)
}

// ============================================================================
// ENGAGEMENT STATS
// ============================================================================

export async function getEngagementStats() {
  const supabase = createClient()
  const [unansweredComments, unansweredMessages, avgResponseTime] = await Promise.all([
    getUnansweredCommentsCount(),
    getUnansweredMessagesCount(),
    getAverageResponseTime(),
  ])

  const { count: totalComments } = await supabase
    .from('social_comments')
    .select('*', { count: 'exact', head: true })

  const { count: totalMessages } = await supabase
    .from('social_messages')
    .select('*', { count: 'exact', head: true })

  return {
    totalComments: totalComments || 0,
    totalMessages: totalMessages || 0,
    unansweredComments,
    unansweredMessages,
    avgResponseTime,
  }
}
