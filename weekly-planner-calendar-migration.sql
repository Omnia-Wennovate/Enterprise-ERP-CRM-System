-- ============================================================================
-- Migration: Weekly Planner → 2-week Content Calendar format
-- Run AFTER fix-weekly-planner-migration.sql
-- ============================================================================

-- 1. Calendar fields on each planned content piece
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS host text;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS is_gap_day boolean NOT NULL DEFAULT false;
-- Other platforms that re-post the primary platform's content ("Same as TikTok")
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS cross_post_platforms text[] NOT NULL DEFAULT '{}';
-- Recording schedule
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS is_recorded boolean NOT NULL DEFAULT false;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS recording_date date;

-- 2. Notes per calendar cycle (keyed by the cycle's first Monday)
CREATE TABLE IF NOT EXISTS weekly_planner_notes (
  week_start_date date PRIMARY KEY,
  notes text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_planner_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "weekly_planner_notes_policy" ON weekly_planner_notes;
CREATE POLICY "weekly_planner_notes_policy" ON weekly_planner_notes FOR ALL USING (true) WITH CHECK (true);

-- 3. Leftover contents backlog
CREATE TABLE IF NOT EXISTS content_backlog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'idea'
    CHECK (category IN ('recorded', 'to_record', 'idea', 'coming_up')),
  host text,
  status text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_backlog_category ON content_backlog(category);

ALTER TABLE content_backlog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_backlog_policy" ON content_backlog;
CREATE POLICY "content_backlog_policy" ON content_backlog FOR ALL USING (true) WITH CHECK (true);
