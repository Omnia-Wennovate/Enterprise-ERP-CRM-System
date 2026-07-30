-- ============================================================================
-- PHASE X — Enterprise Visa Management System
-- Migration script — Run in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS patterns)
-- ============================================================================

-- ── 1. ALTER existing visa_applications table ────────────────────────────────

ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';
ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS assigned_officer_id uuid;
ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS purpose_of_travel text;
ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS biometric_date date;
ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS expected_decision_date date;

-- Add FK for assigned_officer_id if profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'visa_applications_assigned_officer_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.visa_applications
        ADD CONSTRAINT visa_applications_assigned_officer_id_fkey
        FOREIGN KEY (assigned_officer_id) REFERENCES public.profiles(id);
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'profiles table not found, skipping FK constraint';
    END;
  END IF;
END $$;

-- ── 2. Country Visa Rules ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.country_visa_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nationality text NOT NULL,
  destination_country text NOT NULL,
  visa_required boolean DEFAULT true,
  processing_time_days integer,
  embassy_name text,
  embassy_address text,
  embassy_phone text,
  embassy_email text,
  required_documents text[],
  visa_fee numeric(10,2),
  visa_fee_currency text DEFAULT 'USD',
  biometric_required boolean DEFAULT false,
  interview_required boolean DEFAULT false,
  insurance_required boolean DEFAULT false,
  min_passport_validity_months integer DEFAULT 6,
  allowed_stay_days integer,
  visa_validity_months integer,
  entry_count text DEFAULT 'single',
  additional_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nationality, destination_country)
);

-- ── 3. Visa Appointments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  appointment_type text NOT NULL,
  scheduled_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  location text,
  address text,
  contact_info text,
  status text DEFAULT 'scheduled',
  notes text,
  reminder_sent boolean DEFAULT false,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 4. Visa Fees ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  government_fee numeric(10,2) DEFAULT 0,
  agency_fee numeric(10,2) DEFAULT 0,
  courier_fee numeric(10,2) DEFAULT 0,
  service_fee numeric(10,2) DEFAULT 0,
  insurance_fee numeric(10,2) DEFAULT 0,
  vat numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) GENERATED ALWAYS AS
    (government_fee + agency_fee + courier_fee + service_fee + insurance_fee + vat - discount) STORED,
  payment_status text DEFAULT 'pending',
  payment_method text,
  payment_date date,
  invoice_number text,
  receipt_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 5. Visa Audit Log ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by text,
  performed_by_name text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- ── 6. Visa Documents (linked to visa applications) ──────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text,
  file_size_kb integer,
  upload_date timestamptz DEFAULT now(),
  verified_by text,
  verified_by_name text,
  verification_status text DEFAULT 'pending',
  verification_date timestamptz,
  expiry_date date,
  notes text,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── 7. Visa Timeline Events ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  performed_by text,
  performed_by_name text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ── 8. Visa Communications ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visa_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_application_id uuid NOT NULL REFERENCES public.visa_applications(id) ON DELETE CASCADE,
  message_type text DEFAULT 'comment',
  content text NOT NULL,
  author_id text,
  author_name text,
  is_internal boolean DEFAULT false,
  parent_id uuid REFERENCES public.visa_communications(id),
  attachments jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── 9. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_visa_apps_status ON public.visa_applications(status);
CREATE INDEX IF NOT EXISTS idx_visa_apps_priority ON public.visa_applications(priority);
CREATE INDEX IF NOT EXISTS idx_visa_apps_officer ON public.visa_applications(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_visa_apps_destination ON public.visa_applications(destination_country);
CREATE INDEX IF NOT EXISTS idx_visa_apps_created ON public.visa_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visa_apps_submission ON public.visa_applications(submission_date);

CREATE INDEX IF NOT EXISTS idx_visa_appointments_app ON public.visa_appointments(visa_application_id);
CREATE INDEX IF NOT EXISTS idx_visa_appointments_date ON public.visa_appointments(scheduled_datetime);

CREATE INDEX IF NOT EXISTS idx_visa_fees_app ON public.visa_fees(visa_application_id);
CREATE INDEX IF NOT EXISTS idx_visa_fees_status ON public.visa_fees(payment_status);

CREATE INDEX IF NOT EXISTS idx_visa_audit_app ON public.visa_audit_log(visa_application_id);
CREATE INDEX IF NOT EXISTS idx_visa_audit_created ON public.visa_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visa_docs_app ON public.visa_documents(visa_application_id);
CREATE INDEX IF NOT EXISTS idx_visa_docs_type ON public.visa_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_visa_timeline_app ON public.visa_timeline_events(visa_application_id);
CREATE INDEX IF NOT EXISTS idx_visa_timeline_created ON public.visa_timeline_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visa_comms_app ON public.visa_communications(visa_application_id);

CREATE INDEX IF NOT EXISTS idx_country_rules_nat_dest ON public.country_visa_rules(nationality, destination_country);

-- ── 10. RLS Policies ─────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.country_visa_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.visa_communications ENABLE ROW LEVEL SECURITY;

-- Allow all access policies (matching existing pattern in the project)
DROP POLICY IF EXISTS "Allow all" ON public.country_visa_rules;
CREATE POLICY "Allow all" ON public.country_visa_rules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_appointments;
CREATE POLICY "Allow all" ON public.visa_appointments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_fees;
CREATE POLICY "Allow all" ON public.visa_fees FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_audit_log;
CREATE POLICY "Allow all" ON public.visa_audit_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_documents;
CREATE POLICY "Allow all" ON public.visa_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_timeline_events;
CREATE POLICY "Allow all" ON public.visa_timeline_events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON public.visa_communications;
CREATE POLICY "Allow all" ON public.visa_communications FOR ALL USING (true) WITH CHECK (true);

-- ── 11. Seed: Sample Country Rules ───────────────────────────────────────────

INSERT INTO public.country_visa_rules (nationality, destination_country, visa_required, processing_time_days, embassy_name, required_documents, visa_fee, biometric_required, interview_required, insurance_required, min_passport_validity_months, allowed_stay_days, visa_validity_months, entry_count)
VALUES
  ('Ethiopian', 'United States', true, 60, 'US Embassy Addis Ababa', ARRAY['passport','photo','bank_statement','employment_letter','invitation_letter','flight_reservation','hotel_reservation','insurance'], 185.00, true, true, false, 6, 90, 120, 'multiple'),
  ('Ethiopian', 'United Kingdom', true, 21, 'UK Visa Application Centre', ARRAY['passport','photo','bank_statement','employment_letter','flight_reservation','hotel_reservation','insurance'], 130.00, true, false, true, 6, 180, 6, 'multiple'),
  ('Ethiopian', 'Schengen', true, 15, 'VFS Global', ARRAY['passport','photo','bank_statement','employment_letter','flight_reservation','hotel_reservation','insurance','invitation_letter'], 90.00, true, false, true, 3, 90, 6, 'multiple'),
  ('Ethiopian', 'United Arab Emirates', true, 5, 'UAE Embassy', ARRAY['passport','photo','bank_statement','flight_reservation','hotel_reservation'], 100.00, false, false, false, 6, 30, 3, 'single'),
  ('Ethiopian', 'Turkey', true, 3, 'E-Visa Portal', ARRAY['passport','photo'], 50.00, false, false, false, 6, 30, 3, 'single'),
  ('Ethiopian', 'Kenya', false, 0, 'N/A', ARRAY[]::text[], 0.00, false, false, false, 6, 90, 0, 'multiple'),
  ('Ethiopian', 'South Africa', true, 10, 'SA Embassy Addis Ababa', ARRAY['passport','photo','bank_statement','employment_letter','flight_reservation','hotel_reservation','insurance','invitation_letter'], 80.00, false, false, false, 6, 30, 3, 'single'),
  ('Indian', 'United States', true, 45, 'US Embassy New Delhi', ARRAY['passport','photo','bank_statement','employment_letter','invitation_letter','flight_reservation','hotel_reservation'], 185.00, true, true, false, 6, 90, 120, 'multiple'),
  ('Indian', 'Schengen', true, 15, 'VFS Global', ARRAY['passport','photo','bank_statement','employment_letter','flight_reservation','hotel_reservation','insurance'], 90.00, true, false, true, 3, 90, 6, 'multiple'),
  ('Saudi', 'United States', true, 30, 'US Embassy Riyadh', ARRAY['passport','photo','bank_statement','employment_letter'], 185.00, true, true, false, 6, 90, 120, 'multiple')
ON CONFLICT (nationality, destination_country) DO NOTHING;
