-- ============================================================================
-- ITINERARY ACTIVITY IMAGES — Storage Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE activity_images TABLE
-- Stores metadata for images uploaded to Supabase Storage.
-- The actual files live in the 'itinerary-images' storage bucket.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.itinerary_items(id) ON DELETE CASCADE,
  storage_path text NOT NULL,         -- path inside bucket: {itinerary_id}/{item_id}/{filename}
  public_url text NOT NULL,           -- signed or public URL for display
  file_name text NOT NULL,
  file_size_kb integer,
  mime_type text,
  sort_order integer NOT NULL DEFAULT 0,
  uploaded_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_images_item ON public.activity_images(item_id);
CREATE INDEX IF NOT EXISTS idx_activity_images_sort ON public.activity_images(item_id, sort_order);

ALTER TABLE public.activity_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_images_all" ON public.activity_images
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 2. STORAGE BUCKET SETUP
-- Run this if 'itinerary-images' bucket does not already exist.
-- In Supabase Dashboard: Storage → New Bucket → Name: itinerary-images
-- Set to PUBLIC so image URLs work without signed URL expiry.
-- Then add this policy:
-- ============================================================================

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('itinerary-images', 'itinerary-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for the bucket:
-- (Uncomment and run only if the bucket exists)

-- CREATE POLICY "authenticated_upload" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'itinerary-images');

-- CREATE POLICY "public_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'itinerary-images');

-- CREATE POLICY "authenticated_delete" ON storage.objects
--   FOR DELETE USING (bucket_id = 'itinerary-images');

-- ============================================================================
-- MANUAL BUCKET CREATION STEPS (if SQL approach doesn't work):
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Name: itinerary-images
-- 4. Make bucket PUBLIC (toggle)
-- 5. Save
-- The upload service will automatically create folders per itinerary.
-- ============================================================================
