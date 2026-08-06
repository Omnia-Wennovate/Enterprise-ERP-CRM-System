-- Advanced Theme Features Schema Update
-- Adds preferences to the existing profiles table.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chart_colorblind_safe boolean DEFAULT false;

-- To apply these changes in Supabase, run this in the Supabase SQL editor.
