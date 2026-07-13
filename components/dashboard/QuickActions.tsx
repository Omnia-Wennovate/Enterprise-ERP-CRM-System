'use client'

import { ArrowRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { UserRole } from '@/types'

interface QuickActionProps {
  icon: string
  label: string
  href: string
}

const ROLE_ACTIONS: Record<UserRole, QuickActionProps[]> = {
  super_admin: [
    { icon: 'Plus', label: 'New Lead', href: '/crm/leads' },
    { icon: 'FileText', label: 'New Quote', href: '/crm/quotes' },
    { icon: 'BarChart2', label: 'View Reports', href: '/finance/reports' },
    { icon: 'Users', label: 'Manage Staff', href: '/hr/staff' },
  ],
  admin: [
    { icon: 'Plus', label: 'New Lead', href: '/crm/leads' },
    { icon: 'FileText', label: 'New Quote', href: '/crm/quotes' },
    { icon: 'Activity', label: 'Log Activity', href: '/crm/activities' },
    { icon: 'BarChart2', label: 'View Reports', href: '/finance/reports' },
  ],
  sales_agent: [
    { icon: 'Plus', label: 'New Lead', href: '/crm/leads' },
    { icon: 'FileText', label: 'New Quote', href: '/crm/quotes' },
    { icon: 'Activity', label: 'Log Activity', href: '/crm/activities' },
    { icon: 'TrendingUp', label: 'View Pipeline', href: '/crm/leads' },
  ],
  operations: [
    { icon: 'Plane', label: 'View Bookings', href: '/bookings' },
    { icon: 'BookOpen', label: 'Visa Tracker', href: '/bookings/visa' },
    { icon: 'FileText', label: 'Upload Docs', href: '/bookings/documents' },
    { icon: 'Map', label: 'View Itineraries', href: '/bookings/itineraries' },
  ],
  accountant: [
    { icon: 'Plus', label: 'New Invoice', href: '/finance/invoices' },
    { icon: 'CreditCard', label: 'Record Payment', href: '/finance/payments' },
    { icon: 'BarChart2', label: 'View Reports', href: '/finance/reports' },
    { icon: 'Download', label: 'Export Data', href: '/finance/reports' },
  ],
  hr_manager: [
    { icon: 'UserPlus', label: 'Invite Staff', href: '/hr/invite' },
    { icon: 'Target', label: 'Set Targets', href: '/hr/targets' },
    { icon: 'Trophy', label: 'View Leaderboard', href: '/hr/leaderboard' },
    { icon: 'Calendar', label: 'Leave Requests', href: '/hr/leave' },
  ],
  customer: [
    { icon: 'Plane', label: 'View My Trips', href: '/customer/trips' },
    { icon: 'FileText', label: 'My Documents', href: '/customer/documents' },
    { icon: 'Receipt', label: 'My Invoices', href: '/customer/invoices' },
    { icon: 'User', label: 'My Profile', href: '/customer/profile' },
  ],
}

function getIconComponent(iconName: string) {
  const icons: Record<string, any> = {
    Plus: LucideIcons.Plus,
    FileText: LucideIcons.FileText,
    BarChart2: LucideIcons.BarChart2,
    Users: LucideIcons.Users,
    Activity: LucideIcons.Activity,
    TrendingUp: LucideIcons.TrendingUp,
    Plane: LucideIcons.Plane,
    BookOpen: LucideIcons.BookOpen,
    CreditCard: LucideIcons.CreditCard,
    Download: LucideIcons.Download,
    UserPlus: LucideIcons.UserPlus,
    Target: LucideIcons.Target,
    Trophy: LucideIcons.Trophy,
    Calendar: LucideIcons.Calendar,
    Map: LucideIcons.Map,
    Receipt: LucideIcons.Receipt,
    User: LucideIcons.User,
  }
  return icons[iconName] || LucideIcons.Circle
}

interface QuickActionsProps {
  role: UserRole
}

export function QuickActions({ role }: QuickActionsProps) {
  const actions = ROLE_ACTIONS[role] || []

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-[#0B1F33] mb-4">What would you like to do?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = getIconComponent(action.icon)
          return (
            <button
              key={action.label}
              onClick={() => window.location.href = action.href}
              className="bg-white border border-[#BFDBFE] rounded-xl p-4 hover:border-[#0A8FA8] hover:bg-[#F0F7FA] transition-all duration-150 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-[#F0F7FA] group-hover:bg-[#0A8FA8]/10 p-2 rounded-lg transition-colors">
                  <Icon className="text-[#0A8FA8]" size={20} />
                </div>
                <ArrowRight
                  className="text-[#0A8FA8] opacity-0 group-hover:opacity-100 transition-opacity"
                  size={18}
                />
              </div>
              <p className="font-medium text-[#0B1F33] text-sm">{action.label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
