-- ============================================================================
-- PHASE 5: HR MANAGEMENT SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND profiles TABLE WITH HR COLUMNS
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marital_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_type text DEFAULT 'full_time';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_joined date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS probation_end_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_end_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS basic_salary numeric(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowances numeric(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commission_eligible boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payroll_type text DEFAULT 'monthly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================================
-- STEP 2: CREATE HR TABLES
-- ============================================================================

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  expiry_date date,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON employee_documents(document_type);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  clock_in timestamptz,
  clock_out timestamptz,
  total_hours numeric(5,2),
  late_minutes integer DEFAULT 0,
  early_leave_minutes integer DEFAULT 0,
  overtime_minutes integer DEFAULT 0,
  status text NOT NULL DEFAULT 'present',
  notes text,
  approved_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Leave Types
CREATE TABLE IF NOT EXISTS leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  days_allowed integer NOT NULL DEFAULT 0,
  is_paid boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Leave Balances
CREATE TABLE IF NOT EXISTS leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  year integer NOT NULL,
  allocated integer NOT NULL DEFAULT 0,
  used integer NOT NULL DEFAULT 0,
  remaining integer GENERATED ALWAYS AS (allocated - used) STORED,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES leave_types(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested integer NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  manager_id uuid REFERENCES profiles(id),
  manager_approved_at timestamptz,
  hr_approved_by uuid REFERENCES profiles(id),
  hr_approved_at timestamptz,
  rejected_by uuid REFERENCES profiles(id),
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_month integer NOT NULL,
  period_year integer NOT NULL,
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  bonuses numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) GENERATED ALWAYS AS (
    basic_salary + allowances + bonuses + commission_amount - deductions - tax
  ) STORED,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES profiles(id),
  paid_date date,
  payslip_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON payroll(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status);

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  period_month integer,
  period_year integer NOT NULL,
  review_type text NOT NULL DEFAULT 'monthly',
  kpi_score numeric(5,2),
  target_score numeric(5,2),
  achievement_percent numeric(5,2),
  manager_notes text,
  employee_notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);

-- Job Positions
CREATE TABLE IF NOT EXISTS job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text NOT NULL,
  description text,
  requirements text,
  status text NOT NULL DEFAULT 'open',
  posted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Applicants
CREATE TABLE IF NOT EXISTS applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_position_id uuid REFERENCES job_positions(id),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  resume_url text,
  stage text NOT NULL DEFAULT 'applied',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_applicants_position ON applicants(job_position_id);

-- Onboarding Tasks
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_label text NOT NULL,
  category text NOT NULL,
  is_completed boolean DEFAULT false,
  completed_by uuid REFERENCES profiles(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_employee ON onboarding_tasks(employee_id);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type text NOT NULL,
  asset_name text NOT NULL,
  serial_number text,
  condition text NOT NULL DEFAULT 'good',
  is_assigned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Asset Assignments
CREATE TABLE IF NOT EXISTS asset_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  issued_date date NOT NULL,
  return_date date,
  condition_on_issue text,
  condition_on_return text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_assignments_employee ON asset_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset ON asset_assignments(asset_id);

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Shift Assignments
CREATE TABLE IF NOT EXISTS shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  shift_id uuid NOT NULL REFERENCES shifts(id),
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee ON shift_assignments(employee_id);

-- Training Courses
CREATE TABLE IF NOT EXISTS training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_hours integer,
  expiry_months integer,
  created_at timestamptz DEFAULT now()
);

-- Training Assignments
CREATE TABLE IF NOT EXISTS training_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id),
  course_id uuid NOT NULL REFERENCES training_courses(id),
  assigned_date date DEFAULT CURRENT_DATE,
  completed_date date,
  certificate_url text,
  expiry_date date,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_assignments_employee ON training_assignments(employee_id);

-- HR Audit Log
CREATE TABLE IF NOT EXISTS hr_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  performed_by uuid REFERENCES profiles(id),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_audit_log_table ON hr_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_hr_audit_log_performed_by ON hr_audit_log(performed_by);

-- ============================================================================
-- STEP 3: ENABLE RLS ON ALL HR TABLES
-- ============================================================================

ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: RLS POLICIES - PERMISSIVE FOR DEVELOPMENT
-- ============================================================================

-- For development/testing, use permissive policies. In production, restrict by role.

CREATE POLICY "employee_documents_policy" ON employee_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "attendance_policy" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "leave_types_policy" ON leave_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "leave_balances_policy" ON leave_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "leave_requests_policy" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "payroll_policy" ON payroll FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "performance_reviews_policy" ON performance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "job_positions_policy" ON job_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "applicants_policy" ON applicants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "onboarding_tasks_policy" ON onboarding_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "assets_policy" ON assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "asset_assignments_policy" ON asset_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "shifts_policy" ON shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "shift_assignments_policy" ON shift_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_courses_policy" ON training_courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "training_assignments_policy" ON training_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hr_audit_log_policy" ON hr_audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 5: INSERT DEFAULT LEAVE TYPES
-- ============================================================================

INSERT INTO leave_types (name, days_allowed, is_paid, is_active)
VALUES 
  ('Annual Leave', 20, true, true),
  ('Sick Leave', 10, true, true),
  ('Emergency Leave', 3, true, true),
  ('Maternity Leave', 90, true, true),
  ('Paternity Leave', 14, true, true),
  ('Compassionate Leave', 5, true, true),
  ('Unpaid Leave', 0, false, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: INSERT SAMPLE SHIFTS
-- ============================================================================

INSERT INTO shifts (name, start_time, end_time, is_recurring)
VALUES 
  ('Morning Shift', '08:00:00', '16:00:00', true),
  ('Evening Shift', '16:00:00', '00:00:00', true),
  ('Night Shift', '00:00:00', '08:00:00', true),
  ('Flexible', '09:00:00', '17:00:00', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: INSERT SAMPLE TRAINING COURSES
-- ============================================================================

INSERT INTO training_courses (title, description, duration_hours, expiry_months)
VALUES 
  ('Travel Industry Basics', 'Introduction to travel operations', 8, 12),
  ('Customer Service Excellence', 'Client interaction and satisfaction', 6, 12),
  ('Safety and Compliance', 'Company and legal compliance training', 4, 6),
  ('Advanced Booking Systems', 'GDS and booking platform training', 12, 24)
ON CONFLICT DO NOTHING;
