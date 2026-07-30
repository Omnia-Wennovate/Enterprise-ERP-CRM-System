import { createClient } from '@/lib/supabase/client'
import type { LeadFollowUp, FollowUpType, LeadPriority } from '@/types/leads'

// ============================================================================
// CREATE FOLLOW-UP
// ============================================================================

export async function createFollowUp(params: {
  lead_id: string
  title: string
  description?: string
  follow_up_type?: FollowUpType
  due_date?: string
  priority?: LeadPriority
  assigned_to?: string | null
  created_by?: string | null
}): Promise<LeadFollowUp> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .insert({
      lead_id: params.lead_id,
      title: params.title,
      description: params.description || null,
      follow_up_type: params.follow_up_type || 'task',
      due_date: params.due_date || null,
      priority: params.priority || 'medium',
      assigned_to: params.assigned_to || null,
      created_by: params.created_by || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as LeadFollowUp
}

// ============================================================================
// GET FOLLOW-UPS FOR A LEAD
// ============================================================================

export async function getFollowUps(leadId: string): Promise<LeadFollowUp[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .select('*')
    .eq('lead_id', leadId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (error) throw error

  const followUps = (data || []) as LeadFollowUp[]
  const assignedIds = [...new Set(followUps.map((f) => f.assigned_to).filter(Boolean))] as string[]

  let agentsMap: Record<string, { id: string; full_name: string; avatar_url: string | null }> = {}
  if (assignedIds.length > 0) {
    const { data: agents } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', assignedIds)
    if (agents) {
      agentsMap = Object.fromEntries(agents.map((a) => [a.id, a]))
    }
  }

  return followUps.map((f) => ({
    ...f,
    assigned_agent: f.assigned_to ? agentsMap[f.assigned_to] || null : null,
  })) as LeadFollowUp[]
}

// ============================================================================
// UPDATE FOLLOW-UP STATUS
// ============================================================================

export async function updateFollowUpStatus(
  id: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<LeadFollowUp> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_follow_ups')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LeadFollowUp
}

// ============================================================================
// DELETE FOLLOW-UP
// ============================================================================

export async function deleteFollowUp(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lead_follow_ups').delete().eq('id', id)
  if (error) throw error
}
