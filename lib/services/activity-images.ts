import { createClient } from '@/lib/supabase/client'

// ============================================================================
// ACTIVITY IMAGE SERVICE
// Handles upload/delete/fetch of activity images using Supabase Storage.
// Bucket: 'itinerary-images' (must be created as PUBLIC in Supabase Dashboard)
// ============================================================================

export interface ActivityImage {
  id: string
  item_id: string
  storage_path: string
  public_url: string
  file_name: string
  file_size_kb: number | null
  mime_type: string | null
  sort_order: number
  uploaded_by: string | null
  created_at: string
}

const BUCKET = 'itinerary-images'
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 10

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload JPG, PNG, or WebP images.'
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File too large. Maximum size is ${MAX_SIZE_MB}MB.`
  }
  return null
}

/**
 * Upload a single image to Supabase Storage and record it in activity_images.
 * Returns the saved ActivityImage record.
 */
export async function uploadActivityImage(
  file: File,
  itemId: string,
  itineraryId: string,
  sortOrder: number = 0
): Promise<ActivityImage> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const storagePath = `${itineraryId}/${itemId}/${uniqueName}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath)

  const publicUrl = urlData.publicUrl

  // Record in activity_images table
  const { data, error: dbError } = await supabase
    .from('activity_images')
    .insert({
      item_id: itemId,
      storage_path: storagePath,
      public_url: publicUrl,
      file_name: file.name,
      file_size_kb: Math.round(file.size / 1024),
      mime_type: file.type,
      sort_order: sortOrder,
    })
    .select()
    .single()

  if (dbError) {
    // Clean up storage if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath])
    throw new Error(`Failed to save image record: ${dbError.message}`)
  }

  return data as ActivityImage
}

/**
 * Get all images for an activity item.
 */
export async function getActivityImages(itemId: string): Promise<ActivityImage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activity_images')
    .select('*')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to load images: ${error.message}`)
  return (data || []) as ActivityImage[]
}

/**
 * Get images for multiple items at once (batch load for print view).
 */
export async function getActivityImagesForItems(
  itemIds: string[]
): Promise<Record<string, ActivityImage[]>> {
  if (itemIds.length === 0) return {}
  const supabase = createClient()
  const { data, error } = await supabase
    .from('activity_images')
    .select('*')
    .in('item_id', itemIds)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to load images: ${error.message}`)

  // Group by item_id
  const grouped: Record<string, ActivityImage[]> = {}
  for (const img of data || []) {
    if (!grouped[img.item_id]) grouped[img.item_id] = []
    grouped[img.item_id].push(img as ActivityImage)
  }
  return grouped
}

/**
 * Delete an image from both Storage and the DB.
 */
export async function deleteActivityImage(imageId: string, storagePath: string): Promise<void> {
  const supabase = createClient()

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (storageError) {
    console.warn('Storage delete failed (may already be gone):', storageError.message)
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('activity_images')
    .delete()
    .eq('id', imageId)

  if (dbError) throw new Error(`Failed to delete image record: ${dbError.message}`)
}

/**
 * Update sort order for images (after reorder).
 */
export async function updateImageSortOrder(
  updates: { id: string; sort_order: number }[]
): Promise<void> {
  const supabase = createClient()
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase.from('activity_images').update({ sort_order }).eq('id', id)
    )
  )
}
