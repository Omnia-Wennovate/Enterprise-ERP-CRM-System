'use client'

import { getHourGreeting } from '@/lib/utils'
import { OmniaLogo } from '@/components/ui/OmniaLogo'
import type { UserRole } from '@/types'

interface WelcomeBannerProps {
  firstName: string
  role: UserRole
}

function getRoleMessage(role: UserRole): string {
  const messages: Record<UserRole, string> = {
    super_admin: 'Welcome to your command center',
    admin: 'You have full system access',
    sales_agent: 'Your sales pipeline awaits',
    operations: 'Active bookings need attention',
    accountant: 'Financial overview at a glance',
    hr_manager: 'People management dashboard',
    customer: "Welcome to your travel portal",
    marketing: 'Marketing command center',
  }
  return messages[role] || 'Welcome back'
}

export function WelcomeBanner({ firstName, role }: WelcomeBannerProps) {
  const greeting = getHourGreeting()
  const message = getRoleMessage(role)

  return (
    <div
      className="rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0A1221 0%, #0F1B2D 60%, #1A2A42 100%)' }}
    >
      {/* Gold decorative accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #C8A951, transparent)' }} />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-1.5">
            {greeting}, {firstName}
          </h1>
          <p className="text-white/50 text-sm">{message}</p>
        </div>

        {/* Omnia logo watermark */}
        <div className="flex-shrink-0 opacity-[0.08]">
          <OmniaLogo variant="icon" theme="light" size={120} />
        </div>
      </div>
    </div>
  )
}
