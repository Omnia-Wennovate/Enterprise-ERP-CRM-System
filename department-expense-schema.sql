-- ============================================================================
-- DEPARTMENT EXPENSE SUBMISSION SCHEMA EXTENSION
-- Run once in Supabase SQL Editor
-- Safe: only ADDs columns if they dont already exist. Never recreates tables.
-- ============================================================================

-- 1. Add trip_reference for bundle grouping (Section 24)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS trip_reference text;

-- 2. Add submission_source to distinguish dept submissions from Finance entries
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS submission_source text DEFAULT 'finance';

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_trip_ref       ON expenses(trip_reference);
CREATE INDEX IF NOT EXISTS idx_expenses_submission_src ON expenses(submission_source);
