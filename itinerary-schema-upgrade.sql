-- ============================================================================
-- ITINERARY SYSTEM UPGRADE — Enterprise Travel Operations
-- Run this AFTER verifying existing itineraries/itinerary_days/itinerary_items exist
-- Uses ALTER TABLE to preserve existing data
-- ============================================================================

-- ============================================================================
-- 1. ALTER itineraries — Add enterprise fields
-- ============================================================================

ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS destination_country text,
  ADD COLUMN IF NOT EXISTS destination_city text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS base_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS local_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS exchange_rate_date date,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS travel_advisory_level text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS travel_advisory_note text,
  ADD COLUMN IF NOT EXISTS emergency_police text,
  ADD COLUMN IF NOT EXISTS emergency_ambulance text,
  ADD COLUMN IF NOT EXISTS emergency_embassy text,
  ADD COLUMN IF NOT EXISTS emergency_embassy_phone text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_name text,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by text,
  ADD COLUMN IF NOT EXISTS assigned_to text,
  ADD COLUMN IF NOT EXISTS assigned_to_name text,
  ADD COLUMN IF NOT EXISTS share_token text,
  ADD COLUMN IF NOT EXISTS total_cost numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS travel_type text DEFAULT 'leisure';

CREATE INDEX IF NOT EXISTS idx_itineraries_status ON public.itineraries(status);
CREATE INDEX IF NOT EXISTS idx_itineraries_template ON public.itineraries(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_itineraries_share ON public.itineraries(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itineraries_assigned ON public.itineraries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON public.itineraries(destination_country);

-- ============================================================================
-- 2. ALTER itinerary_days — Add timezone and description
-- ============================================================================

ALTER TABLE public.itinerary_days
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS weather_note text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text;

-- ============================================================================
-- 3. ALTER itinerary_items — Add enterprise activity fields
-- ============================================================================

ALTER TABLE public.itinerary_items
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS latitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS longitude numeric(10,7),
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS supplier_name text,
  ADD COLUMN IF NOT EXISTS supplier_contact text,
  ADD COLUMN IF NOT EXISTS booking_reference text,
  ADD COLUMN IF NOT EXISTS voucher_number text,
  ADD COLUMN IF NOT EXISTS cost numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS cost_local numeric(12,2),
  ADD COLUMN IF NOT EXISTS currency_local text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS start_time text,
  ADD COLUMN IF NOT EXISTS end_time text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS traveler_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS live_status_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flight_status text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_itinerary_items_type ON public.itinerary_items(type);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_status ON public.itinerary_items(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_supplier ON public.itinerary_items(supplier_id);

-- ============================================================================
-- 4. NEW TABLE: itinerary_comments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.itinerary_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  author_id text NOT NULL,
  author_name text,
  content text NOT NULL,
  department text,
  parent_id uuid REFERENCES public.itinerary_comments(id) ON DELETE CASCADE,
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_comments_itinerary ON public.itinerary_comments(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_comments_author ON public.itinerary_comments(author_id);

-- ============================================================================
-- 5. NEW TABLE: itinerary_versions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.itinerary_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot jsonb NOT NULL,
  change_summary text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_versions_itinerary ON public.itinerary_versions(itinerary_id);

-- ============================================================================
-- 6. Enable RLS on new tables
-- ============================================================================

ALTER TABLE public.itinerary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_versions ENABLE ROW LEVEL SECURITY;

-- Permissive policies (matching existing pattern)
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_comments;
DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_versions;
CREATE POLICY "Allow all access" ON public.itinerary_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.itinerary_versions FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. Ensure existing itinerary table policies allow WITH CHECK
-- ============================================================================

DROP POLICY IF EXISTS "Allow all access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow all" ON public.itineraries;
CREATE POLICY "Allow all" ON public.itineraries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_days;
DROP POLICY IF EXISTS "Allow all" ON public.itinerary_days;
CREATE POLICY "Allow all" ON public.itinerary_days FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access" ON public.itinerary_items;
DROP POLICY IF EXISTS "Allow all" ON public.itinerary_items;
CREATE POLICY "Allow all" ON public.itinerary_items FOR ALL USING (true) WITH CHECK (true);
