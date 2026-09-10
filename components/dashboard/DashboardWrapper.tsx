'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { OmniaLogo } from '@/components/ui/OmniaLogo'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

import { ProfileContext } from '@/lib/context/profile-context'
import { resolveUserNames } from '@/lib/utils/user-name'

interface DashboardWrapperProps {
  children: React.ReactNode
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()

      // Get authenticated user from Supabase session
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setIsLoading(false)
        router.push('/login')
        return
      }

      // Fetch the user's profile row (role + department)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Build a safe profile with fallbacks for any missing columns or records
      let safeProfile: Profile
      if (profileData) {
        const safe = profileData as any
        // resolveUserNames checks KNOWN_USER_NAMES and email to produce a real name
        // even when DB first_name is the generic placeholder 'User'
        const resolved = resolveUserNames(
          {
            full_name: safe.full_name,
            first_name: safe.first_name,
            email: user.email,
          },
          user.email
        )

        safeProfile = {
          ...safe,
          id: user.id,
          email: user.email || safe.email || '',
          role: safe.role || (user.email?.toLowerCase().includes('marketing') ? 'marketing' : 'super_admin'),
          department: safe.department || 'Management',
          full_name: resolved.full_name,
          first_name: resolved.first_name,
          is_active: safe.is_active ?? true,
          avatar_url: safe.avatar_url ?? null,
          phone: safe.phone ?? null,
        }
      } else {
        // No profile row yet — build minimal profile from auth user
        const resolved = resolveUserNames({ email: user.email }, user.email)
        const emailLower = (user.email || '').toLowerCase()
        const role = emailLower.includes('marketing') ? 'marketing' : 'super_admin'
        safeProfile = {
          id: user.id,
          email: user.email || '',
          role: role as any,
          department: role === 'marketing' ? 'Social Media' : 'Administration',
          full_name: resolved.full_name,
          first_name: resolved.first_name,
          is_active: true,
          avatar_url: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(safeProfile))
      }
      setProfile(safeProfile)
      setIsLoading(false)
    }

    loadUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <OmniaLogo variant="full" theme="dark" size={72} />
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-omnia-gold animate-pulse" />
          <span>Loading your workspace</span>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <ProfileContext.Provider value={profile}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar profile={profile} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProfileContext.Provider>
  )
}
