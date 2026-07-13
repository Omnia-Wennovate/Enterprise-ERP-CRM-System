import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { Project, TechDashboardStats } from '@/types/tech'

// ============================================================================
// PROJECT CRUD
// ============================================================================

export async function getProjects(filters?: {
  status?: string
  priority?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Project[]
}

export async function getProjectById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Project
}

export async function createProject(project: Partial<Project>, userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...project,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'projects', data.id, userId, null, data)

  // Log activity
  await supabase.from('project_activity_log').insert({
    project_id: data.id,
    action: 'Project created',
    performed_by: userId,
    details: { name: data.name },
  })

  return data as Project
}

export async function updateProject(id: string, updates: Partial<Project>, userId: string) {
  const supabase = createClient()

  // Get old values for audit
  const { data: oldData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await logTechAudit('UPDATE', 'projects', id, userId, oldData, data)

  // Log activity
  await supabase.from('project_activity_log').insert({
    project_id: id,
    action: 'Project updated',
    performed_by: userId,
    details: updates,
  })

  return data as Project
}

export async function deleteProject(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error

  await logTechAudit('DELETE', 'projects', id, userId, oldData, null)
}

// ============================================================================
// PROJECT MEMBERS
// ============================================================================

export async function getProjectMembers(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('assigned_at', { ascending: true })

  if (error) throw error

  // Fetch profile details for each member
  if (data && data.length > 0) {
    const profileIds = data.map((m: any) => m.profile_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, position')
      .in('id', profileIds)

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
    return data.map((m: any) => ({
      ...m,
      first_name: profileMap.get(m.profile_id)?.first_name || '',
      last_name: profileMap.get(m.profile_id)?.last_name || '',
      email: profileMap.get(m.profile_id)?.email || '',
      avatar_url: profileMap.get(m.profile_id)?.avatar_url || null,
      position: profileMap.get(m.profile_id)?.position || '',
    }))
  }

  return data || []
}

export async function addProjectMember(
  projectId: string,
  profileId: string,
  role: string,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      profile_id: profileId,
      role,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('INSERT', 'project_members', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Member added',
    performed_by: userId,
    details: { profile_id: profileId, role },
  })

  return data
}

export async function removeProjectMember(memberId: string, projectId: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_members')
    .select('*')
    .eq('id', memberId)
    .single()

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)

  if (error) throw error

  await logTechAudit('DELETE', 'project_members', memberId, userId, oldData, null)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Member removed',
    performed_by: userId,
    details: oldData,
  })
}

// ============================================================================
// PROJECT COMMENTS
// ============================================================================

export async function getProjectComments(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error

  if (data && data.length > 0) {
    const authorIds = [...new Set(data.map((c: any) => c.author_id).filter(Boolean))]
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', authorIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      return data.map((c: any) => ({
        ...c,
        author_name: profileMap.get(c.author_id)
          ? `${profileMap.get(c.author_id)?.first_name} ${profileMap.get(c.author_id)?.last_name}`
          : 'Unknown',
        author_avatar: profileMap.get(c.author_id)?.avatar_url || null,
      }))
    }
  }

  return data || []
}

export async function addProjectComment(
  projectId: string,
  authorId: string,
  content: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      author_id: authorId,
      content,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('INSERT', 'project_comments', data.id, authorId, null, data)

  return data
}

// ============================================================================
// PROJECT ATTACHMENTS
// ============================================================================

export async function getProjectAttachments(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_attachments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addProjectAttachment(
  projectId: string,
  fileName: string,
  fileUrl: string,
  uploadedBy: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_attachments')
    .insert({
      project_id: projectId,
      file_name: fileName,
      file_url: fileUrl,
      uploaded_by: uploadedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// PROJECT ACTIVITY LOG
// ============================================================================

export async function getProjectActivity(projectId: string, limit = 30) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_activity_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  if (data && data.length > 0) {
    const performerIds = [...new Set(data.map((a: any) => a.performed_by).filter(Boolean))]
    if (performerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', performerIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
      return data.map((a: any) => ({
        ...a,
        performed_by_name: profileMap.get(a.performed_by)
          ? `${profileMap.get(a.performed_by)?.first_name} ${profileMap.get(a.performed_by)?.last_name}`
          : 'System',
      }))
    }
  }

  return data || []
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getTechDashboardStats(): Promise<TechDashboardStats> {
  const supabase = createClient()

  const [
    activeProjects,
    completedProjects,
    delayedProjects,
    totalRequests,
    pendingApproval,
    inDevelopment,
    completedRequests,
    rejectedRequests,
    teamSize,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .in('status', ['planning', 'development', 'testing', 'review', 'deployment']),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('health_indicator', 'delayed'),
    supabase
      .from('feature_requests')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('feature_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'requested'),
    supabase
      .from('feature_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'development'),
    supabase
      .from('feature_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed'),
    supabase
      .from('feature_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department', 'technology')
      .eq('is_active', true),
  ])

  // Projects near deadline (within 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { count: nearDeadline } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .in('status', ['planning', 'development', 'testing', 'review', 'deployment'])
    .lte('deadline', nextWeek.toISOString().split('T')[0])
    .gte('deadline', new Date().toISOString().split('T')[0])

  return {
    activeProjects: activeProjects.count || 0,
    projectsNearDeadline: nearDeadline || 0,
    delayedProjects: delayedProjects.count || 0,
    completedProjects: completedProjects.count || 0,
    totalRequests: totalRequests.count || 0,
    pendingApproval: pendingApproval.count || 0,
    inDevelopment: inDevelopment.count || 0,
    completedRequests: completedRequests.count || 0,
    rejectedRequests: rejectedRequests.count || 0,
    teamSize: teamSize.count || 0,
  }
}

export async function getRecentProjects(limit = 5) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Project[]
}

export async function getProjectsNearDeadline(days = 7) {
  const supabase = createClient()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['planning', 'development', 'testing', 'review', 'deployment'])
    .lte('deadline', futureDate.toISOString().split('T')[0])
    .gte('deadline', new Date().toISOString().split('T')[0])
    .order('deadline', { ascending: true })

  if (error) throw error
  return data as Project[]
}
