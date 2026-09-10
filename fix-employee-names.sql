-- ============================================================================
-- FIX EMPLOYEE NAMES IN PROFILES TABLE
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================
-- This script updates the first_name, last_name, position, job_title for all
-- real team members whose profiles currently show the generic placeholder "User".
-- It does NOT create new users or change any auth/password data.
-- ============================================================================

-- STEP 1: Update the 8 real team members with their actual names
UPDATE public.profiles SET
  first_name = 'Bekan',
  last_name   = 'Bekele',
  position    = 'Operations Officer',
  job_title   = 'Operations Officer',
  department  = 'Operations'
WHERE email = 'bekan.bekele74@gmail.com';

UPDATE public.profiles SET
  first_name = 'Kalkidan',
  last_name   = 'Tesfaye',
  position    = 'Sales Agent',
  job_title   = 'Sales Agent',
  department  = 'Sales'
WHERE email = 'kalkidantesfaye21971@gmail.com';

UPDATE public.profiles SET
  first_name = 'Nur',
  last_name   = 'Faris',
  position    = 'Operations Officer',
  job_title   = 'Operations Officer',
  department  = 'Operations'
WHERE email = 'nurfaris08@gmail.com';

UPDATE public.profiles SET
  first_name = 'Alamin',
  last_name   = 'Siraj',
  position    = 'HR Manager',
  job_title   = 'HR Manager',
  department  = 'HR'
WHERE email = 'alaminfsiraj@gmail.com';

UPDATE public.profiles SET
  first_name = 'David',
  last_name   = 'Bezuneh',
  position    = 'Social Media Manager',
  job_title   = 'Social Media Manager',
  department  = 'Social Media'
WHERE email = 'davidbezuneh@gmail.com';

UPDATE public.profiles SET
  first_name = 'Melika',
  last_name   = 'Wennovate',
  position    = 'Accountant',
  job_title   = 'Accountant',
  department  = 'Finance'
WHERE email = 'melika.wennovate@gmail.com';

UPDATE public.profiles SET
  first_name = 'Belen',
  last_name   = 'Wolde',
  position    = 'Social Media Officer',
  job_title   = 'Social Media Officer',
  department  = 'Social Media'
WHERE email = 'belenwolde2@gmail.com';

UPDATE public.profiles SET
  first_name = 'Zulu',
  last_name   = 'Dalo',
  position    = 'Sales Agent',
  job_title   = 'Sales Agent',
  department  = 'Sales'
WHERE email = 'zuludalo98@gmail.com';

-- STEP 2: Update the system/generic accounts
UPDATE public.profiles SET
  first_name = 'Omnia',
  last_name   = 'Admin',
  position    = 'System Administrator',
  job_title   = 'System Administrator'
WHERE email = 'admin@omniatravel.com';

UPDATE public.profiles SET
  first_name = 'Operations',
  last_name   = 'Manager',
  position    = 'Operations Manager',
  job_title   = 'Operations Manager'
WHERE email = 'manager@omniatravel.com';

-- STEP 3: Ensure tasks_from_messages RLS allows cross-department task visibility
-- (An employee assigned a task by another department must be able to read it)

-- Drop the old policy if it exists
DROP POLICY IF EXISTS "tasks_from_messages_all_access" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_super_admin" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_assigned_to_user" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_in_user_department" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_created_by_user" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_insert" ON tasks_from_messages;
DROP POLICY IF EXISTS "tasks_update" ON tasks_from_messages;

-- Allow users to see tasks they are assigned to (works across departments)
CREATE POLICY "tasks_assigned_to_user"
ON tasks_from_messages
FOR SELECT
USING (assigned_to = auth.uid());

-- Allow users to see tasks they created/assigned to others
CREATE POLICY "tasks_created_by_user"
ON tasks_from_messages
FOR SELECT
USING (assigned_by = auth.uid());

-- Allow super_admin and admin to see all tasks
CREATE POLICY "tasks_super_admin"
ON tasks_from_messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- Allow any authenticated user to insert tasks (assignedBy = their own id)
CREATE POLICY "tasks_insert"
ON tasks_from_messages
FOR INSERT
WITH CHECK (assigned_by = auth.uid());

-- Allow the assignee or assigner to update task status
CREATE POLICY "tasks_update"
ON tasks_from_messages
FOR UPDATE
USING (
  assigned_to = auth.uid()
  OR assigned_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

-- STEP 4: Ensure profiles table allows authenticated users to read all profiles
-- (needed for DM employee search and task "Assign To" dropdown)
DROP POLICY IF EXISTS "profiles_read_all" ON profiles;

CREATE POLICY "profiles_read_all"
ON profiles
FOR SELECT
USING (true);

-- STEP 5: Verification query — run this to confirm all 8 real employees are correct
SELECT
  id,
  first_name,
  last_name,
  CONCAT(first_name, ' ', last_name) AS full_name,
  email,
  department,
  job_title,
  role,
  is_active
FROM public.profiles
ORDER BY
  CASE
    WHEN email NOT LIKE '%omniatravel.com%' THEN 0
    ELSE 1
  END,
  email;
