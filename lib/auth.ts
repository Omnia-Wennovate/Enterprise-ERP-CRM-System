import type { Profile } from '@/types'
import { DEMO_CREDENTIALS } from './navigation'
import type { UserRole } from '@/types'

// Demo credentials - These are hardcoded demo accounts for testing
// In production, these would be actual database queries
const DEMO_USERS: Record<string, { password: string; role: UserRole; name: string }> = {
  'admin@omniatravel.com': { password: 'admin@123', role: 'super_admin', name: 'Super Admin' },
  'manager@omniatravel.com': { password: 'manager@123', role: 'admin', name: 'Manager' },
  'sales@omniatravel.com': { password: 'sales@123', role: 'sales_agent', name: 'Sales Agent' },
  'ops@omniatravel.com': { password: 'ops@123', role: 'operations', name: 'Operations Manager' },
  'finance@omniatravel.com': { password: 'finance@123', role: 'accountant', name: 'Accountant' },
  'hr@omniatravel.com': { password: 'hr@123', role: 'hr_manager', name: 'HR Manager' },
  'customer@omniatravel.com': { password: 'customer@123', role: 'customer', name: 'Customer' },
  'marketing@omniatravel.com': { password: 'marketing@123', role: 'marketing', name: 'Social Media Manager' },
}

import { createClient } from '@/lib/supabase/client'

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: Profile; token: string } | null> {
  // Demo authentication - validates against hardcoded credentials
  const user = DEMO_USERS[email]

  if (!user || user.password !== password) {
    return null
  }

  // Fetch real UUID from database if available to prevent UUID type errors
  const supabase = createClient()
  const { data: dbProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  // Create a mock profile
  const profile: Profile = {
    id: dbProfile?.id || `user_${email.split('@')[0]}`,
    full_name: user.name,
    first_name: user.name.split(' ')[0],
    last_name: user.name.split(' ').slice(1).join(' ') || '',
    role: user.role,
    avatar_url: null,
    phone: null,
    is_active: true,
    department: user.role === 'marketing' ? 'social_media' : user.role === 'hr_manager' ? 'hr' : user.role === 'accountant' ? 'finance' : user.role === 'operations' ? 'operations' : user.role === 'sales_agent' ? 'sales' : 'management',
    position: user.role === 'marketing' ? 'Social Media Manager' : user.role === 'hr_manager' ? 'HR Manager' : user.role === 'accountant' ? 'Accountant' : user.role === 'operations' ? 'Operations Manager' : user.role === 'sales_agent' ? 'Sales Agent' : 'Manager',
    created_at: new Date().toISOString(),
  }

  // Generate a mock token (in production, use actual JWT)
  const token = Buffer.from(JSON.stringify({ email, role: user.role })).toString('base64')

  return { user: profile, token }
}

export function getDemoCredential(role: UserRole) {
  return DEMO_CREDENTIALS[role]
}

export function getAllDemoCredentials() {
  return Object.entries(DEMO_CREDENTIALS).map(([role, creds]) => ({
    role,
    ...creds,
  }))
}
