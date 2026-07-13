import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectSprint } from '@/types/tech'

// ============================================================================
// SPRINT CRUD
// ============================================================================

export async function getSprints(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true })

  if (error) throw error

  // Get task counts per sprint
  if (data && data.length > 0) {
    const sprintIds = data.map((s: any) => s.id)
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('sprint_id, status')
      .in('sprint_id', sprintIds)

    const taskCounts = new Map<string, { total: number; completed: number }>()
    ;(tasks || []).forEach((t: any) => {
      if (!taskCounts.has(t.sprint_id)) {
        taskCounts.set(t.sprint_id, { total: 0, completed: 0 })
      }
      const counts = taskCounts.get(t.sprint_id)!
      counts.total++
      if (t.status === 'done') counts.completed++
    })

    return data.map((s: any) => ({
      ...s,
      task_count: taskCounts.get(s.id)?.total || 0,
      completed_task_count: taskCounts.get(s.id)?.completed || 0,
    }))
  }

  return data as ProjectSprint[]
}

export async function createSprint(
  projectId: string,
  sprint: Partial<ProjectSprint>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_sprints')
    .insert({
      project_id: projectId,
      ...sprint,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_sprints', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Sprint created',
    performed_by: userId,
    details: { sprint_name: data.sprint_name },
  })

  return data as ProjectSprint
}

export async function updateSprint(
  sprintId: string,
  updates: Partial<ProjectSprint>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_sprints')
    .select('*')
    .eq('id', sprintId)
    .single()

  const { data, error } = await supabase
    .from('project_sprints')
    .update(updates)
    .eq('id', sprintId)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'project_sprints', sprintId, userId, oldData, data)

  return data as ProjectSprint
}

export async function updateSprintStatus(
  sprintId: string,
  status: string,
  userId: string
) {
  return updateSprint(sprintId, { status: status as any }, userId)
}

export async function deleteSprint(sprintId: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_sprints')
    .select('*')
    .eq('id', sprintId)
    .single()

  const { error } = await supabase
    .from('project_sprints')
    .delete()
    .eq('id', sprintId)

  if (error) throw error

  await logTechAudit('DELETE', 'project_sprints', sprintId, userId, oldData, null)
}
