-- ============================================================================
-- OMNIA ERP — Audit Log, Settings & Integration Configs
-- Migration: audit-integrations-settings-schema.sql
-- Safe to run multiple times (all statements are idempotent)
-- ============================================================================

-- ============================================================================
-- 1. AUDIT LOGS (append-only, immutable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email    text,
  user_name     text,
  department    text,
  role          text,
  action        text NOT NULL,           -- e.g. 'login_success', 'lead_created', 'setting_changed'
  module        text NOT NULL,           -- e.g. 'auth', 'crm', 'hr', 'finance', 'settings'
  page          text,                    -- e.g. '/crm/leads', '/settings'
  description   text,                   -- human-readable summary
  entity_type   text,                   -- e.g. 'lead', 'invoice', 'booking'
  entity_id     text,                   -- UUID or reference of the affected record
  ip_address    text,                   -- from x-forwarded-for header
  user_agent    text,                   -- browser/device info
  result        text NOT NULL DEFAULT 'success',  -- 'success' | 'failure' | 'warning'
  before_value  jsonb,                  -- safe snapshot BEFORE change (no secrets)
  after_value   jsonb,                  -- safe snapshot AFTER change (no secrets)
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Performance indexes for pagination and filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at   ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id      ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module       ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action       ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result       ON audit_logs(result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);
-- Composite index for common filter combination
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action  ON audit_logs(user_id, action, created_at DESC);

-- ============================================================================
-- 2. AUDIT LOGS ARCHIVE (cold storage — same schema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs_archive (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id   uuid,                   -- original audit_logs.id before archival
  user_id       uuid,
  user_email    text,
  user_name     text,
  department    text,
  role          text,
  action        text NOT NULL,
  module        text NOT NULL,
  page          text,
  description   text,
  entity_type   text,
  entity_id     text,
  ip_address    text,
  user_agent    text,
  result        text NOT NULL DEFAULT 'success',
  before_value  jsonb,
  after_value   jsonb,
  created_at    timestamptz NOT NULL,
  archived_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_archive_created_at ON audit_logs_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_user_id    ON audit_logs_archive(user_id);

-- ============================================================================
-- 3. SYSTEM SETTINGS (key/value store per category)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text NOT NULL,            -- 'general', 'crm', 'finance', 'hr', 'security', 'system', etc.
  key         text NOT NULL,            -- machine-readable key, e.g. 'company_name'
  value       jsonb,                    -- stored as JSON to support all types
  label       text,                     -- human-readable label
  description text,                     -- help text
  updated_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at  timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key      ON system_settings(key);

-- ============================================================================
-- 4. INTEGRATION CONFIGS (safe metadata only — no secrets)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key         text NOT NULL UNIQUE,  -- 'tiktok', 'meta', 'linkedin', 'supabase_auth', etc.
  display_name            text NOT NULL,
  category                text NOT NULL,          -- 'social_media', 'email', 'storage', 'auth', 'analytics'
  is_enabled              boolean DEFAULT true,
  connection_status       text NOT NULL DEFAULT 'not_configured',
  -- 'connected' | 'disconnected' | 'not_configured' | 'error' | 'needs_attention' | 'syncing'
  connected_account_name  text,                   -- display name of the connected account (safe)
  connected_account_id    text,                   -- platform-side user/page ID (safe — not a token)
  last_sync_at            timestamptz,
  last_sync_status        text,                   -- 'success' | 'failure' | 'partial'
  last_sync_error         text,                   -- human-readable error (no stack traces with secrets)
  records_processed       integer,
  config                  jsonb DEFAULT '{}',     -- non-secret config (e.g. sync frequency)
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_integration_configs_key      ON integration_configs(integration_key);
CREATE INDEX IF NOT EXISTS idx_integration_configs_category ON integration_configs(category);
CREATE INDEX IF NOT EXISTS idx_integration_configs_status   ON integration_configs(connection_status);

-- ============================================================================
-- 5. INTEGRATION SYNC LOG (history of sync events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_sync_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key     text NOT NULL,
  status              text NOT NULL,    -- 'started' | 'success' | 'failure' | 'partial'
  records_processed   integer,
  error_message       text,             -- safe error message (no secrets/tokens)
  triggered_by        text DEFAULT 'manual',   -- 'manual' | 'scheduled' | 'oauth_callback'
  triggered_by_user   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  started_at          timestamptz DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sync_log_key        ON integration_sync_log(integration_key);
CREATE INDEX IF NOT EXISTS idx_sync_log_status     ON integration_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON integration_sync_log(started_at DESC);

-- ============================================================================
-- 6. SECURITY ALERT RULES (configurable thresholds for Section 20)
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_alert_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key          text NOT NULL UNIQUE,
  label             text NOT NULL,
  description       text,
  threshold_count   integer NOT NULL DEFAULT 5,
  threshold_minutes integer NOT NULL DEFAULT 10,
  is_enabled        boolean DEFAULT true,
  updated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_rules_key ON security_alert_rules(rule_key);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs_archive   ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alert_rules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES — AUDIT LOGS (immutable: no UPDATE/DELETE for any client role)
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_super_admin_select"   ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert"               ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_update"            ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete"            ON audit_logs;

-- Super Admin can read all audit logs
CREATE POLICY "audit_logs_super_admin_select" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Any authenticated user can INSERT (the server-side service creates log entries)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- IMMUTABILITY: Explicitly deny UPDATE and DELETE for all roles
-- This means even a super_admin cannot modify or delete audit records through the normal client
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE USING (false);

-- ============================================================================
-- RLS POLICIES — AUDIT LOGS ARCHIVE (read-only for super_admin)
-- ============================================================================

DROP POLICY IF EXISTS "audit_archive_super_admin_select" ON audit_logs_archive;
DROP POLICY IF EXISTS "audit_archive_insert"             ON audit_logs_archive;
DROP POLICY IF EXISTS "audit_archive_no_update"          ON audit_logs_archive;
DROP POLICY IF EXISTS "audit_archive_no_delete"          ON audit_logs_archive;

CREATE POLICY "audit_archive_super_admin_select" ON audit_logs_archive
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "audit_archive_insert" ON audit_logs_archive
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_archive_no_update" ON audit_logs_archive
  FOR UPDATE USING (false);

CREATE POLICY "audit_archive_no_delete" ON audit_logs_archive
  FOR DELETE USING (false);

-- ============================================================================
-- RLS POLICIES — SYSTEM SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "system_settings_read"   ON system_settings;
DROP POLICY IF EXISTS "system_settings_write"  ON system_settings;

CREATE POLICY "system_settings_read" ON system_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "system_settings_write" ON system_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- ============================================================================
-- RLS POLICIES — INTEGRATION CONFIGS
-- ============================================================================

DROP POLICY IF EXISTS "integration_configs_read"  ON integration_configs;
DROP POLICY IF EXISTS "integration_configs_write" ON integration_configs;

CREATE POLICY "integration_configs_read" ON integration_configs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "integration_configs_write" ON integration_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- RLS POLICIES — INTEGRATION SYNC LOG
-- ============================================================================

DROP POLICY IF EXISTS "sync_log_read"  ON integration_sync_log;
DROP POLICY IF EXISTS "sync_log_write" ON integration_sync_log;

CREATE POLICY "sync_log_read" ON integration_sync_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "sync_log_write" ON integration_sync_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- RLS POLICIES — SECURITY ALERT RULES
-- ============================================================================

DROP POLICY IF EXISTS "security_rules_read"  ON security_alert_rules;
DROP POLICY IF EXISTS "security_rules_write" ON security_alert_rules;

CREATE POLICY "security_rules_read" ON security_alert_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "security_rules_write" ON security_alert_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================================================
-- SEED: Default System Settings
-- ============================================================================

INSERT INTO system_settings (category, key, value, label, description) VALUES
  -- General
  ('general', 'company_name',      '"Omnia Travel"',         'Company Name',          'The trading name of the company'),
  ('general', 'company_email',     '"info@omniatravel.com"', 'Company Email',          'Primary contact email'),
  ('general', 'company_phone',     '""',                     'Company Phone',          'Primary contact phone number'),
  ('general', 'company_address',   '""',                     'Company Address',        'Registered business address'),
  ('general', 'default_currency',  '"USD"',                  'Default Currency',       'System-wide default currency'),
  ('general', 'timezone',          '"Africa/Cairo"',         'Timezone',               'Server and display timezone'),
  ('general', 'date_format',       '"DD/MM/YYYY"',           'Date Format',            'How dates are displayed throughout the system'),
  -- CRM
  ('crm', 'lead_auto_assign',      'false',                  'Auto-Assign Leads',      'Automatically assign new leads to available agents'),
  ('crm', 'quotation_expiry_days', '14',                     'Quotation Expiry (days)','Days until a quotation expires'),
  ('crm', 'default_lead_source',   '"website"',              'Default Lead Source',    'Pre-selected source when creating a new lead'),
  -- Finance
  ('finance', 'invoice_prefix',       '"INV"',               'Invoice Prefix',         'Prefix for invoice numbers'),
  ('finance', 'payment_terms_days',   '30',                  'Payment Terms (days)',   'Default payment terms in days'),
  ('finance', 'expense_approval_required', 'true',           'Expense Approval Required','Whether expenses above threshold require approval'),
  ('finance', 'expense_approval_threshold', '500',           'Expense Approval Threshold','Amount above which expense approval is required'),
  -- HR
  ('hr', 'work_hours_per_day',     '8',                      'Work Hours Per Day',     'Standard working hours per day'),
  ('hr', 'work_days_per_week',     '5',                      'Work Days Per Week',     'Standard working days per week'),
  ('hr', 'leave_year_start',       '"01-01"',                'Leave Year Start',       'Leave year start date (MM-DD)'),
  ('hr', 'payroll_run_day',        '25',                     'Payroll Run Day',        'Day of month payroll is processed'),
  -- Security
  ('security', 'session_timeout_minutes',  '480',            'Session Timeout (minutes)','Idle session timeout in minutes'),
  ('security', 'max_login_attempts',       '5',              'Max Failed Login Attempts','Failed attempts before account is flagged'),
  ('security', 'failed_login_window_minutes', '10',          'Failed Login Window (min)', 'Time window for counting failed login attempts'),
  -- System
  ('system', 'audit_retention_months',    '24',              'Audit Retention (months)','Months to keep audit logs before archiving'),
  ('system', 'maintenance_mode',          'false',           'Maintenance Mode',        'When enabled, only Super Admins can access the system'),
  ('system', 'items_per_page',            '25',              'Items Per Page',          'Default pagination size for list views')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================================
-- SEED: Default Security Alert Rules
-- ============================================================================

INSERT INTO security_alert_rules (rule_key, label, description, threshold_count, threshold_minutes, is_enabled) VALUES
  ('repeated_failed_logins', 'Repeated Failed Logins',
   'Alert when the same account fails login more than threshold_count times within threshold_minutes',
   5, 10, true),
  ('high_volume_deletions', 'High-Volume Record Deletions',
   'Alert when a single account performs more than threshold_count delete/remove actions within threshold_minutes',
   20, 60, true),
  ('rapid_location_change', 'Rapid IP Location Change',
   'Alert when the same account logs in from two different IPs within threshold_minutes',
   2, 5, true)
ON CONFLICT (rule_key) DO NOTHING;

-- ============================================================================
-- SEED: Default Integration Configs
-- (Reflects real state — connection_status set from actual social_accounts)
-- ============================================================================

INSERT INTO integration_configs (integration_key, display_name, category, connection_status, config) VALUES
  ('tiktok',       'TikTok',          'social_media', 'not_configured', '{"oauth": true}'),
  ('meta',         'Meta (Instagram & Facebook)', 'social_media', 'not_configured', '{"oauth": true}'),
  ('linkedin',     'LinkedIn',        'social_media', 'not_configured', '{"oauth": true}'),
  ('supabase_auth', 'Supabase Auth',  'auth',         'connected',      '{}'),
  ('supabase_storage', 'Supabase Storage', 'storage', 'connected',      '{}'),
  ('smtp_email',   'SMTP Email',      'email',        'not_configured', '{"host": "", "port": 587, "tls": true}')
ON CONFLICT (integration_key) DO NOTHING;

-- ============================================================================
-- GRANT-LEVEL IMMUTABILITY (run this once with service role in SQL Editor)
-- ============================================================================
-- The RLS DENY policies above block UPDATE/DELETE for normal authenticated clients.
-- For defense-in-depth, also revoke at the grant level so immutability doesn't
-- rely solely on RLS (which could theoretically be bypassed by future policy changes).
--
-- ⚠️ Run the following manually in the Supabase SQL Editor (requires service role):
--
-- REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
-- REVOKE UPDATE, DELETE ON public.audit_logs FROM anon;
-- REVOKE UPDATE, DELETE ON public.audit_logs_archive FROM authenticated;
-- REVOKE UPDATE, DELETE ON public.audit_logs_archive FROM anon;
--
-- After running: confirm with:
-- SELECT grantee, privilege_type FROM information_schema.role_table_grants
-- WHERE table_name = 'audit_logs';
-- ============================================================================
