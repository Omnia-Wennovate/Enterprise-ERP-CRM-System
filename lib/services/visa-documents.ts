'use server'

// ============================================================================
// VISA DOCUMENTS SERVICE
// lib/services/visa-documents.ts
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import type { VisaDocument } from '@/types/visa'
import { getCountryRule } from './visa'

export async function getVisaDocuments(visaApplicationId: string): Promise<VisaDocument[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_documents')
    .select('*')
    .eq('visa_application_id', visaApplicationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch visa documents: ${error.message}`)
  return data || []
}

export async function addVisaDocument(doc: Partial<VisaDocument>): Promise<VisaDocument> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_documents')
    .insert([doc])
    .select()
    .single()

  if (error) throw new Error(`Failed to add document: ${error.message}`)
  
  // Create timeline event
  await supabase.from('visa_timeline_events').insert([{
    visa_application_id: doc.visa_application_id,
    event_type: 'document_uploaded',
    title: 'Document Uploaded',
    description: `Uploaded ${doc.document_type}: ${doc.file_name}`,
  }])

  return data
}

export async function updateVisaDocument(id: string, updates: Partial<VisaDocument>): Promise<VisaDocument> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('visa_documents')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update document: ${error.message}`)
  
  if (updates.verification_status) {
    await supabase.from('visa_timeline_events').insert([{
      visa_application_id: data.visa_application_id,
      event_type: `document_${updates.verification_status}`,
      title: 'Document Status Updated',
      description: `${data.document_type} marked as ${updates.verification_status}`,
    }])
  }

  return data
}

export async function deleteVisaDocument(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Get doc first to log deletion
  const { data: doc } = await supabase.from('visa_documents').select('visa_application_id, document_type, file_name').eq('id', id).single()
  
  const { error } = await supabase.from('visa_documents').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete document: ${error.message}`)

  if (doc) {
    await supabase.from('visa_timeline_events').insert([{
      visa_application_id: doc.visa_application_id,
      event_type: 'document_deleted',
      title: 'Document Deleted',
      description: `Deleted ${doc.document_type}: ${doc.file_name}`,
    }])
  }
}

export async function getMissingDocuments(visaApplicationId: string, nationality: string, destination: string) {
  const [docs, rule] = await Promise.all([
    getVisaDocuments(visaApplicationId),
    getCountryRule(nationality, destination)
  ])

  if (!rule || !rule.required_documents) return { required: [], uploaded: docs, missing: [] }

  const uploadedTypes = new Set(docs.map(d => d.document_type))
  const missing = rule.required_documents.filter(req => !uploadedTypes.has(req as any))

  return {
    required: rule.required_documents,
    uploaded: docs,
    missing
  }
}
