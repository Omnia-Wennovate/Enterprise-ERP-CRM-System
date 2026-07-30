import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectRepository } from '@/types/tech'

// ============================================================================
// PROJECT REPOSITORY CRUD
// ============================================================================

export async function getProjectRepository(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_repositories')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  return data as ProjectRepository | null
}

export async function getAllRepositories(filters?: {
  status?: string
  visibility?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('project_repositories')
    .select('*')
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('repository_status', filters.status)
  }
  if (filters?.visibility && filters.visibility !== 'all') {
    query = query.eq('visibility', filters.visibility)
  }
  if (filters?.search) {
    query = query.ilike('repository_name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error

  // Enrich with project names
  if (data && data.length > 0) {
    const projectIds = [...new Set(data.map((r: any) => r.project_id))]
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)

    const projectMap = new Map((projects || []).map((p: any) => [p.id, p.name]))
    return data.map((r: any) => ({
      ...r,
      project_name: projectMap.get(r.project_id) || 'Unknown',
    })) as ProjectRepository[]
  }

  return data as ProjectRepository[]
}

export async function upsertProjectRepository(
  projectId: string,
  repo: Partial<ProjectRepository>,
  userId: string
) {
  const supabase = createClient()

  // Check if a repo already exists for this project
  const { data: existing } = await supabase
    .from('project_repositories')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()

  if (existing) {
    // Update
    const { data: oldData } = await supabase
      .from('project_repositories')
      .select('*')
      .eq('id', existing.id)
      .single()

    const { data, error } = await supabase
      .from('project_repositories')
      .update({
        ...repo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    await logTechAudit('UPDATE', 'project_repositories', existing.id, userId, oldData, data)
    return data as ProjectRepository
  } else {
    // Insert
    const { data, error } = await supabase
      .from('project_repositories')
      .insert({
        ...repo,
        project_id: projectId,
      })
      .select()
      .single()

    if (error) throw error
    await logTechAudit('CREATE', 'project_repositories', data.id, userId, null, data)
    return data as ProjectRepository
  }
}

export async function deleteProjectRepository(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_repositories')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('project_repositories')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_repositories', id, userId, oldData, null)
}
