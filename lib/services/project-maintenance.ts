import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectMaintenanceRequest } from '@/types/tech'

// ============================================================================
// PROJECT MAINTENANCE CRUD
// ============================================================================

export async function getProjectMaintenance(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_maintenance_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Enrich with names
  if (data && data.length > 0) {
    const userIds = [...new Set([
      ...data.map((m: any) => m.developer_id),
      ...data.map((m: any) => m.requested_by)
    ].filter(Boolean))]

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))
      return data.map((m: any) => ({
        ...m,
        developer_name: profileMap.get(m.developer_id) || 'Unassigned',
        requested_by_name: profileMap.get(m.requested_by) || 'Unknown',
      })) as ProjectMaintenanceRequest[]
    }
  }

  return data as ProjectMaintenanceRequest[]
}

export async function createMaintenanceRequest(
  projectId: string,
  request: Partial<ProjectMaintenanceRequest>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_maintenance_requests')
    .insert({
      ...request,
      project_id: projectId,
      requested_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_maintenance_requests', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Maintenance request created',
    performed_by: userId,
    details: { title: request.title, type: request.maintenance_type },
  })

  return data as ProjectMaintenanceRequest
}

export async function updateMaintenanceRequest(
  id: string,
  updates: Partial<ProjectMaintenanceRequest>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_maintenance_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('project_maintenance_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      completed_at: updates.status === 'completed' && oldData.status !== 'completed'
        ? new Date().toISOString()
        : oldData.completed_at
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await logTechAudit('UPDATE', 'project_maintenance_requests', id, userId, oldData, data)
  return data as ProjectMaintenanceRequest
}

export async function deleteMaintenanceRequest(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_maintenance_requests')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('project_maintenance_requests')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_maintenance_requests', id, userId, oldData, null)
}
