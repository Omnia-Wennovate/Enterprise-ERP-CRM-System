-- ============================================================================
-- Migration: Production Request Assignment → Announcements
-- 
-- Adds two nullable columns to the existing `announcements` table to support
-- displaying production request assignee information in announcements.
--
-- This is the SMALLEST compatible change: no new tables, no new columns on
-- production requests (assigned_team uuid[] already exists).
--
-- Run this migration ONCE in Supabase SQL Editor.
-- ============================================================================

-- 1. Add production_request_id (nullable FK) so we can link an announcement
--    back to its source production request.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS production_request_id uuid REFERENCES content_production_requests(id) ON DELETE SET NULL;

-- 2. Add assignee_names as a text[] array so we can store resolved display
--    names alongside the announcement without a separate join.
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS assignee_names text[] DEFAULT '{}';

-- 3. Index for the new FK (useful for lookups from the request side)
CREATE INDEX IF NOT EXISTS idx_announcements_production_request
  ON announcements(production_request_id)
  WHERE production_request_id IS NOT NULL;

-- 4. No RLS changes needed — existing announcement policies already apply
--    (permissive for prototype, with target_roles for audience filtering).

-- ============================================================================
-- VERIFY
-- ============================================================================
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'announcements'
-- ORDER BY ordinal_position;
