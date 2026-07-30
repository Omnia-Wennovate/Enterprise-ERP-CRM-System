import { createClient } from '@/lib/supabase/client'
import { logTechAudit } from './tech-audit'
import type { ProjectDocument } from '@/types/tech'

// ============================================================================
// PROJECT DOCUMENTS CRUD
// ============================================================================

export async function getProjectDocuments(projectId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Enrich with uploader names
  if (data && data.length > 0) {
    const uploaderIds = [...new Set(data.map((d: any) => d.uploaded_by).filter(Boolean))]
    if (uploaderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', uploaderIds)

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`]))
      return data.map((d: any) => ({
        ...d,
        uploaded_by_name: profileMap.get(d.uploaded_by) || 'Unknown',
      })) as ProjectDocument[]
    }
  }

  return data as ProjectDocument[]
}

export async function uploadProjectDocument(
  projectId: string,
  file: File,
  metadata: {
    document_name: string
    document_type: string
    description?: string
    version?: string
  },
  userId: string
) {
  const supabase = createClient()

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${projectId}/${Date.now()}-${metadata.document_name.replace(/\s+/g, '-')}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('project-documents')
    .getPublicUrl(uploadData.path)

  // Create document record
  const { data, error } = await supabase
    .from('project_documents')
    .insert({
      project_id: projectId,
      document_name: metadata.document_name,
      document_type: metadata.document_type,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      version: metadata.version || '1.0',
      description: metadata.description,
      uploaded_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  await logTechAudit('CREATE', 'project_documents', data.id, userId, null, data)

  await supabase.from('project_activity_log').insert({
    project_id: projectId,
    action: 'Document uploaded',
    performed_by: userId,
    details: { document_name: metadata.document_name, document_type: metadata.document_type },
  })

  return data as ProjectDocument
}

export async function updateDocumentMetadata(
  id: string,
  updates: Partial<ProjectDocument>,
  userId: string
) {
  const supabase = createClient()

  const { data: oldData } = await supabase
    .from('project_documents')
    .select('*')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('project_documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  await logTechAudit('UPDATE', 'project_documents', id, userId, oldData, data)
  return data as ProjectDocument
}

export async function deleteProjectDocument(id: string, userId: string) {
  const supabase = createClient()

  const { data: doc } = await supabase
    .from('project_documents')
    .select('*')
    .eq('id', id)
    .single()

  // Delete from storage if URL matches our bucket
  if (doc?.file_url) {
    try {
      const url = new URL(doc.file_url)
      const pathParts = url.pathname.split('/project-documents/')
      if (pathParts[1]) {
        await supabase.storage.from('project-documents').remove([pathParts[1]])
      }
    } catch (e) {
      console.warn('Failed to delete file from storage:', e)
    }
  }

  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', id)

  if (error) throw error
  await logTechAudit('DELETE', 'project_documents', id, userId, doc, null)
}
