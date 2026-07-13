-- ============================================================================
-- PHASE X: TECHNOLOGY DEPARTMENT
-- Software Project Management & Feature Request Management
-- ============================================================================

-- ============================================================================
-- PRE-FLIGHT SCHEMA VERIFICATION
-- Run this SELECT first to confirm prerequisite tables exist.
-- ============================================================================

-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('profiles','conversations','attendance','performance_reviews','hr_audit_log')
-- ORDER BY table_name, ordinal_position;

-- ============================================================================
-- DROP EXISTING TABLES (safe re-run)
-- ============================================================================

DROP TABLE IF EXISTS tech_audit_log CASCADE;
DROP TABLE IF EXISTS feature_request_comments CASCADE;
DROP TABLE IF EXISTS feature_request_attachments CASCADE;
DROP TABLE IF EXISTS feature_requests CASCADE;
DROP TABLE IF EXISTS project_activity_log CASCADE;
DROP TABLE IF EXISTS project_comments CASCADE;
DROP TABLE IF EXISTS project_attachments CASCADE;
DROP TABLE IF EXISTS project_tasks CASCADE;
DROP TABLE IF EXISTS project_sprints CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================================================
-- 1. PROJECTS
-- ============================================================================

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid REFERENCES profiles(id),
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'planning',
  progress_percent integer DEFAULT 0,
  start_date date,
  deadline date,
  budget numeric(12,2) DEFAULT 0,
  risk_level text DEFAULT 'low',
  health_indicator text DEFAULT 'on_track',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_deadline ON projects(deadline);

-- ============================================================================
-- 2. PROJECT MEMBERS
-- ============================================================================

CREATE TABLE project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(project_id, profile_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_profile ON project_members(profile_id);

-- ============================================================================
-- 3. PROJECT MILESTONES
-- ============================================================================

CREATE TABLE project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  sort_order integer DEFAULT 0
);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);

-- ============================================================================
-- 4. PROJECT SPRINTS
-- ============================================================================

CREATE TABLE project_sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_sprints_project ON project_sprints(project_id);
CREATE INDEX idx_project_sprints_status ON project_sprints(status);

-- ============================================================================
-- 5. PROJECT TASKS
-- ============================================================================

CREATE TABLE project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id uuid REFERENCES project_sprints(id),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'todo',
  priority text DEFAULT 'medium',
  due_date date,
  source_feature_request_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_sprint ON project_tasks(sprint_id);
CREATE INDEX idx_project_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);

-- ============================================================================
-- 6. PROJECT ATTACHMENTS
-- ============================================================================

CREATE TABLE project_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_attachments_project ON project_attachments(project_id);

-- ============================================================================
-- 7. PROJECT COMMENTS
-- ============================================================================

CREATE TABLE project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_comments_project ON project_comments(project_id);

-- ============================================================================
-- 8. PROJECT ACTIVITY LOG
-- ============================================================================

CREATE TABLE project_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid REFERENCES profiles(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_project_activity_project ON project_activity_log(project_id);
CREATE INDEX idx_project_activity_created ON project_activity_log(created_at DESC);

-- ============================================================================
-- 9. FEATURE REQUESTS
-- ============================================================================

CREATE TABLE feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  department text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  requested_by uuid REFERENCES profiles(id),
  assigned_developer uuid REFERENCES profiles(id),
  due_date date,
  status text NOT NULL DEFAULT 'requested',
  estimated_effort text,
  business_impact text,
  requested_date date DEFAULT current_date,
  approved_by uuid REFERENCES profiles(id),
  completion_percent integer DEFAULT 0,
  notes text,
  converted_project_id uuid REFERENCES projects(id),
  conversation_id uuid REFERENCES conversations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feature_requests_status ON feature_requests(status);
CREATE INDEX idx_feature_requests_department ON feature_requests(department);
CREATE INDEX idx_feature_requests_priority ON feature_requests(priority);
CREATE INDEX idx_feature_requests_requested_by ON feature_requests(requested_by);
CREATE INDEX idx_feature_requests_assigned ON feature_requests(assigned_developer);
CREATE INDEX idx_feature_requests_conversation ON feature_requests(conversation_id);

-- Add FK from project_tasks to feature_requests
ALTER TABLE project_tasks ADD CONSTRAINT fk_project_tasks_feature_request
  FOREIGN KEY (source_feature_request_id) REFERENCES feature_requests(id);

-- ============================================================================
-- 10. FEATURE REQUEST ATTACHMENTS
-- ============================================================================

CREATE TABLE feature_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fr_attachments_request ON feature_request_attachments(feature_request_id);

-- ============================================================================
-- 11. FEATURE REQUEST COMMENTS
-- ============================================================================

CREATE TABLE feature_request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_fr_comments_request ON feature_request_comments(feature_request_id);

-- ============================================================================
-- 12. TECH AUDIT LOG
-- ============================================================================

CREATE TABLE tech_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  performed_by uuid REFERENCES profiles(id),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tech_audit_action ON tech_audit_log(action);
CREATE INDEX idx_tech_audit_table ON tech_audit_log(table_name);
CREATE INDEX idx_tech_audit_created ON tech_audit_log(created_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: PROJECTS
-- ============================================================================

-- Admin full access
CREATE POLICY "projects_admin_all" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Tech leads / project managers: full access on projects they own or are assigned to
CREATE POLICY "projects_tech_lead_all" ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
    AND (
      owner_id = auth.uid()
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = projects.id
        AND project_members.profile_id = auth.uid()
      )
    )
  );

-- Developers / QA / DevOps: read + update on assigned projects
CREATE POLICY "projects_dev_select" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "projects_dev_update" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT MEMBERS
-- ============================================================================

CREATE POLICY "project_members_admin_all" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "project_members_tech_all" ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "project_members_select" ON project_members
  FOR SELECT USING (
    true
  );

-- ============================================================================
-- RLS POLICIES: PROJECT MILESTONES
-- ============================================================================

CREATE POLICY "milestones_admin_all" ON project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "milestones_tech_all" ON project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "milestones_member_select" ON project_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_milestones.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT SPRINTS
-- ============================================================================

CREATE POLICY "sprints_admin_all" ON project_sprints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "sprints_tech_all" ON project_sprints
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "sprints_member_select" ON project_sprints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_sprints.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT TASKS
-- ============================================================================

CREATE POLICY "tasks_admin_all" ON project_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "tasks_tech_lead_all" ON project_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
      AND profiles.position IN ('Technical Lead', 'Project Manager')
    )
  );

CREATE POLICY "tasks_assigned_select" ON project_tasks
  FOR SELECT USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

CREATE POLICY "tasks_assigned_update" ON project_tasks
  FOR UPDATE USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT ATTACHMENTS
-- ============================================================================

CREATE POLICY "project_attachments_admin_all" ON project_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "project_attachments_tech_all" ON project_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "project_attachments_member_select" ON project_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_attachments.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT COMMENTS
-- ============================================================================

CREATE POLICY "project_comments_admin_all" ON project_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "project_comments_tech_all" ON project_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "project_comments_member_select" ON project_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_comments.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: PROJECT ACTIVITY LOG
-- ============================================================================

CREATE POLICY "activity_log_admin_all" ON project_activity_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "activity_log_tech_insert" ON project_activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "activity_log_member_select" ON project_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = project_activity_log.project_id
      AND project_members.profile_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: FEATURE REQUESTS
-- ============================================================================

-- Admin full access
CREATE POLICY "fr_admin_all" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Technology team: full CRUD (approve, assign, update status)
CREATE POLICY "fr_tech_all" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

-- Requesting departments: insert own requests
CREATE POLICY "fr_department_insert" ON feature_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid()
  );

-- Requesting departments: read own requests
CREATE POLICY "fr_department_select" ON feature_requests
  FOR SELECT USING (
    requested_by = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES: FEATURE REQUEST ATTACHMENTS
-- ============================================================================

CREATE POLICY "fr_attachments_admin_all" ON feature_request_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "fr_attachments_tech_all" ON feature_request_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "fr_attachments_owner_all" ON feature_request_attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM feature_requests
      WHERE feature_requests.id = feature_request_attachments.feature_request_id
      AND feature_requests.requested_by = auth.uid()
    )
  );

-- ============================================================================
-- RLS POLICIES: FEATURE REQUEST COMMENTS
-- ============================================================================

CREATE POLICY "fr_comments_admin_all" ON feature_request_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "fr_comments_tech_all" ON feature_request_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.department = 'technology'
    )
  );

CREATE POLICY "fr_comments_owner_select" ON feature_request_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feature_requests
      WHERE feature_requests.id = feature_request_comments.feature_request_id
      AND feature_requests.requested_by = auth.uid()
    )
  );

CREATE POLICY "fr_comments_owner_insert" ON feature_request_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
  );

-- ============================================================================
-- RLS POLICIES: TECH AUDIT LOG
-- ============================================================================

-- All authenticated users can insert
CREATE POLICY "tech_audit_insert" ON tech_audit_log
  FOR INSERT WITH CHECK (true);

-- Only admin / super_admin / tech leads can read
CREATE POLICY "tech_audit_select" ON tech_audit_log
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

-- ============================================================================
-- VERIFICATION: Confirm all 12 tables created
-- ============================================================================

-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'projects','project_members','project_milestones','project_sprints',
--   'project_tasks','project_attachments','project_comments','project_activity_log',
--   'feature_requests','feature_request_attachments','feature_request_comments','tech_audit_log'
-- ) ORDER BY table_name;
