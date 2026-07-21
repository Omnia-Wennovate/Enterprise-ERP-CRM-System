-- ============================================================================
-- PHASE X — AI ITINERARY BUILDER DATABASE SCHEMA
-- New tables for AI generation tracking. Existing tables UNTOUCHED.
-- Run this in your Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. ai_itinerary_generations — stores each AI generation result
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_itinerary_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt jsonb NOT NULL,
  result jsonb NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  quality_check jsonb,
  status text DEFAULT 'generated',  -- generated | accepted | rejected
  itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE SET NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_status ON public.ai_itinerary_generations(status);
CREATE INDEX IF NOT EXISTS idx_ai_generations_itinerary ON public.ai_itinerary_generations(itinerary_id);

-- ============================================================================
-- 2. ai_generation_history — audit trail of all AI calls
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES public.ai_itinerary_generations(id) ON DELETE CASCADE,
  action text NOT NULL,  -- generate | refine | regenerate_day | chat | quality_check
  input jsonb,
  output jsonb,
  provider text,
  model text,
  tokens_used integer,
  latency_ms integer,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_history_generation ON public.ai_generation_history(generation_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_action ON public.ai_generation_history(action);

-- ============================================================================
-- 3. ai_template_library — saved successful itinerary structures
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_template_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  destination_country text,
  destination_city text,
  travel_type text,
  duration_days integer,
  template_data jsonb NOT NULL,
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  source_itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE SET NULL,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_templates_destination ON public.ai_template_library(destination_country);
CREATE INDEX IF NOT EXISTS idx_ai_templates_type ON public.ai_template_library(travel_type);

-- ============================================================================
-- 4. Enable RLS (matching existing permissive pattern)
-- ============================================================================

ALTER TABLE public.ai_itinerary_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_template_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.ai_itinerary_generations;
DROP POLICY IF EXISTS "Allow all access" ON public.ai_generation_history;
DROP POLICY IF EXISTS "Allow all access" ON public.ai_template_library;

CREATE POLICY "Allow all access" ON public.ai_itinerary_generations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.ai_generation_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON public.ai_template_library FOR ALL USING (true) WITH CHECK (true);
