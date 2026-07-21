-- ============================================================================
-- PHASE X: CRM LEADS SYSTEM
-- Complete leads management with activities, documents, and notifications
-- ============================================================================

-- ============================================================================
-- 1. LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead Information
  lead_name text NOT NULL,
  company text,
  contact_person text,
  job_title text,
  email text NOT NULL,
  phone text,
  mobile text,
  website text,
  lead_source text NOT NULL DEFAULT 'website',
  industry text,
  country text,
  city text,
  address text,
  notes text,

  -- Sales Information
  assigned_to uuid REFERENCES profiles(id),
  estimated_value numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  travel_type text,
  expected_close_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  pipeline_stage text NOT NULL DEFAULT 'new',
  probability integer DEFAULT 50,
  status text NOT NULL DEFAULT 'active',

  -- Customer Requirements
  destination text,
  travel_date date,
  return_date date,
  adults integer DEFAULT 1,
  children integer DEFAULT 0,
  infants integer DEFAULT 0,
  budget numeric(12,2),
  preferred_airline text,
  preferred_hotel text,
  visa_required boolean DEFAULT false,
  special_requests text,

  -- Tags & Attachments
  tags text[] DEFAULT '{}',
  attachment_urls text[] DEFAULT '{}',

  -- Metadata
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_expected_close ON leads(expected_close_date);

-- ============================================================================
-- 2. LEAD ACTIVITIES (Audit Log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  performed_by uuid REFERENCES profiles(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_type ON lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created ON lead_activities(created_at DESC);

-- ============================================================================
-- 3. LEAD DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size_kb integer,
  document_category text DEFAULT 'other',
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead ON lead_documents(lead_id);

-- ============================================================================
-- 4. NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  recipient_id uuid REFERENCES profiles(id),
  related_to_id text,
  related_to_type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ============================================================================
-- 5. ENABLE RLS
-- ============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES (Permissive — matching existing pattern)
-- ============================================================================

DROP POLICY IF EXISTS "Allow all leads" ON leads;
CREATE POLICY "Allow all leads" ON leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all lead_activities" ON lead_activities;
CREATE POLICY "Allow all lead_activities" ON lead_activities FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all lead_documents" ON lead_documents;
CREATE POLICY "Allow all lead_documents" ON lead_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all notifications" ON notifications;
CREATE POLICY "Allow all notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- 7. STORAGE BUCKET (Run in Supabase Dashboard > Storage)
-- ============================================================================
-- Create a new bucket called "lead-documents" with public access.
-- Go to Storage > New Bucket > Name: lead-documents > Public: true
-- ============================================================================
