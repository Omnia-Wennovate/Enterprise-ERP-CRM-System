import { createClient } from '@/lib/supabase/client'
import type { LeadNote } from '@/types/leads'

// ============================================================================
// CREATE NOTE
// ============================================================================

export async function createNote(params: {
  lead_id: string
  content: string
  author_id?: string | null
  author_name?: string | null
  mentions?: string[]
}): Promise<LeadNote> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_notes')
    .insert({
      lead_id: params.lead_id,
      content: params.content,
      author_id: params.author_id || null,
      author_name: params.author_name || null,
      mentions: params.mentions || [],
    })
    .select()
    .single()

  if (error) throw error
  return data as LeadNote
}

// ============================================================================
// GET NOTES FOR A LEAD
// ============================================================================

export async function getNotes(leadId: string): Promise<LeadNote[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as LeadNote[]
}

// ============================================================================
// UPDATE NOTE
// ============================================================================

export async function updateNote(id: string, content: string): Promise<LeadNote> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('lead_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LeadNote
}

// ============================================================================
// DELETE NOTE
// ============================================================================

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('lead_notes').delete().eq('id', id)
  if (error) throw error
}
