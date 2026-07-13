'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'

interface UserMenuProps {
  profile: Profile
}

export function UserMenu({ profile }: UserMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-[#F0F7FA] rounded-lg transition-colors text-sm"
      >
        <div className="w-8 h-8 bg-[#0A8FA8] rounded-full flex items-center justify-center text-white text-xs font-medium">
          {getInitials(profile.full_name)}
        </div>
        <div className="hidden sm:block text-left">
          <p className="font-medium text-[#0B1F33] text-xs">{profile.full_name}</p>
          <p className="text-[#4B6B7A] text-xs capitalize">{profile.role.replace(/_/g, ' ')}</p>
        </div>
        <ChevronDown size={16} className="text-[#4B6B7A]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#BFDBFE] rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-[#DBEAFE]">
            <p className="font-medium text-[#0B1F33] text-sm">{profile.full_name}</p>
            <p className="text-xs text-[#4B6B7A] capitalize">{profile.role.replace(/_/g, ' ')}</p>
          </div>

          <div className="p-1">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-[#0B1F33] hover:bg-[#F0F7FA] rounded-lg transition-colors text-sm">
              <User size={16} />
              My Profile
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-[#0B1F33] hover:bg-[#F0F7FA] rounded-lg transition-colors text-sm">
              <Settings size={16} />
              Settings
            </button>
          </div>

          <div className="p-1 border-t border-[#DBEAFE]">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
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
