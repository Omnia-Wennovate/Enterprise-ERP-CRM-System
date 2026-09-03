-- ============================================================================
-- OMNIA ERP — SOCIAL MEDIA INTELLIGENCE CENTER
-- Database Migration: Real API Integration Layer
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================
-- BEFORE RUNNING: generate ENCRYPTION_KEY with:
--   openssl rand -hex 32
-- and add it to .env.local as ENCRYPTION_KEY=<result>
-- ============================================================================

-- ============================================================================
-- STEP 1: EXTEND social_accounts TABLE
-- Add OAuth + sync tracking columns to the existing table
-- ============================================================================

ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS external_account_id text,
  ADD COLUMN IF NOT EXISTS access_token_encrypted text,
  ADD COLUMN IF NOT EXISTS refresh_token_encrypted text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS scopes text[],
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'manual'
    CHECK (connection_status IN ('oauth_connected','disconnected','expired','error','manual')),
  ADD COLUMN IF NOT EXISTS last_sync_status text
    CHECK (last_sync_status IN ('success','failed','partial','syncing')),
  ADD COLUMN IF NOT EXISTS last_sync_error text,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Unique constraint to prevent duplicate OAuth connections per platform+account
-- (allows multiple accounts per platform — e.g. two Instagram accounts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_accounts_external
  ON social_accounts(platform, external_account_id)
  WHERE external_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_accounts_connection ON social_accounts(connection_status);
CREATE INDEX IF NOT EXISTS idx_social_accounts_updated ON social_accounts(updated_at DESC);

-- ============================================================================
-- STEP 2: EXTEND social_posts TABLE
-- Add real API sync fields
-- ============================================================================

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS external_post_id text,
  ADD COLUMN IF NOT EXISTS post_url text,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

-- Idempotent sync: prevent duplicate posts from the same account
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_external
  ON social_posts(account_id, external_post_id)
  WHERE external_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_last_synced ON social_posts(last_synced_at DESC);

-- ============================================================================
-- STEP 3: EXTEND social_comments TABLE
-- Add external ID for idempotent sync
-- ============================================================================

ALTER TABLE social_comments
  ADD COLUMN IF NOT EXISTS external_comment_id text,
  ADD COLUMN IF NOT EXISTS post_url text,
  ADD COLUMN IF NOT EXISTS reaction_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_social_comments_external
  ON social_comments(post_id, external_comment_id)
  WHERE external_comment_id IS NOT NULL;

-- ============================================================================
-- STEP 4: CREATE social_account_metrics TABLE
-- Normalized daily metrics per account — the heart of the analytics layer
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_account_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  metric_date date NOT NULL,
  followers integer,
  follower_growth integer,        -- delta from previous day
  likes integer,
  comments integer,
  shares integer,
  views integer,
  reach integer,                  -- unique users (not available on all platforms)
  impressions integer,            -- total content views including repeat
  engagements integer,            -- total engagement actions
  engagement_rate numeric(8,4),   -- (engagements / followers) * 100
  profile_views integer,          -- page/profile views (platform-dependent)
  video_views integer,            -- video-specific views
  posts_published integer,        -- posts published on this day
  created_at timestamptz DEFAULT now(),
  -- One row per account per day — idempotent upserts
  UNIQUE(social_account_id, metric_date)
);

ALTER TABLE social_account_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_account_metrics_policy" ON social_account_metrics
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sam_account_date ON social_account_metrics(social_account_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_sam_platform ON social_account_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_sam_date ON social_account_metrics(metric_date DESC);

-- ============================================================================
-- STEP 5: CREATE sync_job_log TABLE
-- Observability for the sync system — Super Admin visibility
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_job_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE CASCADE,
  job_type text NOT NULL,         -- full_sync/profile/posts/comments/metrics/token_refresh
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','success','failed','partial')),
  records_synced integer DEFAULT 0,
  error_message text,
  api_quota_info jsonb            -- rate limit headers if the platform exposes them
);

ALTER TABLE sync_job_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sync_job_log_policy" ON sync_job_log
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sjl_account ON sync_job_log(social_account_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sjl_status ON sync_job_log(status);
CREATE INDEX IF NOT EXISTS idx_sjl_started ON sync_job_log(started_at DESC);

-- ============================================================================
-- STEP 6: CREATE social_oauth_states TABLE
-- CSRF protection for OAuth flows — state validated on callback
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text UNIQUE NOT NULL,
  platform text NOT NULL,
  user_id text NOT NULL,          -- Omnia user ID who initiated the OAuth
  created_at timestamptz DEFAULT now(),
  used_at timestamptz,            -- null = unused, non-null = already consumed
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE social_oauth_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_oauth_states_policy" ON social_oauth_states
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-clean expired states (Supabase pg_cron can schedule this,
-- but even without cron the WHERE clause in validation handles it)
CREATE INDEX IF NOT EXISTS idx_sos_state ON social_oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_sos_expires ON social_oauth_states(expires_at);

-- ============================================================================
-- STEP 7: CREATE social_audit_log TABLE
-- Auditable record of connect/disconnect/token events
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL
    CHECK (action IN ('connect','disconnect','reauthorize','token_refresh','sync_triggered','data_deleted')),
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE SET NULL,
  platform text,
  performed_by text NOT NULL,     -- Omnia user ID
  performed_by_name text,
  performed_at timestamptz DEFAULT now(),
  details jsonb                   -- e.g. { "kept_data": true, "scopes": [...] }
);

ALTER TABLE social_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_audit_log_policy" ON social_audit_log
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_sal_account ON social_audit_log(social_account_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sal_action ON social_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_sal_performed ON social_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sal_performer ON social_audit_log(performed_by);

-- ============================================================================
-- STEP 8: UPDATE campaign_id linkage in social_posts
-- social_posts already has campaign_id -> social_campaigns(id)
-- This is confirmed present — campaign attribution (Section 47) is supported.
-- No new columns needed; the link already exists.
-- ============================================================================

-- Verify the constraint exists (informational only):
-- SELECT tc.constraint_name FROM information_schema.table_constraints tc
--   WHERE tc.table_name = 'social_posts' AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- DONE — Run npm run dev to test the updated schema
-- ============================================================================
