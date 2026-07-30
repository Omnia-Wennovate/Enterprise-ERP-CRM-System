import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectKnowledgeBaseEntry } from '@/types/tech'

// ============================================================================
// PROJECT KNOWLEDGE BASE CRUD
// ============================================================================

export async function getProjectKnowledgeBase(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_knowledge_base')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Enrich with author names
  if (data && data.length > 0) {
    const authorIds = [...new Set(data.map((kb: any) => kb.author_id).filter(Boolean))]
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', authorIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))
      return data.map((kb: any) => ({
        ...kb,
        author_name: profileMap.get(kb.author_id) || 'Unknown',
      })) as ProjectKnowledgeBaseEntry[]
    }
  }

  return data as ProjectKnowledgeBaseEntry[]
}

export async function createKnowledgeBaseEntry(
  projectId: string,
  entry: Partial<ProjectKnowledgeBaseEntry>,
  userId: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_knowledge_base')
    .insert({
      ...entry,
      project_id: projectId,
      author_id: userId,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_knowledge_base', data.id, userId, null, data)
  return data as ProjectKnowledgeBaseEntry
}

export async function updateKnowledgeBaseEntry(
  id: string,
  updates: Partial<ProjectKnowledgeBaseEntry>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_knowledge_base')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('project_knowledge_base')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await logTechAudit('UPDATE', 'project_knowledge_base', id, userId, oldData, data)
  return data as ProjectKnowledgeBaseEntry
}

export async function deleteKnowledgeBaseEntry(id: string, userId: string) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_knowledge_base')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('project_knowledge_base')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_knowledge_base', id, userId, oldData, null)
}
