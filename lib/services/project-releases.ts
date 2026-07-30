import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectRelease } from '@/types/tech'

// ============================================================================
// PROJECT RELEASES CRUD
// ============================================================================

export async function getProjectReleases(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_releases')
    .select('*')
    .eq('project_id', projectId)
    .order('release_date', { ascending: false })

  if (error) throw error

  // Enrich with developer names
  if (data && data.length > 0) {
    const devIds = [...new Set(data.map((r: any) => r.developer_id).filter(Boolean))]
    if (devIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', devIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))
      return data.map((r: any) => ({
        ...r,
        developer_name: profileMap.get(r.developer_id) || 'Unknown',
      })) as ProjectRelease[]
    }
  }

  return data as ProjectRelease[]
}

export async function createRelease(
  projectId: string,
  release: Partial<ProjectRelease>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_releases')
    .insert({
      ...release,
      project_id: projectId,
      developer_id: release.developer_id || userId,
      release_date: release.release_date || new Date().toISOString(),
      deployment_status: release.deployment_status || 'success',
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_releases', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: `Release ${release.release_version} deployed`,
    performed_by: userId,
    details: {
      version: release.release_version,
      environment: release.environment,
      deployment_status: release.deployment_status || 'success',
    },
  })

  return data as ProjectRelease
}

export async function updateRelease(
  id: string,
  updates: Partial<ProjectRelease>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_releases')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('project_releases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await logTechAudit('UPDATE', 'project_releases', id, userId, oldData, data)
  return data as ProjectRelease
}

export async function deleteRelease(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_releases')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('project_releases')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_releases', id, userId, oldData, null)
}
