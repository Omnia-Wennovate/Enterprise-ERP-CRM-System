import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { FeatureRequest, FeatureRequestComment } from '@/types/tech'

// ============================================================================
// FEATURE REQUEST CRUD
// ============================================================================

export async function getFeatureRequests(filters?: {
  status?: string
  department?: string
  priority?: string
  search?: string
  requested_by?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('feature_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.department && filters.department !== 'all') {
    query = query.eq('department', filters.department)
  }
  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters?.requested_by) {
    query = query.eq('requested_by', filters.requested_by)
  }

  const { data, error } = await query
  if (error) throw error

  // Enrich with names
  return enrichFeatureRequestsWithNames(data || [])
}

async function enrichFeatureRequestsWithNames(requests: any[]) {
  if (requests.length === 0) return requests
  const supabase = createClient()

  const allIds = new Set<string>()
  requests.forEach((r) => {
    if (r.requested_by) allIds.add(r.requested_by)
    if (r.assigned_developer) allIds.add(r.assigned_developer)
    if (r.approved_by) allIds.add(r.approved_by)
  })

  if (allIds.size === 0) return requests

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', Array.from(allIds))

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const getName = (id: string | null) => {
    if (!id) return null
    const p = profileMap.get(id)
    return p ? `${p.first_name} ${p.last_name}` : null
  }

  return requests.map((r) => ({
    ...r,
    requested_by_name: getName(r.requested_by),
    assigned_developer_name: getName(r.assigned_developer),
    approved_by_name: getName(r.approved_by),
  })) as FeatureRequest[]
}

export async function getFeatureRequestById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  const enriched = await enrichFeatureRequestsWithNames([data])
  return enriched[0] as FeatureRequest
}

export async function createFeatureRequest(
  request: Partial<FeatureRequest>,
  userId: string
) {
  const supabase = createClient()

  // Auto-create a linked conversation for the discussion thread
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      type: 'feature_request',
      title: `Feature Request: ${request.title}`,
      created_by: userId,
    })
    .select()
    .single()

  if (convError) {
    console.error('Failed to create conversation for feature request:', convError)
  }

  // Add the requester as a conversation member
  if (conversation) {
    await supabase.from('conversation_members').insert({
      conversation_id: conversation.id,
      profile_id: userId,
      role: 'member',
    })
  }

  const { data, error } = await supabase
    .from('feature_requests')
    .insert({
      ...request,
      requested_by: userId,
      requested_date: new Date().toISOString().split('T')[0],
      conversation_id: conversation?.id || null,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'feature_requests', data.id, userId, null, data)

  return data as FeatureRequest
}

export async function updateFeatureRequest(
  id: string,
  updates: Partial<FeatureRequest>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('feature_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'feature_requests', id, userId, oldData, data)

  return data as FeatureRequest
}

// ============================================================================
// FEATURE REQUEST WORKFLOW
// ============================================================================

export async function approveFeatureRequest(id: string, approvedBy: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('feature_requests')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('APPROVE', 'feature_requests', id, approvedBy, oldData, data)

  return data as FeatureRequest
}

export async function rejectFeatureRequest(id: string, rejectedBy: string, notes?: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('feature_requests')
    .update({
      status: 'rejected',
      approved_by: rejectedBy,
      notes: notes || oldData?.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('REJECT', 'feature_requests', id, rejectedBy, oldData, data)

  return data as FeatureRequest
}

export async function assignDeveloper(
  id: string,
  developerId: string,
  assignedBy: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('feature_requests')
    .update({
      assigned_developer: developerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('ASSIGN', 'feature_requests', id, assignedBy, oldData, data)

  return data as FeatureRequest
}

export async function updateFeatureRequestStatus(
  id: string,
  status: string,
  userId: string
) {
  return updateFeatureRequest(id, { status: status as any }, userId)
}

// ============================================================================
// FEATURE REQUEST COMMENTS
// ============================================================================

export async function getFeatureRequestComments(featureRequestId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_request_comments')
    .select('*')
    .eq('feature_request_id', featureRequestId)
    .order('created_at', { ascending: true })

  if (error) throw error

  if (data && data.length > 0) {
    const authorIds = [...new Set(data.map((c: any) => c.author_id).filter(Boolean))]
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      return data.map((c: any) => ({
        ...c,
        author_name: profileMap.get(c.author_id)
          ? `${profileMap.get(c.author_id)?.first_name} ${profileMap.get(c.author_id)?.last_name}`
          : 'Unknown',
        author_avatar: profileMap.get(c.author_id)?.avatar_url || null,
      }))
    }
  }

  return data || []
}

export async function addFeatureRequestComment(
  featureRequestId: string,
  authorId: string,
  content: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_request_comments')
    .insert({
      feature_request_id: featureRequestId,
      author_id: authorId,
      content,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('INSERT', 'feature_request_comments', data.id, authorId, null, data)

  return data as FeatureRequestComment
}

// ============================================================================
// FEATURE REQUEST ATTACHMENTS
// ============================================================================

export async function getFeatureRequestAttachments(featureRequestId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_request_attachments')
    .select('*')
    .eq('feature_request_id', featureRequestId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addFeatureRequestAttachment(
  featureRequestId: string,
  fileName: string,
  fileUrl: string,
  uploadedBy: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('feature_request_attachments')
    .insert({
      feature_request_id: featureRequestId,
      file_name: fileName,
      file_url: fileUrl,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// FEATURE REQUEST DASHBOARD STATS
// ============================================================================

export async function getFeatureRequestStats() {
  const supabase = createClient()

  const [total, pending, inDev, testing, completed, rejected] = await Promise.all([
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }),
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }).eq('status', 'requested'),
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }).eq('status', 'development'),
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }).eq('status', 'testing'),
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('feature_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ])

  // Department request breakdown
  const { data: deptData } = await supabase
    .from('feature_requests')
    .select('department')

  const deptCounts: Record<string, number> = {}
  ;(deptData || []).forEach((r: any) => {
    deptCounts[r.department] = (deptCounts[r.department] || 0) + 1
  })

  return {
    total: total.count || 0,
    pending: pending.count || 0,
    inDevelopment: inDev.count || 0,
    testing: testing.count || 0,
    completed: completed.count || 0,
    rejected: rejected.count || 0,
    departmentBreakdown: deptCounts,
  }
}
