'use server'

import { createClient } from '@/lib/supabase/server'
import type { DocumentVersion } from '@/types/documents'

export async function createVersion(
  documentId: string,
  fileUrl: string,
  fileName: string | null,
  fileSizeKb: number | null,
  reasonForChange: string | null,
  userId: string
): Promise<DocumentVersion> {
  const supabase = await createClient()

  // Get current document info to create previous version record if it doesn't exist
  const { data: doc } = await supabase
    .from('documents')
    .select('version, file_url, file_name, file_size_kb, uploaded_by')
    .eq('id', documentId)
    .single()

  if (!doc) throw new Error('Document not found')

  // Log previous version
  const { data: prevVersion } = await supabase
    .from('document_versions')
    .insert([{
      document_id: documentId,
      file_url: doc.file_url,
      file_name: doc.file_name,
      file_size_kb: doc.file_size_kb,
      version: doc.version,
      uploaded_by: doc.uploaded_by,
      reason_for_change: 'Superseded by new version',
    }])
    .select()
    .single()

  // Update document with new version info
  const newVersionNumber = (doc.version || 1) + 1
  const { error: updateErr } = await supabase
    .from('documents')
    .update({
      file_url: fileUrl,
      file_name: fileName || doc.file_name,
      file_size_kb: fileSizeKb || doc.file_size_kb,
      version: newVersionNumber,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', documentId)

  if (updateErr) throw new Error(`Failed to update document: ${updateErr.message}`)

  // Create new version record
  const { data: newVersion, error: insertErr } = await supabase
    .from('document_versions')
    .insert([{
      document_id: documentId,
      file_url: fileUrl,
      file_name: fileName || doc.file_name,
      file_size_kb: fileSizeKb || doc.file_size_kb,
      version: newVersionNumber,
      uploaded_by: userId,
      reason_for_change: reasonForChange,
      previous_version_id: prevVersion?.id,
    }])
    .select()
    .single()

  if (insertErr) throw new Error(`Failed to create document version: ${insertErr.message}`)

  // Log access action
  await supabase.from('document_access_log').insert([{
    document_id: documentId,
    accessed_by: userId,
    action: 'replace',
    notes: reasonForChange,
  }])

  return newVersion
}

export async function getVersions(documentId: string): Promise<DocumentVersion[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('document_versions')
    .select(`
      *,
      profiles!document_versions_uploaded_by_fkey(first_name, last_name)
    `)
    .eq('document_id', documentId)
    .order('version', { ascending: false })

  if (error) throw new Error(`Failed to fetch versions: ${error.message}`)

  return (data || []).map(v => ({
    ...v,
    uploaded_by_name: (v as any).profiles
      ? `${(v as any).profiles.first_name || ''} ${(v as any).profiles.last_name || ''}`.trim() || null
      : null,
  }))
}

export async function restoreVersion(documentId: string, versionId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: versionToRestore } = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (!versionToRestore) throw new Error('Version not found')

  // Create a new version that is a copy of the old one
  await createVersion(
    documentId,
    versionToRestore.file_url,
    versionToRestore.file_name,
    versionToRestore.file_size_kb,
    `Restored from version ${versionToRestore.version}`,
    userId
  )
}
