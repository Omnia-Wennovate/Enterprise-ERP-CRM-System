import { createClient } from '@/lib/supabase/client'
import type { LeadDocument, DocumentCategory } from '@/types/leads'

const BUCKET_NAME = 'lead-documents'

// ============================================================================
// UPLOAD DOCUMENT
// ============================================================================

export async function uploadLeadDocument(params: {
  leadId: string
  file: File
  category?: DocumentCategory
  uploadedBy?: string
}): Promise<LeadDocument> {
  const supabase = createClient()

  // Generate unique file path
  const timestamp = Date.now()
  const sanitizedName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${params.leadId}/${timestamp}_${sanitizedName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, params.file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  // Determine file type
  const fileType = params.file.type || 'application/octet-stream'
  const fileSizeKb = Math.round(params.file.size / 1024)

  // Insert document record
  const { data, error } = await supabase
    .from('lead_documents')
    .insert({
      lead_id: params.leadId,
      file_name: params.file.name,
      file_url: urlData.publicUrl,
      file_type: fileType,
      file_size_kb: fileSizeKb,
      document_category: params.category || 'other',
      uploaded_by: params.uploadedBy || null,
    })
    .select()
    .single()

  if (error) throw error
  return data as LeadDocument
}

// ============================================================================
// GET DOCUMENTS FOR A LEAD
// ============================================================================

export async function getLeadDocuments(leadId: string): Promise<LeadDocument[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_documents')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as LeadDocument[]
}

// ============================================================================
// DELETE DOCUMENT
// ============================================================================

export async function deleteLeadDocument(id: string, fileUrl: string): Promise<void> {
  const supabase = createClient()

  // Extract file path from URL
  const urlParts = fileUrl.split(`${BUCKET_NAME}/`)
  if (urlParts.length > 1) {
    const filePath = urlParts[1]
    await supabase.storage.from(BUCKET_NAME).remove([filePath])
  }

  const { error } = await supabase
    .from('lead_documents')
    .delete()
    .eq('id', id)

  if (error) throw error
}
