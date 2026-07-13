import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types'

// Map Supabase roles to internal roles
const roleMap: Record<string, UserRole> = {
  super_admin: 'super_admin',
  admin: 'admin',
  sales_agent: 'sales_agent',
  operations: 'operations',
  accountant: 'accountant',
  hr_manager: 'hr_manager',
  customer: 'customer',
}

export async function signUpWithEmail(email: string, password: string, role: UserRole = 'customer') {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        role,
        first_name: email.split('@')[0],
      },
    },
  })

  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[v0] Error fetching profile:', profileError)
    return null
  }

  // Map to internal Profile type
  const role = roleMap[profile?.role] || 'customer'
  const internalProfile: Profile = {
    id: user.id,
    full_name: profile?.first_name || user.email?.split('@')[0] || 'User',
    role,
    avatar_url: null,
    phone: null,
    is_active: true,
    created_at: user.created_at || new Date().toISOString(),
  }

  return internalProfile
}

export async function getUserSession() {
  const supabase = createClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) return null
  return session
}

export async function updateUserProfile(updates: Partial<Profile>) {
  const supabase = createClient()

  const user = await getCurrentUser()
  if (!user) throw new Error('No user logged in')

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

  if (error) throw error
}
