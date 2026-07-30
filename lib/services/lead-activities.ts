import { createClient } from '@/lib/supabase/client'
import type { LeadActivity, LeadActivityType } from '@/types/leads'

// ============================================================================
// CREATE ACTIVITY
// ============================================================================

export async function createLeadActivity(params: {
  lead_id: string
  activity_type: LeadActivityType
  title: string
  description?: string
  performed_by?: string
  metadata?: Record<string, unknown>
}): Promise<LeadActivity> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: params.lead_id,
      activity_type: params.activity_type,
      title: params.title,
      description: params.description || null,
      performed_by: params.performed_by || null,
      metadata: params.metadata || {},
    })
    .select()
    .single()

  if (error) throw error
  return data as LeadActivity
}

// ============================================================================
// GET ACTIVITIES FOR A LEAD
// ============================================================================

export async function getLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const activities = (data || []) as LeadActivity[]
  const performerIds = [...new Set(activities.map((a) => a.performed_by).filter(Boolean))] as string[]

  let performersMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
  if (performerIds.length > 0) {
    const { data: performers } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', performerIds)
    if (performers) {
      performersMap = Object.fromEntries(performers.map((p) => [p.id, p]))
    }
  }

  return activities.map((activity) => ({
    ...activity,
    performer: activity.performed_by ? performersMap[activity.performed_by] || null : null,
  })) as LeadActivity[]
}

// ============================================================================
// LOG LEAD CREATED
// ============================================================================

export async function logLeadCreated(
  leadId: string,
  leadName: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'lead_created',
    title: `Lead "${leadName}" was created`,
    description: 'New lead added to the pipeline',
    performed_by: performedBy,
    metadata: { action: 'create' },
  })
}

// ============================================================================
// LOG STAGE CHANGE
// ============================================================================

export async function logStageChanged(
  leadId: string,
  fromStage: string,
  toStage: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'stage_changed',
    title: `Pipeline stage changed from "${fromStage}" to "${toStage}"`,
    description: `Lead moved to ${toStage} stage`,
    performed_by: performedBy,
    metadata: { from_stage: fromStage, to_stage: toStage },
  })
}

// ============================================================================
// LOG DOCUMENT UPLOAD
// ============================================================================

export async function logDocumentUploaded(
  leadId: string,
  fileName: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'document_uploaded',
    title: `Document "${fileName}" uploaded`,
    performed_by: performedBy,
    metadata: { file_name: fileName },
  })
}

// ============================================================================
// LOG LEAD EDITED
// ============================================================================

export async function logLeadEdited(
  leadId: string,
  leadName: string,
  changedFields: string[],
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'lead_updated',
    title: `Lead "${leadName}" was updated`,
    description: changedFields.length > 0 ? `Fields updated: ${changedFields.join(', ')}` : undefined,
    performed_by: performedBy,
    metadata: { changed_fields: changedFields },
  })
}

// ============================================================================
// LOG ASSIGNED
// ============================================================================

export async function logAssigned(
  leadId: string,
  leadName: string,
  agentName: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'assigned',
    title: `Lead "${leadName}" assigned to ${agentName}`,
    performed_by: performedBy,
    metadata: { agent_name: agentName },
  })
}

// ============================================================================
// LOG NOTE ADDED
// ============================================================================

export async function logNoteAdded(
  leadId: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'note_added',
    title: 'Internal note added',
    performed_by: performedBy,
    metadata: {},
  })
}

// ============================================================================
// LOG CONVERTED
// ============================================================================

export async function logConverted(
  leadId: string,
  leadName: string,
  convertedTo: 'customer' | 'booking' | 'quotation',
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'converted',
    title: `Lead "${leadName}" converted to ${convertedTo}`,
    performed_by: performedBy,
    metadata: { converted_to: convertedTo },
  })
}

// ============================================================================
// LOG ARCHIVED
// ============================================================================

export async function logArchived(
  leadId: string,
  leadName: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'archived',
    title: `Lead "${leadName}" was archived`,
    performed_by: performedBy,
    metadata: {},
  })
}

// ============================================================================
// LOG CALL MADE
// ============================================================================

export async function logCallMade(
  leadId: string,
  performedBy?: string,
  note?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'call_made',
    title: 'Phone call logged',
    description: note,
    performed_by: performedBy,
    metadata: {},
  })
}

// ============================================================================
// LOG EMAIL SENT
// ============================================================================

export async function logEmailSent(
  leadId: string,
  performedBy?: string,
  note?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'email_sent',
    title: 'Email sent',
    description: note,
    performed_by: performedBy,
    metadata: {},
  })
}

// ============================================================================
// LOG MEETING SCHEDULED
// ============================================================================

export async function logMeetingScheduled(
  leadId: string,
  performedBy?: string,
  note?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'meeting_scheduled',
    title: 'Meeting scheduled',
    description: note,
    performed_by: performedBy,
    metadata: {},
  })
}

// ============================================================================
// LOG FOLLOW-UP SCHEDULED
// ============================================================================

export async function logFollowUpScheduled(
  leadId: string,
  title: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'follow_up_scheduled',
    title: `Follow-up scheduled: "${title}"`,
    performed_by: performedBy,
    metadata: { follow_up_title: title },
  })
}

// ============================================================================
// LOG QUOTATION GENERATED
// ============================================================================

export async function logQuotationGenerated(
  leadId: string,
  leadName: string,
  performedBy?: string
): Promise<LeadActivity> {
  return createLeadActivity({
    lead_id: leadId,
    activity_type: 'quotation_generated',
    title: `Quotation generated for "${leadName}"`,
    performed_by: performedBy,
    metadata: {},
  })
}

