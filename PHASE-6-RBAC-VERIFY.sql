-- ============================================================================
-- PHASE 6: RBAC VERIFICATION QUERIES
-- Run these as different users to verify RBAC is working
-- ============================================================================

-- ============================================================================
-- 1. VERIFY RLS POLICIES ARE ENABLED ON ALL TABLES
-- ============================================================================

-- Run as super_admin
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations', 'conversation_members', 'messages', 'message_reads',
    'message_reactions', 'message_attachments', 'department_channels',
    'department_channel_members', 'channel_messages', 'announcements',
    'announcement_reads', 'notification_preferences', 'tasks_from_messages',
    'polls', 'poll_options', 'poll_votes', 'meeting_rooms',
    'meeting_participants', 'user_presence', 'message_bookmarks',
    'message_mentions', 'communication_audit_log'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK HELPER FUNCTIONS EXIST
-- ============================================================================

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_role',
    'get_user_department',
    'is_super_admin',
    'is_admin',
    'is_manager'
  )
ORDER BY routine_name;

-- ============================================================================
-- 3. TEST: SUPER ADMIN SEES ALL CONVERSATIONS
-- ============================================================================

-- Super Admin should see all conversations
SELECT 
  id,
  type,
  title,
  created_by,
  (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = conversations.id) as member_count,
  created_at
FROM conversations
LIMIT 10;

-- Expected: Shows conversations from all users
-- Actual super admin ID: [check auth.uid()]

-- ============================================================================
-- 4. TEST: HR MANAGER SEES ONLY DEPARTMENT CHANNELS
-- ============================================================================

-- HR Manager logged in: SELECT * FROM auth.users WHERE role = 'hr_manager'
-- Should only see: general, hr, announcements, support
SELECT 
  id,
  name,
  description,
  is_private,
  is_readonly,
  created_at
FROM department_channels
ORDER BY name;

-- Expected for HR Manager: general, hr, announcements, support
-- Expected to NOT see: management, finance, sales, operations, crm

-- ============================================================================
-- 5. TEST: HR MANAGER SEES ONLY HR ANNOUNCEMENTS
-- ============================================================================

-- HR Manager should only see announcements targeting 'hr' or 'all'
SELECT 
  id,
  title,
  target_roles,
  category,
  published_at
FROM announcements
WHERE published_at IS NOT NULL
ORDER BY published_at DESC;

-- Expected: Only announcements with 'hr' or 'all' in target_roles

-- ============================================================================
-- 6. TEST: FINANCE CANNOT SEE HR COMMUNICATIONS
-- ============================================================================

-- Finance Manager logged in
-- Should NOT see HR channel messages
SELECT 
  cm.id,
  dc.name as channel_name,
  cm.content,
  cm.sender_id,
  cm.created_at
FROM channel_messages cm
JOIN department_channels dc ON dc.id = cm.channel_id
WHERE dc.name = 'hr'
ORDER BY cm.created_at DESC;

-- Expected for Finance Manager: 0 rows (access denied)
-- Expected for HR Manager: Shows all HR channel messages

-- ============================================================================
-- 7. TEST: EMPLOYEE ONLY SEES PERSONAL CONVERSATIONS
-- ============================================================================

-- Regular Employee logged in
-- Should only see:
-- - Conversations they're a participant of
-- - General, announcements, support channels
-- - No private channels or other departments

SELECT 
  id,
  type,
  title,
  (SELECT COUNT(*) FROM conversation_members WHERE conversation_id = conversations.id) as members,
  created_at
FROM conversations
WHERE type = 'direct'
ORDER BY created_at DESC;

-- Expected for Employee: Only conversations where they are a member

-- ============================================================================
-- 8. TEST: MANAGER SEES TEAM TASKS
-- ============================================================================

-- HR Manager (manager of HR team)
-- Should see:
-- - Tasks assigned to them
-- - Tasks assigned to their team members (same department)
-- - NOT tasks from other departments

SELECT 
  id,
  title,
  assigned_to,
  priority,
  status,
  created_at
FROM tasks_from_messages
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Expected: Only tasks assigned to HR team or to the manager

-- ============================================================================
-- 9. TEST: MEETING VISIBILITY
-- ============================================================================

-- Any user should only see meetings they're invited to
SELECT 
  mr.id,
  mr.title,
  mr.organizer_id,
  mr.meeting_date,
  mr.start_time,
  (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = mr.id) as participant_count
FROM meeting_rooms mr
ORDER BY mr.meeting_date DESC;

-- Expected: Only meetings where user is organizer or participant

-- ============================================================================
-- 10. AUDIT LOG - SUPER ADMIN ONLY
-- ============================================================================

-- Super Admin sees all audit logs
-- Other users: access denied
SELECT 
  id,
  action,
  table_name,
  record_id,
  performed_by,
  created_at
FROM communication_audit_log
ORDER BY created_at DESC
LIMIT 20;

-- Expected for Super Admin: Shows all audit records
-- Expected for Others: Access denied

-- ============================================================================
-- 11. VERIFY ROLE ASSIGNMENTS
-- ============================================================================

SELECT 
  id,
  email,
  role,
  department,
  full_name
FROM profiles
WHERE role IS NOT NULL
ORDER BY role, department;

-- Should show all user role and department assignments

-- ============================================================================
-- 12. TEST SEARCH - HR SEARCHING SHOULD NOT FIND FINANCE DISCUSSIONS
-- ============================================================================

-- HR Manager searches for "Invoice" (Finance keyword)
-- Should return 0 results because they can't access Finance messages
SELECT 
  id,
  content,
  sender_id,
  created_at
FROM messages
WHERE content ILIKE '%invoice%'
  OR content ILIKE '%payroll%'
ORDER BY created_at DESC;

-- Expected for HR Manager: 0 or only HR-team results
-- Expected for Finance Manager: Shows Finance team results

-- ============================================================================
-- 13. LIST ALL RLS POLICIES FOR SPECIFIC TABLE
-- ============================================================================

SELECT 
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- Should show all RLS policies for messages table

-- ============================================================================
-- 14. CHECK IF RLS IS ENABLED
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_class 
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations', 'messages', 'department_channels',
    'channel_messages', 'announcements', 'meeting_rooms'
  )
ORDER BY tablename;

-- Expected: rowsecurity = true for all communication tables

-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
--
-- After running these queries, verify:
--
-- ✓ All 22 tables have RLS enabled (rowsecurity = true)
-- ✓ All helper functions exist
-- ✓ Super Admin sees all data
-- ✓ HR Manager CANNOT see Finance, Sales, Operations channels
-- ✓ Finance Manager CANNOT see HR, Sales, Operations channels
-- ✓ Employee CANNOT see admin channels
-- ✓ Search results filtered by RLS
-- ✓ Sidebar counts only count accessible items
-- ✓ Audit log only visible to Super Admin
-- ✓ Meeting visibility limited to invited participants
-- ✓ Task visibility limited appropriately
-- ✓ Announcement visibility respects target_roles
--
-- If any of these fail, re-run phase-6-rbac-policies.sql
--
-- ============================================================================
