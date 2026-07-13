# Supabase Sign-In Integration Guide

This guide walks you through integrating Supabase authentication with TravelOS demo credentials.

## Prerequisites

- Supabase project created and configured
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables set

## Step 1: Create Profiles Table in Supabase

Go to your Supabase dashboard → **SQL Editor** → **New Query** and run:

```sql
-- Create profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Allow public read for role info"
  ON public.profiles FOR SELECT
  USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, first_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'customer'),
    COALESCE(new.raw_user_meta_data ->> 'first_name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 2: Create Demo Users in Supabase

In your Supabase dashboard, go to **Authentication → Users** and click **Add user** for each:

### User 1: Super Admin
- **Email:** admin@omniatravel.com
- **Password:** admin@123
- **User metadata:**
```json
{
  "role": "super_admin",
  "first_name": "Admin"
}
```

### User 2: Sales Agent
- **Email:** sales@omniatravel.com
- **Password:** sales@123
- **User metadata:**
```json
{
  "role": "sales_agent",
  "first_name": "Sarah"
}
```

### User 3: Operations Manager
- **Email:** ops@omniatravel.com
- **Password:** ops@123
- **User metadata:**
```json
{
  "role": "operations",
  "first_name": "Operations"
}
```

### User 4: Accountant
- **Email:** finance@omniatravel.com
- **Password:** finance@123
- **User metadata:**
```json
{
  "role": "accountant",
  "first_name": "Finance"
}
```

### User 5: HR Manager
- **Email:** hr@omniatravel.com
- **Password:** hr@123
- **User metadata:**
```json
{
  "role": "hr_manager",
  "first_name": "HR"
}
```

### User 6: Customer
- **Email:** customer@omniatravel.com
- **Password:** customer@123
- **User metadata:**
```json
{
  "role": "customer",
  "first_name": "John"
}
```

## Step 3: Code Files (Already Created)

The following files have been created/updated to support Supabase auth:

### New Files:
- `lib/supabase-auth.ts` - Authentication functions
- `app/auth/callback/route.ts` - OAuth callback handler

### Updated Files:
- `components/auth/LoginForm.tsx` - Now uses Supabase sign-in
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client

## Step 4: Update Dashboard Wrapper

The dashboard needs to check Supabase auth instead of localStorage. Update `components/dashboard/DashboardWrapper.tsx`:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-auth'
import type { Profile } from '@/types'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser)
      } catch (err) {
        console.error('[v0] Error loading user:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
```

## Step 5: Create Auth Error Page

Create `app/auth/error/page.tsx`:

```typescript
export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F7FA]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">Something went wrong during sign-in</p>
        <a href="/login" className="text-[#0A8FA8] hover:underline">
          Back to Login
        </a>
      </div>
    </div>
  )
}
```

## Step 6: Create Sign Out Handler

Update `components/layout/UserMenu.tsx` to call `signOut()`:

```typescript
import { signOut } from '@/lib/supabase-auth'
import { useRouter } from 'next/navigation'

export function UserMenu() {
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('[v0] Sign out error:', err)
    }
  }

  return (
    // ... existing menu code ...
    <button onClick={handleSignOut}>Sign Out</button>
  )
}
```

## Step 7: Test the Integration

1. **Test login flow:**
   - Go to `/login`
   - Click any demo credential button
   - Should redirect to dashboard on success

2. **Test protected routes:**
   - Try accessing `/bookings`, `/crm/leads`, etc. while logged out
   - Should redirect to login

3. **Test sign out:**
   - Click "Sign Out" in user menu
   - Should redirect to login

## Troubleshooting

### Error: "Could not find the table 'public.profiles'"
- Make sure you ran the SQL to create the profiles table

### Error: "User not found"
- Verify the user was created in Supabase Auth with correct metadata

### Error: "Invalid email or password"
- Check that the password matches exactly (case-sensitive)
- Verify the user exists in Supabase → Authentication → Users

### Sign in works but dashboard not loading
- Check browser console for errors
- Verify `getCurrentUser()` is fetching profile correctly
- Check that profiles table has data

## Architecture

The auth system now works as follows:

1. User enters email/password on login page
2. `signInWithEmail()` calls Supabase auth
3. On success, Supabase returns session
4. User redirected to `/dashboard`
5. Dashboard calls `getCurrentUser()` to fetch profile from DB
6. Profile data populates navigation and role-based menus
7. Sign out clears Supabase session

All other features (bookings, CRM, tasks) can now use `getCurrentUser()` to get the current authenticated user.

## Next Steps

Once this is working:
- Update RLS policies to enforce role-based access
- Add more user fields to profiles as needed
- Implement invite/signup workflows
- Add user management admin panel
