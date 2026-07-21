import { createClient } from '@/lib/supabase/client'
import type { AppNotification } from '@/types/leads'

// ============================================================================
// CREATE NOTIFICATION
// ============================================================================

export async function createNotification(params: {
  title: string
  message: string
  type?: string
  recipient_id?: string
  related_to_id?: string
  related_to_type?: string
}): Promise<AppNotification> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      recipient_id: params.recipient_id || null,
      related_to_id: params.related_to_id || null,
      related_to_type: params.related_to_type || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as AppNotification
}

// ============================================================================
// GET NOTIFICATIONS
// ============================================================================

export async function getNotifications(recipientId?: string): Promise<AppNotification[]> {
  const supabase = createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (recipientId) {
    query = query.or(`recipient_id.eq.${recipientId},recipient_id.is.null`)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as AppNotification[]
}

// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================================

export async function markAllNotificationsRead(recipientId?: string): Promise<void> {
  const supabase = createClient()

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  if (recipientId) {
    query = query.or(`recipient_id.eq.${recipientId},recipient_id.is.null`)
  }

  const { error } = await query

  if (error) throw error
}

// ============================================================================
// NOTIFY LEAD CREATED
// ============================================================================

export async function notifyLeadCreated(
  leadName: string,
  leadId: string,
  assignedToId?: string,
  creatorName?: string
): Promise<void> {
  await createNotification({
    title: 'New Lead Created',
    message: `${creatorName || 'A user'} created lead "${leadName}"`,
    type: 'lead_created',
    recipient_id: assignedToId,
    related_to_id: leadId,
    related_to_type: 'lead',
  })
}

// ============================================================================
// NOTIFY STAGE CHANGED
// ============================================================================

export async function notifyStageChanged(
  leadName: string,
  leadId: string,
  newStage: string,
  assignedToId?: string
): Promise<void> {
  await createNotification({
    title: 'Lead Stage Changed',
    message: `Lead "${leadName}" moved to ${newStage}`,
    type: 'stage_changed',
    recipient_id: assignedToId,
    related_to_id: leadId,
    related_to_type: 'lead',
  })
}
