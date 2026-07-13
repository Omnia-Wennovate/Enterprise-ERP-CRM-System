import { createClient } from '@/lib/supabase/client'
import type { MediaLibraryItem } from '@/types/marketing'


export async function getMediaLibrary(filters?: {
  file_type?: string
  campaign_id?: string
  category?: string
  platform?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.file_type) query = query.eq('file_type', filters.file_type)
  if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.platform) query = query.eq('platform', filters.platform)

  const { data, error } = await query
  if (error) throw error
  return data as MediaLibraryItem[]
}

export async function getMediaItemById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_library')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as MediaLibraryItem
}

export async function createMediaItem(item: Partial<MediaLibraryItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_library')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data as MediaLibraryItem
}

export async function updateMediaItem(id: string, updates: Partial<MediaLibraryItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_library')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as MediaLibraryItem
}

export async function deleteMediaItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('media_library')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getMediaCountsByType() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('media_library')
    .select('file_type')

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(m => {
    counts[m.file_type] = (counts[m.file_type] || 0) + 1
  })
  return counts
}
