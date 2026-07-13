import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectTask } from '@/types/tech'

// ============================================================================
// PROJECT TASKS CRUD
// ============================================================================

export async function getProjectTasks(projectId: string, filters?: {
  status?: string
  sprint_id?: string
  assigned_to?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.sprint_id) {
    query = query.eq('sprint_id', filters.sprint_id)
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to)
  }

  const { data, error } = await query
  if (error) throw error

  // Enrich with assignee names
  if (data && data.length > 0) {
    const assigneeIds = [...new Set(data.map((t: any) => t.assigned_to).filter(Boolean))]
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', assigneeIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      return data.map((t: any) => ({
        ...t,
        assigned_to_name: profileMap.get(t.assigned_to)
          ? `${profileMap.get(t.assigned_to)?.first_name} ${profileMap.get(t.assigned_to)?.last_name}`
          : null,
      }))
    }
  }

  return data as ProjectTask[]
}

export async function getTasksByStatus(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error

  // Enrich with assignee names
  const enriched = await enrichTasksWithNames(data || [])

  // Group by status for Kanban
  const grouped = {
    todo: enriched.filter((t: any) => t.status === 'todo'),
    in_progress: enriched.filter((t: any) => t.status === 'in_progress'),
    review: enriched.filter((t: any) => t.status === 'review'),
    done: enriched.filter((t: any) => t.status === 'done'),
  }

  return grouped
}

async function enrichTasksWithNames(tasks: any[]) {
  if (tasks.length === 0) return tasks
  const supabase = createClient()
  const assigneeIds = [...new Set(tasks.map((t) => t.assigned_to).filter(Boolean))]
  if (assigneeIds.length === 0) return tasks

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', assigneeIds)

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  return tasks.map((t) => ({
    ...t,
    assigned_to_name: profileMap.get(t.assigned_to)
      ? `${profileMap.get(t.assigned_to)?.first_name} ${profileMap.get(t.assigned_to)?.last_name}`
      : null,
  }))
}

export async function createProjectTask(
  projectId: string,
  task: Partial<ProjectTask>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: projectId,
      ...task,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_tasks', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Task created',
    performed_by: userId,
    details: { title: data.title, assigned_to: data.assigned_to },
  })

  return data as ProjectTask
}

export async function updateProjectTask(
  taskId: string,
  updates: Partial<ProjectTask>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  const { data, error } = await supabase
    .from('project_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'project_tasks', taskId, userId, oldData, data)

  if (oldData?.project_id) {
    await supabase.from('project_activity_log').insert({
      project_id: oldData.project_id,
      action: `Task status changed to ${data.status}`,
      performed_by: userId,
      details: { task_id: taskId, title: data.title, old_status: oldData.status, new_status: data.status },
    })
  }

  return data as ProjectTask
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  userId: string
) {
  return updateProjectTask(taskId, { status: status as any }, userId)
}

export async function deleteProjectTask(taskId: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error

  await logTechAudit('DELETE', 'project_tasks', taskId, userId, oldData, null)
}

// ============================================================================
// CONVERT FEATURE REQUEST TO PROJECT TASK
// ============================================================================

export async function createTaskFromFeatureRequest(
  projectId: string,
  featureRequestId: string,
  userId: string
) {
  const supabase = createClient()

  // Get feature request details
  const { data: fr, error: frError } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', featureRequestId)
    .single()

  if (frError) throw frError

  // Create task linked to the feature request
  const { data: task, error: taskError } = await supabase
    .from('project_tasks')
    .insert({
      project_id: projectId,
      title: fr.title,
      description: fr.description,
      status: 'todo',
      priority: fr.priority,
      assigned_to: fr.assigned_developer,
      due_date: fr.due_date,
      source_feature_request_id: featureRequestId,
    })
    .select()
    .single()

  if (taskError) throw taskError

  // Update feature request with converted_project_id
  await supabase
    .from('feature_requests')
    .update({
      converted_project_id: projectId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', featureRequestId)

  await logTechAudit('CONVERT', 'project_tasks', task.id, userId, null, {
    feature_request_id: featureRequestId,
    project_id: projectId,
    task_id: task.id,
  })

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Task created from feature request',
    performed_by: userId,
    details: { feature_request_id: featureRequestId, title: fr.title },
  })

  return task as ProjectTask
}
