import { createClient } from '@/lib/supabase/client'
import type { WorkloadScore, WorkloadLevel } from '@/types/tech'

// ============================================================================
// DEVELOPER WORKLOAD CALCULATION
// ============================================================================

export function getWorkloadLevel(totalItems: number): { level: WorkloadLevel; color: string } {
  if (totalItems <= 3) return { level: 'available', color: '#10B981' }
  if (totalItems <= 6) return { level: 'busy', color: '#F59E0B' }
  return { level: 'overloaded', color: '#EF4444' }
}

export async function getDeveloperWorkload(profileId: string): Promise<WorkloadScore> {
  const supabase = createClient()

  // Count active project tasks assigned to this developer
  const { count: activeTasks } = await supabase
    .from('project_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profileId)
    .in('status', ['todo', 'in_progress', 'review'])

  // Count active feature requests assigned to this developer
  const { count: activeRequests } = await supabase
    .from('feature_requests')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_developer', profileId)
    .in('status', ['approved', 'development', 'testing'])

  // Get profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, position')
    .eq('id', profileId)
    .single()

  const taskCount = activeTasks || 0
  const requestCount = activeRequests || 0
  const total = taskCount + requestCount
  const { level, color } = getWorkloadLevel(total)

  return {
    profile_id: profileId,
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    position: profile?.position || '',
    active_tasks: taskCount,
    active_feature_requests: requestCount,
    total_items: total,
    level,
    color,
  }
}

export async function getAllTechTeamWorkload(): Promise<WorkloadScore[]> {
  const supabase = createClient()

  // Get all technology department members
  const { data: techMembers, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, position')
    .eq('department', 'technology')
    .eq('is_active', true)
    .order('first_name')

  if (error) throw error
  if (!techMembers || techMembers.length === 0) return []

  // Calculate workload for each member
  const workloads = await Promise.all(
    techMembers.map(async (member) => {
      const { count: activeTasks } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', member.id)
        .in('status', ['todo', 'in_progress', 'review'])

      const { count: activeRequests } = await supabase
        .from('feature_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_developer', member.id)
        .in('status', ['approved', 'development', 'testing'])

      const taskCount = activeTasks || 0
      const requestCount = activeRequests || 0
      const total = taskCount + requestCount
      const { level, color } = getWorkloadLevel(total)

      return {
        profile_id: member.id,
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        position: member.position || '',
        active_tasks: taskCount,
        active_feature_requests: requestCount,
        total_items: total,
        level,
        color,
      } as WorkloadScore
    })
  )

  return workloads
}
