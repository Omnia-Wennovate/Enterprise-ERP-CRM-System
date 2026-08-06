-- ============================================================================
-- ENTERPRISE EXPENSE MODULE — DATABASE SCHEMA
-- Run this once in Supabase SQL Editor
-- EXTENDS existing tables only. NEVER recreates them.
-- ============================================================================

-- ── 1. EXTEND EXISTING expenses TABLE ────────────────────────────────────────

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_number    text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor_id         uuid;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency          text DEFAULT 'USD';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS exchange_rate     numeric(10,4) DEFAULT 1;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax               numeric(12,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS discount          numeric(12,2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approval_status   text DEFAULT 'pending';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS department        text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS project           text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method    text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_reference text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status            text DEFAULT 'unpaid';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_hash      text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ai_extracted_data jsonb;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS policy_exceeded   boolean DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes             text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS employee_id       uuid;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS original_currency text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS original_amount   numeric(12,2);

-- ── 2. NEW: vendors TABLE (separate from suppliers) ───────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  contact_person text,
  phone          text,
  email          text,
  tax_number     text,
  address        text,
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Foreign key from expenses to vendors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_expenses_vendor'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT fk_expenses_vendor
      FOREIGN KEY (vendor_id) REFERENCES vendors(id);
  END IF;
END$$;

-- ── 3. NEW: expense_categories TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_categories (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL UNIQUE,
  icon                    text,
  monthly_limit           numeric(12,2),
  per_transaction_limit   numeric(12,2),
  daily_per_person_limit  numeric(12,2),
  is_active               boolean DEFAULT true,
  created_at              timestamptz DEFAULT now()
);

-- Seed default categories
INSERT INTO expense_categories (name) VALUES
  ('Travel'),
  ('Flights'),
  ('Hotels'),
  ('Visa'),
  ('Transportation'),
  ('Fuel'),
  ('Meals'),
  ('Office Supplies'),
  ('Marketing'),
  ('Utilities'),
  ('Internet'),
  ('Phone'),
  ('Training'),
  ('Software'),
  ('Equipment'),
  ('Maintenance'),
  ('Salary'),
  ('Taxes'),
  ('Insurance'),
  ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;

-- ── 4. NEW: expense_attachments TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name   text NOT NULL,
  file_url    text NOT NULL,
  file_size   integer,
  file_type   text,
  file_hash   text,
  page_order  integer DEFAULT 0,
  uploaded_by uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_attachments_hash   ON expense_attachments(file_hash);

-- ── 5. NEW: expense_approvals TABLE ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_approvals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id    uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  step          integer NOT NULL DEFAULT 1,
  approver_role text NOT NULL,
  approver_id   uuid REFERENCES profiles(id),
  status        text NOT NULL DEFAULT 'pending',
  comments      text,
  approved_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_approvals_expense ON expense_approvals(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_approvals_status  ON expense_approvals(status);

-- ── 6. NEW: expense_budgets TABLE ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_budgets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department     text,
  category       text,
  period_month   integer NOT NULL,
  period_year    integer NOT NULL,
  budget_amount  numeric(12,2) NOT NULL,
  created_by     uuid REFERENCES profiles(id),
  created_at     timestamptz DEFAULT now(),
  UNIQUE (department, category, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_expense_budgets_period ON expense_budgets(period_year, period_month);

-- ── 7. NEW: expense_splits TABLE ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS expense_splits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id    uuid NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  department    text,
  project       text,
  booking_id    uuid REFERENCES bookings(id),
  split_amount  numeric(12,2) NOT NULL,
  split_percent numeric(5,2),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense ON expense_splits(expense_id);

-- ── 8. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE vendors            ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_approvals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_budgets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits     ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "vendors_all_access"            ON vendors;
DROP POLICY IF EXISTS "expense_categories_all_access"  ON expense_categories;
DROP POLICY IF EXISTS "expense_attachments_all_access" ON expense_attachments;
DROP POLICY IF EXISTS "expense_approvals_all_access"   ON expense_approvals;
DROP POLICY IF EXISTS "expense_budgets_all_access"     ON expense_budgets;
DROP POLICY IF EXISTS "expense_splits_all_access"      ON expense_splits;

-- Permissive policies (matching existing Finance module pattern)
CREATE POLICY "vendors_all_access"            ON vendors            FOR ALL USING (true);
CREATE POLICY "expense_categories_all_access"  ON expense_categories  FOR ALL USING (true);
CREATE POLICY "expense_attachments_all_access" ON expense_attachments FOR ALL USING (true);
CREATE POLICY "expense_approvals_all_access"   ON expense_approvals   FOR ALL USING (true);
CREATE POLICY "expense_budgets_all_access"     ON expense_budgets     FOR ALL USING (true);
CREATE POLICY "expense_splits_all_access"      ON expense_splits      FOR ALL USING (true);

-- ── 9. INDEXES for performance ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_expenses_vendor    ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_approval  ON expenses(approval_status);
CREATE INDEX IF NOT EXISTS idx_expenses_status    ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_dept      ON expenses(department);
CREATE INDEX IF NOT EXISTS idx_expenses_employee  ON expenses(employee_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_number ON expenses(expense_number);

-- ── 10. ENABLE REALTIME ───────────────────────────────────────────────────────

-- Run these in Supabase Dashboard > Database > Replication if needed:
-- ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE expense_approvals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE expense_attachments;
