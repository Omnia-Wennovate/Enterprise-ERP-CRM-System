-- ============================================================================
-- COMMUNICATION CENTER FIX — ADDITIVE MIGRATION
-- Run this in the Supabase SQL editor (Dashboard > SQL > New query)
-- Safe: no DROP TABLE, no data deletion, no schema-breaking changes
-- ============================================================================

-- ============================================================================
-- STEP 1: Add `department` column to department_channels (if not present)
-- ============================================================================

ALTER TABLE department_channels
  ADD COLUMN IF NOT EXISTS department TEXT;

-- ============================================================================
-- STEP 2: Populate the `department` column on existing channels
--         (matches channel name → department key convention)
-- ============================================================================

UPDATE department_channels SET department = 'general'     WHERE name = 'general'       AND department IS NULL;
UPDATE department_channels SET department = 'sales'       WHERE name = 'sales'          AND department IS NULL;
UPDATE department_channels SET department = 'operations'  WHERE name = 'operations'     AND department IS NULL;
UPDATE department_channels SET department = 'finance'     WHERE name = 'finance'        AND department IS NULL;
UPDATE department_channels SET department = 'hr'          WHERE name = 'hr'             AND department IS NULL;
UPDATE department_channels SET department = 'management'  WHERE name = 'management'     AND department IS NULL;
UPDATE department_channels SET department = 'general'     WHERE name = 'announcements'  AND department IS NULL;
UPDATE department_channels SET department = 'general'     WHERE name = 'support'        AND department IS NULL;
UPDATE department_channels SET department = 'marketing'   WHERE name = 'marketing'      AND department IS NULL;
UPDATE department_channels SET department = 'social_media'WHERE name ILIKE '%social%media%' AND department IS NULL;
UPDATE department_channels SET department = 'it'          WHERE name IN ('it', 'it-tech', 'technology') AND department IS NULL;

-- Also fix any channels whose department column was set but name changed
UPDATE department_channels SET department = 'general'
WHERE name IN ('general', 'announcements', 'support') AND department != 'general';

-- ============================================================================
-- STEP 3: Insert missing department-specific channels
--         (without creating duplicates — using ON CONFLICT DO NOTHING)
-- ============================================================================

INSERT INTO department_channels (name, description, icon, is_private, is_readonly, department)
VALUES
  ('marketing',           'Marketing team collaboration',                  'Megaphone', false, false, 'marketing'),
  ('social-media',        'Social Media team — strategy and campaigns',    'Share2',    false, false, 'social_media'),
  ('social-media-general','Social Media daily updates and coordination',   'Hash',      false, false, 'social_media'),
  ('it',                  'IT and Technology team discussions',            'Code',      false, false, 'it')
ON CONFLICT (name) DO UPDATE SET
  department = EXCLUDED.department
  WHERE department_channels.department IS NULL;

-- ============================================================================
-- STEP 4: Seed department_channel_members for ALL existing active employee profiles
--         Maps each profile's `department` to the correct channel(s)
--         Uses ON CONFLICT DO NOTHING — completely safe to re-run
-- ============================================================================

-- Helper: insert membership for a profile into all channels matching their department
-- Company-wide channels: all active employees become members
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND dc.name IN ('general', 'announcements', 'support')
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- Sales department
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND p.department = 'sales'
  AND dc.name = 'sales'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- Operations department
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND p.department = 'operations'
  AND dc.name = 'operations'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- Finance department
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND p.department = 'finance'
  AND dc.name = 'finance'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- HR department
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND p.department = 'hr'
  AND dc.name = 'hr'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- Management department → management channel (admins/managers)
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND (p.department = 'management' OR p.role IN ('super_admin', 'admin', 'manager', 'hr_manager'))
  AND dc.name = 'management'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- Marketing department (includes social_media sub-department)
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND (p.department IN ('marketing', 'social_media') OR p.department ILIKE '%marketing%' OR p.department ILIKE '%social%')
  AND dc.name IN ('marketing', 'social-media', 'social-media-general')
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- IT department
INSERT INTO department_channel_members (channel_id, profile_id, role)
SELECT dc.id, p.id, 'member'
FROM department_channels dc
CROSS JOIN profiles p
WHERE p.is_active = true
  AND (p.department IN ('it', 'technology') OR p.department ILIKE '%tech%' OR p.department ILIKE '%it%')
  AND dc.name = 'it'
ON CONFLICT (channel_id, profile_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Auto-provisioning trigger — new/re-departmented employee gets
--         automatically added to their department's existing channels
-- ============================================================================

CREATE OR REPLACE FUNCTION provision_employee_channels()
RETURNS TRIGGER AS $$
DECLARE
  v_dept TEXT;
  v_profile_id UUID;
  v_channel RECORD;
  v_dept_channel_name TEXT;
BEGIN
  v_profile_id := NEW.id;
  v_dept := LOWER(COALESCE(NEW.department, ''));

  -- Always add to company-wide channels
  INSERT INTO department_channel_members (channel_id, profile_id, role)
  SELECT dc.id, v_profile_id, 'member'
  FROM department_channels dc
  WHERE dc.name IN ('general', 'announcements', 'support')
  ON CONFLICT (channel_id, profile_id) DO NOTHING;

  -- Determine department channel name
  CASE
    WHEN v_dept = 'sales'        THEN v_dept_channel_name := 'sales';
    WHEN v_dept = 'operations'   THEN v_dept_channel_name := 'operations';
    WHEN v_dept = 'finance'      THEN v_dept_channel_name := 'finance';
    WHEN v_dept = 'hr'           THEN v_dept_channel_name := 'hr';
    WHEN v_dept = 'management'   THEN v_dept_channel_name := 'management';
    WHEN v_dept IN ('marketing', 'social_media') OR v_dept ILIKE '%social%' THEN
      v_dept_channel_name := 'social-media';
    WHEN v_dept IN ('it', 'technology') OR v_dept ILIKE '%tech%' THEN
      v_dept_channel_name := 'it';
    ELSE v_dept_channel_name := NULL;
  END CASE;

  IF v_dept_channel_name IS NOT NULL THEN
    -- Add to dept channel if it exists
    INSERT INTO department_channel_members (channel_id, profile_id, role)
    SELECT dc.id, v_profile_id, 'member'
    FROM department_channels dc
    WHERE dc.name = v_dept_channel_name
    ON CONFLICT (channel_id, profile_id) DO NOTHING;

    -- Also add to marketing channel for social_media employees
    IF v_dept IN ('marketing', 'social_media') OR v_dept ILIKE '%social%' OR v_dept ILIKE '%marketing%' THEN
      INSERT INTO department_channel_members (channel_id, profile_id, role)
      SELECT dc.id, v_profile_id, 'member'
      FROM department_channels dc
      WHERE dc.name IN ('marketing', 'social-media', 'social-media-general')
      ON CONFLICT (channel_id, profile_id) DO NOTHING;
    END IF;
  ELSE
    -- Department [v_dept] has no channels configured — log to audit if table exists
    BEGIN
      INSERT INTO communication_audit_log (action, table_name, record_id, performed_by, new_values)
      VALUES (
        'PROVISION_WARN',
        'department_channel_members',
        v_profile_id,
        v_profile_id,
        jsonb_build_object('warning', format('Department [%s] has no channels configured for profile %s', v_dept, v_profile_id))
      );
    EXCEPTION WHEN OTHERS THEN
      NULL; -- audit log table may not exist in all deployments
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present, then re-create
DROP TRIGGER IF EXISTS trg_provision_employee_channels ON profiles;

CREATE TRIGGER trg_provision_employee_channels
AFTER INSERT OR UPDATE OF department ON profiles
FOR EACH ROW
EXECUTE FUNCTION provision_employee_channels();

-- ============================================================================
-- STEP 6: Notifications table — ensure it exists + add deduplication constraint
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  message        text NOT NULL,
  type           text NOT NULL DEFAULT 'info',
  recipient_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  related_to_id  text,
  related_to_type text,
  is_read        boolean DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Deduplication: a recipient can't get the same notification type for the
-- same source record twice (prevents double-click / retry duplicates)
-- Drop first in case it exists under a different name, then add cleanly
DO $$
BEGIN
  -- Add the unique constraint only if it doesn't exist yet
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND constraint_name = 'notifications_recipient_type_source_unique'
  ) THEN
    -- Remove any pre-existing duplicates before adding constraint
    DELETE FROM notifications n1
    USING notifications n2
    WHERE n1.id > n2.id
      AND n1.recipient_id = n2.recipient_id
      AND n1.type = n2.type
      AND n1.related_to_id = n2.related_to_id
      AND n1.related_to_id IS NOT NULL;

    ALTER TABLE notifications
      ADD CONSTRAINT notifications_recipient_type_source_unique
      UNIQUE (recipient_id, type, related_to_id);
  END IF;
END $$;

-- RLS: enable and create permissive policy (matches existing app pattern)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all notifications" ON notifications;
CREATE POLICY "Allow all notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Grant access to anon + authenticated (required for Supabase anon key)
GRANT ALL ON notifications TO anon, authenticated;

-- ============================================================================
-- STEP 7: Ensure `department_channel_members` permissions are correct
-- ============================================================================

GRANT ALL ON department_channels TO anon, authenticated;
GRANT ALL ON department_channel_members TO anon, authenticated;
GRANT ALL ON channel_messages TO anon, authenticated;
GRANT ALL ON announcements TO anon, authenticated;
GRANT ALL ON announcement_reads TO anon, authenticated;
GRANT ALL ON tasks_from_messages TO anon, authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (run these after the script to confirm)
-- ============================================================================

-- Q1: David's channel memberships (should now return rows)
-- SELECT p.full_name, p.department, dc.name AS channel_name, dcm.role
-- FROM profiles p
-- LEFT JOIN department_channel_members dcm ON dcm.profile_id = p.id
-- LEFT JOIN department_channels dc ON dc.id = dcm.channel_id
-- WHERE p.full_name = 'David Bezuneh';

-- Q2: Channel list with department assignment
-- SELECT name, department, is_private, is_readonly FROM department_channels ORDER BY name;

-- Q3: Membership counts per channel
-- SELECT dc.name, dc.department, COUNT(dcm.id) AS member_count
-- FROM department_channels dc
-- LEFT JOIN department_channel_members dcm ON dcm.channel_id = dc.id
-- GROUP BY dc.name, dc.department ORDER BY dc.name;

-- Q4: Schema confirmation
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
-- AND table_name IN ('department_channels','department_channel_members','channels','announcements','announcement_reads','notification_preferences','profiles','notifications')
-- ORDER BY table_name, ordinal_position;
