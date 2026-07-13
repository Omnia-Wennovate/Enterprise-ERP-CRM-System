'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import type { Profile } from '@/types'
import { Loader2 } from 'lucide-react'

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
      <div className="min-h-screen bg-[#F0F7FA] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0A8FA8]" size={48} />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F7FA]">
      <Sidebar profile={profile} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
