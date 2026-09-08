-- ============================================================================
-- UPDATE EXISTING USER ROLES & DEPARTMENTS
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================================
-- 
-- This script:
--   1. Updates the profiles table role/department for 8 existing users
--   2. Resets their passwords via auth.users
--   3. Does NOT create new users, tables, or change any other data
--
-- Department → Role mapping (matches existing system):
--   Operations   → role: 'operations'
--   Sales        → role: 'sales_agent'
--   HR           → role: 'hr_manager'
--   Social Media → role: 'marketing'
--   Finance      → role: 'accountant'
-- ============================================================================

-- STEP 1: Verify these users exist before making any changes
-- (Run this SELECT first to confirm all 8 emails are found)
SELECT
  u.id,
  u.email,
  p.role AS current_role,
  p.department AS current_department
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'bekan.bekele74@gmail.com',
  'kalkidantesfaye21971@gmail.com',
  'nurfaris08@gmail.com',
  'alaminfsiraj@gmail.com',
  'davidbezuneh@gmail.com',
  'melika.wennovate@gmail.com',
  'belenwolde2@gmail.com',
  'zuludalo98@gmail.com'
);

-- ============================================================================
-- STEP 2: Update profiles table (role + department)
-- ============================================================================

-- bekan.bekele74@gmail.com → Operations
UPDATE public.profiles
SET
  role = 'operations',
  department = 'Operations'
WHERE id = (SELECT id FROM auth.users WHERE email = 'bekan.bekele74@gmail.com');

-- kalkidantesfaye21971@gmail.com → Sales
UPDATE public.profiles
SET
  role = 'sales_agent',
  department = 'Sales'
WHERE id = (SELECT id FROM auth.users WHERE email = 'kalkidantesfaye21971@gmail.com');

-- nurfaris08@gmail.com → Operations
UPDATE public.profiles
SET
  role = 'operations',
  department = 'Operations'
WHERE id = (SELECT id FROM auth.users WHERE email = 'nurfaris08@gmail.com');

-- alaminfsiraj@gmail.com → HR
UPDATE public.profiles
SET
  role = 'hr_manager',
  department = 'HR'
WHERE id = (SELECT id FROM auth.users WHERE email = 'alaminfsiraj@gmail.com');

-- davidbezuneh@gmail.com → Social Media
UPDATE public.profiles
SET
  role = 'marketing',
  department = 'Social Media'
WHERE id = (SELECT id FROM auth.users WHERE email = 'davidbezuneh@gmail.com');

-- melika.wennovate@gmail.com → Finance
UPDATE public.profiles
SET
  role = 'accountant',
  department = 'Finance'
WHERE id = (SELECT id FROM auth.users WHERE email = 'melika.wennovate@gmail.com');

-- belenwolde2@gmail.com → Social Media
UPDATE public.profiles
SET
  role = 'marketing',
  department = 'Social Media'
WHERE id = (SELECT id FROM auth.users WHERE email = 'belenwolde2@gmail.com');

-- zuludalo98@gmail.com → Sales
UPDATE public.profiles
SET
  role = 'sales_agent',
  department = 'Sales'
WHERE id = (SELECT id FROM auth.users WHERE email = 'zuludalo98@gmail.com');

-- ============================================================================
-- STEP 3: Reset passwords via auth.users
-- Each user gets a unique temporary password
-- ============================================================================

-- bekan.bekele74@gmail.com  → Omnia#Bk2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Bk2025!', gen_salt('bf'))
WHERE email = 'bekan.bekele74@gmail.com';

-- kalkidantesfaye21971@gmail.com → Omnia#Kt2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Kt2025!', gen_salt('bf'))
WHERE email = 'kalkidantesfaye21971@gmail.com';

-- nurfaris08@gmail.com → Omnia#Nf2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Nf2025!', gen_salt('bf'))
WHERE email = 'nurfaris08@gmail.com';

-- alaminfsiraj@gmail.com → Omnia#As2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#As2025!', gen_salt('bf'))
WHERE email = 'alaminfsiraj@gmail.com';

-- davidbezuneh@gmail.com → Omnia#Db2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Db2025!', gen_salt('bf'))
WHERE email = 'davidbezuneh@gmail.com';

-- melika.wennovate@gmail.com → Omnia#Mw2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Mw2025!', gen_salt('bf'))
WHERE email = 'melika.wennovate@gmail.com';

-- belenwolde2@gmail.com → Omnia#Bw2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Bw2025!', gen_salt('bf'))
WHERE email = 'belenwolde2@gmail.com';

-- zuludalo98@gmail.com → Omnia#Zd2025!
UPDATE auth.users
SET encrypted_password = crypt('Omnia#Zd2025!', gen_salt('bf'))
WHERE email = 'zuludalo98@gmail.com';

-- ============================================================================
-- STEP 4: Verify changes applied correctly
-- Run this after the updates to confirm everything is correct
-- ============================================================================
SELECT
  u.email,
  p.role,
  p.department,
  u.updated_at AS password_reset_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  'bekan.bekele74@gmail.com',
  'kalkidantesfaye21971@gmail.com',
  'nurfaris08@gmail.com',
  'alaminfsiraj@gmail.com',
  'davidbezuneh@gmail.com',
  'melika.wennovate@gmail.com',
  'belenwolde2@gmail.com',
  'zuludalo98@gmail.com'
)
ORDER BY u.email;
