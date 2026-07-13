import { createClient } from '@/lib/supabase/client'
import type { ContentProductionRequest, ProductionStatus } from '@/types/marketing'


// ============================================================================
// CONTENT PRODUCTION REQUESTS CRUD
// ============================================================================

export async function getProductionRequests(filters?: {
  status?: string
  requesting_department?: string
  campaign_id?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('content_production_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.requesting_department) query = query.eq('requesting_department', filters.requesting_department)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)

  const { data, error } = await query
  if (error) throw error
  return data as ContentProductionRequest[]
}

export async function getProductionRequestById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_production_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ContentProductionRequest
}

export async function createProductionRequest(request: Partial<ContentProductionRequest>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_production_requests')
    .insert({
      ...request,
      status: 'requested',
      completion_percent: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as ContentProductionRequest
}

export async function updateProductionRequest(id: string, updates: Partial<ContentProductionRequest>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_production_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ContentProductionRequest
}

export async function deleteProductionRequest(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('content_production_requests')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// WORKFLOW STATUS PROGRESSION
// Requested → Planning → Approved → Recording → Editing → Review → Scheduled → Published → Archived
// ============================================================================

const PRODUCTION_WORKFLOW: ProductionStatus[] = [
  'requested', 'planning', 'approved', 'recording', 'editing', 'review', 'scheduled', 'published', 'archived'
]

const STATUS_COMPLETION: Record<ProductionStatus, number> = {
  requested: 0,
  planning: 10,
  approved: 20,
  recording: 40,
  editing: 60,
  review: 75,
  scheduled: 85,
  published: 100,
  archived: 100,
}

export async function advanceProductionStatus(id: string) {
  const supabase = createClient()
  const request = await getProductionRequestById(id)
  const currentIndex = PRODUCTION_WORKFLOW.indexOf(request.status as ProductionStatus)

  if (currentIndex === -1 || currentIndex >= PRODUCTION_WORKFLOW.length - 1) {
    throw new Error('Cannot advance status further')
  }

  const nextStatus = PRODUCTION_WORKFLOW[currentIndex + 1]
  return updateProductionRequest(id, {
    status: nextStatus,
    completion_percent: STATUS_COMPLETION[nextStatus],
  })
}

export async function setProductionStatus(id: string, status: ProductionStatus) {
  const supabase = createClient()
  return updateProductionRequest(id, {
    status,
    completion_percent: STATUS_COMPLETION[status],
  })
}

export async function getProductionCountsByStatus() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_production_requests')
    .select('status')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1
  })
  return counts
}

export async function getRequestsByAssignedTeamMember(employeeId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_production_requests')
    .select('*')
    .or(`camera_operator_id.eq.${employeeId},video_editor_id.eq.${employeeId},photographer_id.eq.${employeeId},presenter_id.eq.${employeeId}`)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as ContentProductionRequest[]
}
