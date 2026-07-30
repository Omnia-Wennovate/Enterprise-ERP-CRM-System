import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { Project, ArchiveAnalytics } from '@/types/tech'

// ============================================================================
// PROJECT ARCHIVE SERVICES
// ============================================================================

export async function getArchivedProjects(filters?: {
  search?: string
  technology?: string
  framework?: string
  client?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('projects')
    .select('*')
    .in('status', ['completed', 'archived'])
    .order('updated_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Project[]
}

export async function archiveProject(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('projects')
    .update({
      status: 'archived',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('ARCHIVE', 'projects', id, userId, oldData, data)

  await supabase.from('project_activity_log').insert({
    project_id: id,
    action: 'Project archived',
    performed_by: userId,
    details: { previous_status: oldData?.status },
  })

  return data as Project
}

export async function restoreProject(id: string, restoreStatus: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('projects')
    .update({
      status: restoreStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('RESTORE', 'projects', id, userId, oldData, data)

  await supabase.from('project_activity_log').insert({
    project_id: id,
    action: 'Project restored from archive',
    performed_by: userId,
    details: { restored_to: restoreStatus },
  })

  return data as Project
}

export async function getArchiveAnalytics(): Promise<ArchiveAnalytics> {
  const supabase = createClient()

  const [
    completedRes,
    archivedRes,
    maintenanceRes,
    allCompleted,
    bugsRes,
    debtRes,
    releasesRes,
    failedReleasesRes,
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'archived'),
    supabase.from('project_maintenance_requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    supabase.from('projects').select('budget, start_date, deadline, updated_at').in('status', ['completed', 'archived']),
    supabase.from('project_maintenance_requests').select('*', { count: 'exact', head: true }).eq('maintenance_type', 'bug_fix').in('status', ['open', 'in_progress']),
    supabase.from('project_knowledge_base').select('*', { count: 'exact', head: true }).eq('entry_type', 'technical_debt').eq('is_resolved', false),
    supabase.from('project_releases').select('*', { count: 'exact', head: true }),
    supabase.from('project_releases').select('*', { count: 'exact', head: true }).eq('deployment_status', 'failed'),
  ])

  // Calculate averages
  const projects = allCompleted.data || []
  let totalDays = 0
  let totalBudget = 0
  let validDayCount = 0

  projects.forEach((p: any) => {
    if (p.budget) totalBudget += Number(p.budget)
    if (p.start_date && p.deadline) {
      const days = Math.ceil(
        (new Date(p.deadline).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (days > 0) {
        totalDays += days
        validDayCount++
      }
    }
  })

  // Technology usage from repositories
  const { data: repos } = await supabase
    .from('project_repositories')
    .select('technologies_used')

  const techCounts: Record<string, number> = {}
  ;(repos || []).forEach((r: any) => {
    if (r.technologies_used && Array.isArray(r.technologies_used)) {
      r.technologies_used.forEach((t: string) => {
        techCounts[t] = (techCounts[t] || 0) + 1
      })
    }
  })

  const mostUsedTechnologies = Object.entries(techCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Repository health from repo statuses
  const { data: repoStatuses } = await supabase
    .from('project_repositories')
    .select('repository_status')

  const totalRepos = (repoStatuses || []).length
  const activeRepos = (repoStatuses || []).filter((r: any) => r.repository_status === 'active' || r.repository_status === 'completed').length
  const repositoryHealth = totalRepos > 0 ? Math.round((activeRepos / totalRepos) * 100) : 100

  const totalReleases = releasesRes.count || 0
  const failedReleases = failedReleasesRes.count || 0
  const deploymentSuccessRate = totalReleases > 0 ? Math.round(((totalReleases - failedReleases) / totalReleases) * 100) : 100

  return {
    completedProjects: completedRes.count || 0,
    archivedProjects: archivedRes.count || 0,
    maintenanceProjects: maintenanceRes.count || 0,
    mostUsedTechnologies,
    averageCompletionDays: validDayCount > 0 ? Math.round(totalDays / validDayCount) : 0,
    averageBudget: projects.length > 0 ? Math.round(totalBudget / projects.length) : 0,
    deploymentSuccessRate,
    openBugs: bugsRes.count || 0,
    technicalDebtScore: debtRes.count || 0,
    repositoryHealth,
  }
}
