import { createClient } from '@/lib/supabase/client'
import type { ProjectHealthScore } from '@/types/tech'

// ============================================================================
// PROJECT HEALTH SERVICE
// ============================================================================

export async function calculateProjectHealth(projectId: string): Promise<ProjectHealthScore> {
  const supabase = createClient()

  const [
    { data: repo },
    { data: deployments },
    { count: bugCount },
    { count: openTasks },
    { count: maintenanceOpen },
    { data: docs },
    { count: criticalSecIssues }
  ] = await Promise.all([
    supabase.from('project_repositories').select('repository_status, updated_at').eq('project_id', projectId).maybeSingle(),
    supabase.from('project_deployments').select('ssl_status, deployment_status').eq('project_id', projectId),
    supabase.from('project_maintenance_requests').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('maintenance_type', 'bug_fix').in('status', ['open', 'in_progress']),
    supabase.from('project_tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).in('status', ['todo', 'in_progress']),
    supabase.from('project_maintenance_requests').select('*', { count: 'exact', head: true }).eq('project_id', projectId).in('status', ['open', 'in_progress']),
    supabase.from('project_documents').select('document_type').eq('project_id', projectId),
    supabase.from('project_knowledge_base').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('severity', 'critical').eq('is_resolved', false)
  ])

  // 1. Repository Activity
  let repoActivity: 'healthy' | 'attention' | 'critical' = 'attention'
  if (repo) {
    const daysSinceUpdate = (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    if (repo.repository_status === 'active' && daysSinceUpdate < 30) repoActivity = 'healthy'
    else if (repo.repository_status === 'completed' || repo.repository_status === 'maintenance') repoActivity = 'healthy'
    else if (daysSinceUpdate > 90) repoActivity = 'critical'
  }

  // 2. Deployment Health
  let depHealth: 'healthy' | 'attention' | 'critical' = 'healthy'
  if (deployments && deployments.length > 0) {
    const activeDep = deployments.find(d => d.deployment_status === 'active')
    if (!activeDep) depHealth = 'attention'
    if (deployments.some(d => d.ssl_status === 'expired' || d.deployment_status === 'failed')) depHealth = 'critical'
  } else {
    depHealth = 'attention'
  }

  // 3. Maintenance Status
  let maintStatus: 'healthy' | 'attention' | 'critical' = 'healthy'
  if ((maintenanceOpen || 0) > 5) maintStatus = 'critical'
  else if ((maintenanceOpen || 0) > 2) maintStatus = 'attention'

  // 4. Documentation Score
  let docScore: 'healthy' | 'attention' | 'critical' = 'critical'
  const docTypes = docs?.map(d => d.document_type) || []
  const hasCoreDocs = docTypes.includes('srs') || docTypes.includes('design_document') || docTypes.includes('architecture_diagram')
  const hasOpsDocs = docTypes.includes('deployment_guide') || docTypes.includes('runbook')
  
  if (hasCoreDocs && hasOpsDocs) docScore = 'healthy'
  else if (hasCoreDocs || hasOpsDocs) docScore = 'attention'

  // 5. Security Status
  let secStatus: 'healthy' | 'attention' | 'critical' = 'healthy'
  if ((criticalSecIssues || 0) > 0) secStatus = 'critical'

  // 6. Overall Health
  let overall: 'healthy' | 'attention' | 'critical' = 'healthy'
  const allScores = [repoActivity, depHealth, maintStatus, docScore, secStatus]
  const criticalCount = allScores.filter(s => s === 'critical').length
  const attentionCount = allScores.filter(s => s === 'attention').length

  if (criticalCount > 0 || (bugCount || 0) > 10) overall = 'critical'
  else if (attentionCount >= 2 || (bugCount || 0) > 3) overall = 'attention'

  return {
    project_id: projectId,
    repository_activity: repoActivity,
    deployment_health: depHealth,
    bug_count: bugCount || 0,
    open_tasks: openTasks || 0,
    maintenance_status: maintStatus,
    documentation_score: docScore,
    security_status: secStatus,
    overall_health: overall
  }
}
