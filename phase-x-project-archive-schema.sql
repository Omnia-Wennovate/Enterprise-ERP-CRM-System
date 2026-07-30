-- ============================================================================
-- PHASE X: PROJECT ARCHIVE & DEPLOYMENT REPOSITORY
-- Extends the existing Technology Department with:
--   • Project Repositories (GitHub)
--   • Deployment Information
--   • Secure Credential Vault (pgcrypto encrypted)
--   • Project Documents (Supabase Storage)
--   • Release History
--   • Knowledge Base
--   • Maintenance Requests
-- ============================================================================

-- Enable pgcrypto for credential encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. PROJECT REPOSITORIES
-- ============================================================================

CREATE TABLE project_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  repository_name text NOT NULL,
  github_url text,
  organization text,
  default_branch text DEFAULT 'main',
  latest_commit text,
  visibility text NOT NULL DEFAULT 'private',        -- private, public, archived
  repository_status text NOT NULL DEFAULT 'active',  -- active, completed, maintenance, deprecated
  -- Project metadata fields
  client text,
  department text,
  technologies_used text[],
  framework text,
  database_type text,
  hosting_provider text,
  domain text,
  production_url text,
  staging_url text,
  -- Admin access references (usernames only, NOT passwords)
  system_administrator text,
  deployment_owner text,
  technical_lead_username text,
  github_username text,
  server_username text,
  database_username text,
  api_owner text,
  support_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id)
);

CREATE INDEX idx_project_repos_project ON project_repositories(project_id);
CREATE INDEX idx_project_repos_status ON project_repositories(repository_status);
CREATE INDEX idx_project_repos_visibility ON project_repositories(visibility);

-- ============================================================================
-- 2. PROJECT DEPLOYMENTS
-- ============================================================================

CREATE TABLE project_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hosting_platform text NOT NULL,    -- vercel, netlify, firebase, aws, azure, digitalocean, render, railway
  server_ip text,
  deployment_url text,
  production_url text,
  staging_url text,
  domain text,
  ssl_status text DEFAULT 'active',  -- active, expired, pending, none
  deployment_date timestamptz,
  latest_deployment timestamptz,
  deployment_notes text,
  version text,
  release_number text,
  environment text DEFAULT 'production',  -- production, staging, development, testing
  deployment_status text DEFAULT 'active', -- active, inactive, failed, rollback
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_deployments_project ON project_deployments(project_id);
CREATE INDEX idx_project_deployments_platform ON project_deployments(hosting_platform);
CREATE INDEX idx_project_deployments_env ON project_deployments(environment);

-- ============================================================================
-- 3. PROJECT CREDENTIALS (Encrypted Vault)
-- ============================================================================

CREATE TABLE project_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  credential_name text NOT NULL,
  credential_type text NOT NULL,  -- github_token, database_password, server_password, api_key, smtp, firebase, supabase, cloudflare, vercel, aws, ssh_key
  username text,
  encrypted_secret bytea NOT NULL,
  environment text DEFAULT 'production',  -- production, staging, development
  created_by uuid REFERENCES profiles(id),
  last_updated_by uuid REFERENCES profiles(id),
  expiry_date timestamptz,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_credentials_project ON project_credentials(project_id);
CREATE INDEX idx_project_credentials_type ON project_credentials(credential_type);
CREATE INDEX idx_project_credentials_expiry ON project_credentials(expiry_date);

-- ============================================================================
-- 4. CREDENTIAL ACCESS LOG (Audit Trail)
-- ============================================================================

CREATE TABLE credential_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id uuid NOT NULL REFERENCES project_credentials(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,          -- reveal, create, update, rotate, delete
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credential_access_credential ON credential_access_log(credential_id);
CREATE INDEX idx_credential_access_user ON credential_access_log(accessed_by);
CREATE INDEX idx_credential_access_created ON credential_access_log(created_at DESC);

-- ============================================================================
-- 5. PROJECT DOCUMENTS
-- ============================================================================

CREATE TABLE project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,   -- srs, design_document, api_documentation, architecture_diagram, database_erd, deployment_guide, runbook, testing_report, release_notes, user_manual, technical_documentation, meeting_notes, support_document
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  version text DEFAULT '1.0',
  description text,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_documents_project ON project_documents(project_id);
CREATE INDEX idx_project_documents_type ON project_documents(document_type);

-- ============================================================================
-- 6. PROJECT RELEASES
-- ============================================================================

CREATE TABLE project_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  release_version text NOT NULL,
  release_date timestamptz DEFAULT now(),
  developer_id uuid REFERENCES profiles(id),
  environment text DEFAULT 'production',  -- production, staging, development
  bug_fixes text,
  features text,
  breaking_changes text,
  rollback_available boolean DEFAULT true,
  deployment_status text DEFAULT 'success',  -- success, failed, rolled_back, in_progress
  release_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_releases_project ON project_releases(project_id);
CREATE INDEX idx_project_releases_date ON project_releases(release_date DESC);
CREATE INDEX idx_project_releases_version ON project_releases(release_version);

-- ============================================================================
-- 7. PROJECT KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE project_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entry_type text NOT NULL,     -- lessons_learned, known_issues, future_improvements, technical_debt, performance_notes, architecture_decisions, dependencies, maintenance_instructions, support_notes, faq
  title text NOT NULL,
  content text NOT NULL,
  severity text DEFAULT 'info',  -- info, warning, critical
  author_id uuid REFERENCES profiles(id),
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_kb_project ON project_knowledge_base(project_id);
CREATE INDEX idx_project_kb_type ON project_knowledge_base(entry_type);

-- ============================================================================
-- 8. PROJECT MAINTENANCE REQUESTS
-- ============================================================================

CREATE TABLE project_maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL,   -- maintenance, bug_fix, security_update, version_upgrade, feature_enhancement, hotfix
  title text NOT NULL,
  description text,
  developer_id uuid REFERENCES profiles(id),
  requested_by uuid REFERENCES profiles(id),
  reason text,
  time_spent_hours numeric(6,2) DEFAULT 0,
  status text DEFAULT 'open',       -- open, in_progress, completed, cancelled
  priority text DEFAULT 'medium',   -- low, medium, high, critical
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_maintenance_project ON project_maintenance_requests(project_id);
CREATE INDEX idx_project_maintenance_status ON project_maintenance_requests(status);
CREATE INDEX idx_project_maintenance_type ON project_maintenance_requests(maintenance_type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL NEW TABLES
-- ============================================================================

ALTER TABLE project_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_maintenance_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: PROJECT REPOSITORIES
-- ============================================================================

CREATE POLICY "repos_admin_all" ON project_repositories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "repos_tech_lead_all" ON project_repositories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "repos_member_select" ON project_repositories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_repositories.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT DEPLOYMENTS
-- ============================================================================

CREATE POLICY "deployments_admin_all" ON project_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "deployments_tech_lead_all" ON project_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "deployments_member_select" ON project_deployments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_deployments.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT CREDENTIALS (Strict — only admin roles)
-- ============================================================================

CREATE POLICY "credentials_admin_all" ON project_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "credentials_tech_lead_all" ON project_credentials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position = 'Technical Lead'
    )
  );

-- Developers can only see metadata (encrypted_secret column is always bytea, not readable directly)
CREATE POLICY "credentials_tech_select" ON project_credentials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

-- ============================================================================
-- RLS POLICIES: CREDENTIAL ACCESS LOG
-- ============================================================================

CREATE POLICY "credential_log_admin_select" ON credential_access_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('super_admin', 'admin')
        OR (profiles.department = 'technology' AND profiles.position = 'Technical Lead')
      )
    )
  );

CREATE POLICY "credential_log_insert" ON credential_access_log
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES: PROJECT DOCUMENTS
-- ============================================================================

CREATE POLICY "documents_admin_all" ON project_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "documents_tech_all" ON project_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "documents_member_select" ON project_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_documents.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT RELEASES
-- ============================================================================

CREATE POLICY "releases_admin_all" ON project_releases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "releases_tech_all" ON project_releases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "releases_member_select" ON project_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_releases.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT KNOWLEDGE BASE
-- ============================================================================

CREATE POLICY "kb_admin_all" ON project_knowledge_base
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "kb_tech_all" ON project_knowledge_base
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "kb_member_select" ON project_knowledge_base
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_knowledge_base.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: MAINTENANCE REQUESTS
-- ============================================================================

CREATE POLICY "maintenance_admin_all" ON project_maintenance_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "maintenance_tech_all" ON project_maintenance_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "maintenance_member_select" ON project_maintenance_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_maintenance_requests.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RPC FUNCTION: ENCRYPT CREDENTIAL
-- Uses pgcrypto pgp_sym_encrypt with a vault key
-- ============================================================================

CREATE OR REPLACE FUNCTION encrypt_credential(secret_text text, vault_key text)
RETURNS bytea
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_encrypt(secret_text, vault_key);
END;
$$;

-- ============================================================================
-- RPC FUNCTION: DECRYPT CREDENTIAL
-- Only super_admin, admin, or Technical Lead can decrypt
-- Logs every access to credential_access_log
-- ============================================================================

CREATE OR REPLACE FUNCTION decrypt_credential(p_credential_id uuid, vault_key text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_position text;
  v_department text;
  v_secret bytea;
  v_decrypted text;
BEGIN
  -- Check caller permissions
  SELECT role, position, department INTO v_role, v_position, v_department
  FROM profiles
  WHERE id = auth.uid();

  IF v_role NOT IN ('super_admin', 'admin') AND
     NOT (v_department = 'technology' AND v_position = 'Technical Lead') THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions to reveal credentials';
  END IF;

  -- Get the encrypted secret
  SELECT encrypted_secret INTO v_secret
  FROM project_credentials
  WHERE id = p_credential_id;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Credential not found';
  END IF;

  -- Decrypt
  v_decrypted := pgp_sym_decrypt(v_secret, vault_key);

  -- Log the access
  INSERT INTO credential_access_log (credential_id, accessed_by, action)
  VALUES (p_credential_id, auth.uid(), 'reveal');

  RETURN v_decrypted;
END;
$$;

-- ============================================================================
-- VERIFICATION: Confirm all new tables created
-- ============================================================================

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'project_repositories', 'project_deployments', 'project_credentials',
--   'credential_access_log', 'project_documents', 'project_releases',
--   'project_knowledge_base', 'project_maintenance_requests'
-- ) ORDER BY table_name;
