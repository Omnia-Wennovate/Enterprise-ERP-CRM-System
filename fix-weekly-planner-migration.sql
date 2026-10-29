-- ============================================================================
-- Migration: Fix weekly_content_plans schema to match frontend
-- ============================================================================

-- 1. Drop the day_of_week text column and recreate it as integer
ALTER TABLE weekly_content_plans DROP COLUMN day_of_week CASCADE;
ALTER TABLE weekly_content_plans ADD COLUMN day_of_week integer NOT NULL DEFAULT 0;

-- 2. Make content_type nullable (as frontend uses post_type instead)
ALTER TABLE weekly_content_plans ALTER COLUMN content_type DROP NOT NULL;

-- 3. Add the missing columns used by the frontend Weekly Planner modal
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS post_type text;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS caption_draft text;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS required_media text;
ALTER TABLE weekly_content_plans ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES social_campaigns(id) ON DELETE SET NULL;

-- Recreate index on day_of_week
CREATE INDEX IF NOT EXISTS idx_weekly_plans_day ON weekly_content_plans(day_of_week);
