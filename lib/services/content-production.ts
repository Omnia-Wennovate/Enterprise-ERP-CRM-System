import { createClient } from '@/lib/supabase/client'
import type { ContentProductionRequest, ProductionStatus } from '@/types/marketing'

// ============================================================================
// CONTENT PRODUCTION REQUESTS CRUD
// ============================================================================

/** Resolve a display name from profile row, handling the generic 'User' placeholder */
function resolveFullName(p: { first_name?: string | null; last_name?: string | null; email?: string | null }): string {
  const KNOWN: Record<string, string> = {
    'davidbezuneh@gmail.com': 'David Bezuneh',
    'belenwolde2@gmail.com': 'Belen Wolde',
    'bekan.bekele74@gmail.com': 'Bekan Bekele',
    'kalkidantesfaye21971@gmail.com': 'Kalkidan Tesfaye',
    'nurfaris08@gmail.com': 'Nur Faris',
    'alaminfsiraj@gmail.com': 'Alamin Siraj',
    'melika.wennovate@gmail.com': 'Melika Wennovate',
    'zuludalo98@gmail.com': 'Zulu Dalo',
    'admin@omniatravel.com': 'Omnia Admin',
    'marketing@omniatravel.com': 'Marketing Team',
  }
  const email = (p.email || '').toLowerCase().trim()
  const isGeneric = !p.first_name || p.first_name.trim().toLowerCase() === 'user'
  if (!isGeneric) {
    return `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Team Member'
  }
  if (KNOWN[email]) return KNOWN[email]
  const local = email.split('@')[0] || ''
  const words = local.replace(/\d+/g, '').replace(/[._\-+]/g, ' ').trim()
    .split(/\s+/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
  return words.join(' ') || email || 'Team Member'
}

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

  // Resolve assignee names and requester name for each request
  const result = await Promise.all((data || []).map(async (req: any) => {
    const assignedTeamIds: string[] = req.assigned_team || []
    let assigneeProfiles: Array<{ id: string; full_name: string; position?: string | null }> = []

    if (assignedTeamIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, position')
        .in('id', assignedTeamIds)
      assigneeProfiles = (profiles || []).map((p: any) => ({
        id: p.id,
        full_name: resolveFullName(p),
        position: p.position || null,
      }))
    }

    let requesterName: string | null = null
    if (req.requested_by) {
      const { data: rp } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', req.requested_by)
        .single()
      if (rp) requesterName = resolveFullName(rp)
    }

    return {
      ...req,
      assigneeProfiles,
      requesterName,
    }
  }))

  return result
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

export async function createProductionRequest(
  request: Partial<ContentProductionRequest> & { assigneeIds?: string[] }
) {
  const supabase = createClient()
  const { assigneeIds, ...rest } = request

  // Merge assigneeIds into assigned_team (uuid[]) — deduplicated
  const assignedTeam: string[] = []
  if (assigneeIds && assigneeIds.length > 0) {
    for (const id of assigneeIds) {
      if (id && !assignedTeam.includes(id)) assignedTeam.push(id)
    }
  } else if (rest.assigned_team && rest.assigned_team.length > 0) {
    assignedTeam.push(...rest.assigned_team)
  }

  const { data, error } = await supabase
    .from('content_production_requests')
    .insert({
      ...rest,
      assigned_team: assignedTeam,
      status: 'requested',
      completion_percent: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as ContentProductionRequest
}

export async function updateProductionRequest(
  id: string,
  updates: Partial<ContentProductionRequest> & { assigneeIds?: string[] }
) {
  const supabase = createClient()
  const { assigneeIds, ...rest } = updates

  const payload: any = {
    ...rest,
    updated_at: new Date().toISOString(),
  }

  // If assigneeIds provided, update assigned_team column (uuid[])
  if (assigneeIds !== undefined) {
    const deduplicated: string[] = []
    for (const id of assigneeIds) {
      if (id && !deduplicated.includes(id)) deduplicated.push(id)
    }
    payload.assigned_team = deduplicated
  }

  const { data, error } = await supabase
    .from('content_production_requests')
    .update(payload)
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
  // The assigned_team column is uuid[] — use the @> (contains) operator
  const { data, error } = await supabase
    .from('content_production_requests')
    .select('*')
    .contains('assigned_team', [employeeId])
    .order('due_date', { ascending: true })

  if (error) throw error
  return data as ContentProductionRequest[]
}

// ============================================================================
// NOTIFICATIONS — send one notification per assignee.
// Reuses the existing `notifications` table.
// Uses upsert onConflict to prevent duplicate notifications.
// ============================================================================

/**
 * Notify assigned employees about a new or updated production request.
 * Reuses the existing notifications table with onConflict deduplication.
 */
export async function notifyProductionRequestAssignees(
  requestId: string,
  requestTitle: string,
  assigneeIds: string[],
  creatorName: string
): Promise<void> {
  if (!assigneeIds || assigneeIds.length === 0) return
  const supabase = createClient()

  const rows = assigneeIds
    .filter(Boolean)
    .map((recipientId) => ({
      title: 'Production Request Assigned to You',
      message: `${creatorName ? creatorName + ' assigned you to: ' : ''}${requestTitle}`,
      type: 'production_request_assignment',
      recipient_id: recipientId,
      related_to_id: requestId,
      related_to_type: 'production_request',
      is_read: false,
    }))

  if (rows.length === 0) return

  await supabase.from('notifications').upsert(rows, {
    onConflict: 'recipient_id,type,related_to_id',
    ignoreDuplicates: true,
  })
}

// ============================================================================
// EMPLOYEES — fetch active employees for the Assigned To selector
// Reuses the existing profiles table.
// ============================================================================

export interface ProductionAssigneeOption {
  id: string
  full_name: string
  department: string | null
  position: string | null
  avatar_url: string | null
}

export async function getEmployeesForProductionAssignment(): Promise<ProductionAssigneeOption[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, department, position, avatar_url')
    .eq('is_active', true)
    .order('email', { ascending: true })

  if (error) throw error

  return (data || []).map((p: any) => ({
    id: p.id,
    full_name: resolveFullName(p),
    department: p.department || null,
    position: p.position || null,
    avatar_url: p.avatar_url || null,
  })).sort((a, b) => a.full_name.localeCompare(b.full_name))
}
