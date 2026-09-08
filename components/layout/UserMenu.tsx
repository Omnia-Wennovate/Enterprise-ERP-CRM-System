'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown, Palette } from 'lucide-react'
import type { Profile } from '@/types'
import { useEnhancedTheme } from './../theme-provider'
import { resolveUserNames, getInitials } from '@/lib/utils/user-name'

interface UserMenuProps {
  profile: Profile
}

export function UserMenu({ profile }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { isColorblindSafe, setColorblindSafe } = useEnhancedTheme()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = resolveUserNames(profile).full_name

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-background rounded-lg transition-colors text-sm"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-omnia-gold/20 text-omnia-gold border border-omnia-gold/30">
          {getInitials(displayName)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="font-medium text-foreground text-xs">{displayName}</p>
          <p className="text-muted-foreground text-xs capitalize">{profile.role.replace(/_/g, ' ')}</p>
        </div>
        <ChevronDown size={16} className="text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <p className="font-medium text-foreground text-sm">{displayName}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role.replace(/_/g, ' ')}</p>
          </div>

          <div className="p-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-background rounded-lg transition-colors text-sm">
              <User size={16} />
              My Profile
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-background rounded-lg transition-colors text-sm">
              <Settings size={16} />
              Settings
            </button>
            <div className="border-t border-border my-1 mx-2" />
            <button 
              onClick={() => setColorblindSafe(!isColorblindSafe)}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-background rounded-lg transition-colors text-sm ${isColorblindSafe ? 'text-primary' : 'text-foreground'}`}
            >
              <Palette size={16} />
              Colorblind Charts
            </button>
          </div>

          <div className="p-1 border-t border-border">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
