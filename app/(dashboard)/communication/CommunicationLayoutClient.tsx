'use client'

import { useEffect, useState } from 'react'
import { PresenceProvider } from '@/components/communication/PresenceProvider'
import { CommandPalette, useCommandPalette } from '@/components/communication/CommandPalette'

interface CommunicationLayoutClientProps {
  children: React.ReactNode
}

export function CommunicationLayoutClient({ children }: CommunicationLayoutClientProps) {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string>('employee')
  const { isOpen, close } = useCommandPalette()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        setProfileId(user.id || null)
        setUserRole(user.role || 'employee')
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <PresenceProvider profileId={profileId}>
      {children}
      <CommandPalette
        profileId={profileId || ''}
        userRole={userRole}
        isOpen={isOpen}
        onClose={close}
      />
    </PresenceProvider>
  )
}
