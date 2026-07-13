'use client'

import { getHourGreeting } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import type { UserRole } from '@/types'

interface WelcomeBannerProps {
  firstName: string
  role: UserRole
}

function getRoleMessage(role: UserRole): string {
  const messages: Record<UserRole, string> = {
    super_admin: 'Welcome to your command center',
    admin: 'You have full system access',
    sales_agent: 'You have 12 leads in your pipeline',
    operations: '24 active bookings need attention',
    accountant: '8 invoices are outstanding',
    hr_manager: '3 leave requests need approval',
    customer: "Welcome to your travel portal",
  }
  return messages[role] || 'Welcome back'
}

function getRoleIcon(role: UserRole) {
  const icons: Record<UserRole, any> = {
    super_admin: LucideIcons.Settings,
    admin: LucideIcons.LayoutDashboard,
    sales_agent: LucideIcons.TrendingUp,
    operations: LucideIcons.Plane,
    accountant: LucideIcons.DollarSign,
    hr_manager: LucideIcons.Users,
    customer: LucideIcons.MapPin,
  }
  return icons[role] || LucideIcons.BarChart2
}

export function WelcomeBanner({ firstName, role }: WelcomeBannerProps) {
  const Icon = getRoleIcon(role)
  const greeting = getHourGreeting()
  const message = getRoleMessage(role)

  return (
    <div className="bg-gradient-to-r from-[#0B2A3D] to-[#0A8FA8] rounded-2xl p-8 mb-8 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-[#E0F2F7] text-lg">{message}</p>
        </div>

        {/* Decorative icon */}
        <div className="flex-shrink-0 opacity-20">
          <Icon size={80} />
        </div>
      </div>
    </div>
  )
}
