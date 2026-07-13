import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectMilestone } from '@/types/tech'

// ============================================================================
// MILESTONE CRUD
// ============================================================================

export async function getMilestones(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as ProjectMilestone[]
}

export async function createMilestone(
  projectId: string,
  milestone: Partial<ProjectMilestone>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .insert({
      project_id: projectId,
      ...milestone,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_milestones', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Milestone created',
    performed_by: userId,
    details: { title: data.title },
  })

  return data as ProjectMilestone
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<ProjectMilestone>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  const { data, error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'project_milestones', milestoneId, userId, oldData, data)

  return data as ProjectMilestone
}

export async function completeMilestone(milestoneId: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  const { data, error } = await supabase
    .from('project_milestones')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'project_milestones', milestoneId, userId, oldData, data)

  if (oldData?.project_id) {
    await supabase.from('project_activity_log').insert({
      project_id: oldData.project_id,
      action: 'Milestone completed',
      performed_by: userId,
      details: { title: data.title },
    })
  }

  return data as ProjectMilestone
}

export async function deleteMilestone(milestoneId: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('id', milestoneId)
    .single()

  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', milestoneId)

  if (error) throw error

  await logTechAudit('DELETE', 'project_milestones', milestoneId, userId, oldData, null)
}
