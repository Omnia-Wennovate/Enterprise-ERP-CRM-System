'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { OmniaLogo } from '@/components/ui/OmniaLogo'
import type { Profile } from '@/types'

interface DashboardWrapperProps {
  children: React.ReactNode
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get profile from localStorage (set during login)
    const authUser = localStorage.getItem('auth_user')
    if (!authUser) {
      setIsLoading(false)
      // Use setTimeout to ensure router is initialized
      setTimeout(() => {
        router.push('/login')
      }, 50)
      return
    }

    try {
      const user = JSON.parse(authUser)
      setProfile(user)
    } catch (err) {
      setIsLoading(false)
      // Use setTimeout to ensure router is initialized
      setTimeout(() => {
        router.push('/login')
      }, 50)
      return
    }
    setIsLoading(false)
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
