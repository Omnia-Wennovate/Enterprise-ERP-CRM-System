-- ============================================================================
-- PHASE X: SOCIAL MEDIA & DIGITAL MARKETING DEPARTMENT
-- Complete Database Schema — 17 Tables
-- ============================================================================

-- ============================================================================
-- 1. SOCIAL ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  account_name text NOT NULL,
  profile_url text,
  followers_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'connected',
  account_manager_id uuid REFERENCES profiles(id),
  last_sync_at timestamptz,
  api_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(status);

-- ============================================================================
-- 2. SOCIAL CAMPAIGNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  budget numeric(12,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  target_audience text,
  objective text,
  campaign_type text NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  expected_leads integer DEFAULT 0,
  actual_leads integer DEFAULT 0,
  roi numeric(6,2),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_status ON social_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_type ON social_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_dates ON social_campaigns(start_date, end_date);

-- ============================================================================
-- 3. SOCIAL POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES social_accounts(id),
  campaign_id uuid REFERENCES social_campaigns(id),
  content_type text NOT NULL,
  caption text,
  media_urls text[],
  status text NOT NULL DEFAULT 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  is_top_performing boolean DEFAULT false,
  engagement_count integer DEFAULT 0,
  reach_count integer DEFAULT 0,
  impressions_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_account ON social_posts(account_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign ON social_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_by ON social_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_social_posts_published ON social_posts(published_at DESC);

-- ============================================================================
-- 4. CAMPAIGN PLATFORMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES social_campaigns(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES social_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_platforms_campaign ON campaign_platforms(campaign_id);

-- ============================================================================
-- 5. SCHEDULED POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  scheduled_datetime timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_datetime ON scheduled_posts(scheduled_datetime);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);

-- ============================================================================
-- 6. SOCIAL LEADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid,  -- FK to leads table from Phase 2, left nullable until that table is confirmed
  platform text NOT NULL,
  campaign_id uuid REFERENCES social_campaigns(id),
  ad_reference text,
  source text,
  contact_name text,
  contact_email text,
  contact_phone text,
  assigned_agent_id uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'new',
  converted boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_leads_campaign ON social_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_status ON social_leads(status);
CREATE INDEX IF NOT EXISTS idx_social_leads_agent ON social_leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_platform ON social_leads(platform);

-- ============================================================================
-- 7. SOCIAL COMMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES social_accounts(id),
  post_id uuid REFERENCES social_posts(id),
  author_name text,
  content text,
  sentiment text,
  priority text DEFAULT 'normal',
  is_replied boolean DEFAULT false,
  replied_by uuid REFERENCES profiles(id),
  replied_at timestamptz,
  reply_content text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_comments_post ON social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_account ON social_comments(account_id);
CREATE INDEX IF NOT EXISTS idx_social_comments_replied ON social_comments(is_replied);

-- ============================================================================
-- 8. SOCIAL MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES social_accounts(id),
  sender_name text,
  content text,
  response_time_minutes integer,
  is_answered boolean DEFAULT false,
  answered_by uuid REFERENCES profiles(id),
  response_content text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_messages_account ON social_messages(account_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_answered ON social_messages(is_answered);

-- ============================================================================
-- 9. ADVERTISEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES social_campaigns(id),
  name text NOT NULL,
  platform text NOT NULL,
  ad_type text DEFAULT 'sponsored',
  budget numeric(12,2) NOT NULL,
  spend numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  target_audience text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_campaign ON advertisements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_platform ON advertisements(platform);
CREATE INDEX IF NOT EXISTS idx_advertisements_status ON advertisements(status);

-- ============================================================================
-- 10. ADVERTISEMENT METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS advertisement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  ctr numeric(5,2),
  cpc numeric(8,2),
  cpm numeric(8,2),
  conversions integer DEFAULT 0,
  roi numeric(6,2)
);

CREATE INDEX IF NOT EXISTS idx_advertisement_metrics_ad ON advertisement_metrics(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_metrics_date ON advertisement_metrics(date);

-- ============================================================================
-- 11. INFLUENCERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL,
  handle text,
  followers_count integer DEFAULT 0,
  category text,
  country text,
  campaign_id uuid REFERENCES social_campaigns(id),
  contract_url text,
  payment_amount numeric(12,2),
  payment_status text DEFAULT 'pending',
  performance_notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_influencers_platform ON influencers(platform);
CREATE INDEX IF NOT EXISTS idx_influencers_campaign ON influencers(campaign_id);

-- ============================================================================
-- 12. MEDIA LIBRARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size_kb integer,
  campaign_id uuid REFERENCES social_campaigns(id),
  category text,
  platform text,
  tags text[],
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_library_type ON media_library(file_type);
CREATE INDEX IF NOT EXISTS idx_media_library_campaign ON media_library(campaign_id);
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library(uploaded_by);

-- ============================================================================
-- 13. MARKETING TASKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES profiles(id),
  assigned_by uuid REFERENCES profiles(id),
  campaign_id uuid REFERENCES social_campaigns(id),
  priority text DEFAULT 'medium',
  due_date date,
  status text DEFAULT 'pending',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_tasks_assigned ON marketing_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_status ON marketing_tasks(status);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_campaign ON marketing_tasks(campaign_id);

-- ============================================================================
-- 14. MARKETING REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  title text,
  period_start date,
  period_end date,
  file_url text,
  summary text,
  generated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_reports_type ON marketing_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_marketing_reports_generated ON marketing_reports(generated_by);

-- ============================================================================
-- 15. CONTENT PRODUCTION REQUESTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_production_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  requesting_department text NOT NULL,
  campaign_id uuid REFERENCES social_campaigns(id),
  description text,
  priority text DEFAULT 'medium',
  due_date date,
  assigned_team uuid[],
  status text NOT NULL DEFAULT 'requested',
  recording_date date,
  recording_location text,
  required_equipment text,
  camera_operator_id uuid REFERENCES profiles(id),
  video_editor_id uuid REFERENCES profiles(id),
  photographer_id uuid REFERENCES profiles(id),
  presenter_id uuid REFERENCES profiles(id),
  requires_travel boolean DEFAULT false,
  completion_percent integer DEFAULT 0,
  requested_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_production_status ON content_production_requests(status);
CREATE INDEX IF NOT EXISTS idx_content_production_dept ON content_production_requests(requesting_department);
CREATE INDEX IF NOT EXISTS idx_content_production_campaign ON content_production_requests(campaign_id);

-- ============================================================================
-- 16. WEEKLY CONTENT PLANS
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_content_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date date NOT NULL,
  day_of_week text NOT NULL,
  content_theme text NOT NULL,
  content_type text NOT NULL,
  platform text,
  assigned_to uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'planned',
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_week ON weekly_content_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_status ON weekly_content_plans(status);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_day ON weekly_content_plans(day_of_week);

-- ============================================================================
-- 17. EMPLOYEE CONTENT STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS employee_content_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_status text NOT NULL DEFAULT 'available',
  current_task text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(employee_id)
);

CREATE INDEX IF NOT EXISTS idx_employee_content_status_employee ON employee_content_status(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_content_status_status ON employee_content_status(current_status);

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_production_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_content_status ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES — PERMISSIVE FOR DEVELOPMENT
-- Matches Phase 5/6 pattern. Role-based restrictions documented as comments.
-- ============================================================================

-- Production policies should restrict:
-- super_admin / admin: full access to all tables
-- Marketing Manager (position = 'Marketing Manager'): full access to all social/marketing tables
-- Content Creator: full access to social_posts, media_library, weekly_content_plans (own rows)
-- Graphic Designer / Video Editor / Photographer: full access to media_library, read on assigned production requests
-- Community Manager: full access to social_comments, social_messages
-- Sales (role = 'sales_agent'): read-only on social_leads
-- HR (role = 'hr_manager'): no access to marketing tables
-- Finance (role = 'accountant'): read-only on social_campaigns.budget, advertisements.spend

CREATE POLICY "social_accounts_policy" ON social_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "social_campaigns_policy" ON social_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "social_posts_policy" ON social_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "campaign_platforms_policy" ON campaign_platforms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "scheduled_posts_policy" ON scheduled_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "social_leads_policy" ON social_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "social_comments_policy" ON social_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "social_messages_policy" ON social_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "advertisements_policy" ON advertisements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "advertisement_metrics_policy" ON advertisement_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "influencers_policy" ON influencers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "media_library_policy" ON media_library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_tasks_policy" ON marketing_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "marketing_reports_policy" ON marketing_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "content_production_requests_policy" ON content_production_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "weekly_content_plans_policy" ON weekly_content_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "employee_content_status_policy" ON employee_content_status FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- ADD MARKETING CHANNEL TO DEPARTMENT CHANNELS
-- ============================================================================

INSERT INTO department_channels (name, description, icon, is_private, is_readonly, created_by)
VALUES ('marketing', 'Marketing & Social Media team discussions', 'Megaphone', false, false, NULL)
ON CONFLICT (name) DO NOTHING;
