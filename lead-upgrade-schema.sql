-- ============================================================================
-- LEAD UPGRADE MIGRATION
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. LEAD FOLLOW-UPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  follow_up_type text NOT NULL DEFAULT 'task',
  due_date timestamptz,
  priority text DEFAULT 'medium',
  assigned_to uuid REFERENCES profiles(id),
  status text DEFAULT 'pending',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_lead ON lead_follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_status ON lead_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_lead_follow_ups_due ON lead_follow_ups(due_date);

-- ============================================================================
-- 2. LEAD NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid REFERENCES profiles(id),
  author_name text,
  mentions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created ON lead_notes(created_at DESC);

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all lead_follow_ups" ON lead_follow_ups;
CREATE POLICY "Allow all lead_follow_ups" ON lead_follow_ups FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all lead_notes" ON lead_notes;
CREATE POLICY "Allow all lead_notes" ON lead_notes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. ENABLE SUPABASE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_follow_ups;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_notes;
