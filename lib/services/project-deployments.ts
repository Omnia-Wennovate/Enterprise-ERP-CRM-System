import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectDeployment } from '@/types/tech'

// ============================================================================
// PROJECT DEPLOYMENT CRUD
// ============================================================================

export async function getProjectDeployments(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_deployments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as ProjectDeployment[]
}

export async function getDeploymentById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_deployments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ProjectDeployment
}

export async function createDeployment(
  projectId: string,
  deployment: Partial<ProjectDeployment>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_deployments')
    .insert({
      ...deployment,
      project_id: projectId,
      created_by: userId,
      deployment_date: deployment.deployment_date || new Date().toISOString(),
      latest_deployment: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  await logTechAudit('CREATE', 'project_deployments', data.id, userId, null, data)

  // Log project activity
  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Deployment created',
    performed_by: userId,
    details: { hosting_platform: deployment.hosting_platform, environment: deployment.environment },
  })

  return data as ProjectDeployment
}

export async function updateDeployment(
  id: string,
  updates: Partial<ProjectDeployment>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_deployments')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('project_deployments')
    .update({
      ...updates,
      latest_deployment: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await logTechAudit('UPDATE', 'project_deployments', id, userId, oldData, data)
  return data as ProjectDeployment
}

export async function deleteDeployment(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_deployments')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('project_deployments')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_deployments', id, userId, oldData, null)
}
