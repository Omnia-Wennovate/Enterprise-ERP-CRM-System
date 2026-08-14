-- ============================================================================
-- HR ONBOARDING UPGRADE — Smart Enterprise 2026
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- 1. Create the onboardings parent table
CREATE TABLE IF NOT EXISTS onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  buddy_id uuid REFERENCES profiles(id),
  template text DEFAULT 'standard',
  status text DEFAULT 'active' CHECK (status IN ('active','at_risk','overdue','blocked','completed','cancelled')),
  health_score integer DEFAULT 100,
  start_date date,
  target_end_date date,
  completed_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prevent duplicate active onboardings per employee
CREATE UNIQUE INDEX IF NOT EXISTS idx_onboardings_active_employee
  ON onboardings(employee_id) WHERE status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_onboardings_status ON onboardings(status);
CREATE INDEX IF NOT EXISTS idx_onboardings_start_date ON onboardings(start_date);

-- 2. Extend onboarding_tasks with new columns (all nullable for backward compat)
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS onboarding_id uuid REFERENCES onboardings(id) ON DELETE CASCADE;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS responsible_person_id uuid REFERENCES profiles(id);
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS phase text DEFAULT 'day_one';
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS is_required boolean DEFAULT true;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_onboarding ON onboarding_tasks(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_due_date ON onboarding_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_phase ON onboarding_tasks(phase);

-- 3. RLS for onboardings
ALTER TABLE onboardings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboardings_policy" ON onboardings FOR ALL USING (true) WITH CHECK (true);

-- 4. Update onboarding_tasks RLS (already exists, but ensure it covers new columns)
-- No action needed — existing policy is FOR ALL USING (true) WITH CHECK (true)

-- 5. Add onboarding_checkin as a valid review_type conceptually
-- (performance_reviews.review_type is text, no constraint change needed)

-- ============================================================================
-- DONE — Verify with:
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'onboarding_tasks';
--   SELECT column_name FROM information_schema.columns WHERE table_name = 'onboardings';
-- ============================================================================
