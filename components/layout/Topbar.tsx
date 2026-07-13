'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { MobileSidebar } from './MobileSidebar'
import type { Profile } from '@/types'

interface TopbarProps {
  profile: Profile
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/crm/leads': 'Leads',
  '/crm/customers': 'Customers',
  '/crm/quotes': 'Quotations',
  '/crm/activities': 'Activities',
  '/bookings': 'Bookings',
  '/bookings/itineraries': 'Itineraries',
  '/bookings/visa': 'Visa Tracker',
  '/bookings/documents': 'Documents',
  '/suppliers': 'Suppliers',
  '/finance/invoices': 'Invoices',
  '/finance/payments': 'Payments',
  '/finance/expenses': 'Expenses',
  '/finance/reports': 'Reports',
  '/finance/supplier-payments': 'Supplier Payments',
  '/finance/commissions': 'Commissions',
  '/hr/staff': 'Staff',
  '/hr/targets': 'Targets',
  '/hr/leaderboard': 'Leaderboard',
  '/hr/leave': 'Leave Requests',
  '/hr/payroll': 'Payroll',
  '/hr/performance': 'Performance',
  '/tasks': 'My Tasks',
  '/performance': 'My Performance',
  '/settings': 'Settings',
  '/marketing/dashboard': 'Marketing Dashboard',
  '/marketing/accounts': 'Social Accounts',
  '/marketing/content': 'Content Management',
  '/marketing/calendar': 'Content Calendar',
  '/marketing/campaigns': 'Campaign Management',
  '/marketing/leads': 'Social Media Leads',
  '/marketing/engagement': 'Customer Engagement',
  '/marketing/ads': 'Advertisement Management',
  '/marketing/influencers': 'Influencer Management',
  '/marketing/media-library': 'Media Library',
  '/marketing/production-requests': 'Production Requests',
  '/marketing/weekly-planner': 'Weekly Content Planner',
  '/marketing/team': 'Marketing Team',
  '/marketing/reports': 'Marketing Reports',
  '/tech/dashboard': 'Technology Dashboard',
  '/tech/projects': 'Software Projects',
  '/tech/projects/new': 'New Project',
  '/tech/feature-requests': 'Feature Requests',
  '/tech/feature-requests/new': 'New Feature Request',
  '/tech/team': 'Technology Team',
}

export function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard'

  return (
    <div className="h-14 bg-white border-b border-[#BFDBFE] shadow-sm flex items-center justify-between px-6">
      {/* Left Side */}
      <div className="flex items-center gap-4 flex-1">
        <MobileSidebar profile={profile} />
        <h2 className="text-[#0B1F33] font-medium text-sm hidden md:block">{pageTitle}</h2>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden lg:flex items-center gap-2 bg-[#F0F7FA] border border-[#BFDBFE] rounded-full px-3 py-2 focus-within:border-[#0A8FA8] focus-within:ring-2 focus-within:ring-[#0A8FA8]/20 transition-all w-60">
          <Search className="text-[#4B6B7A]" size={16} />
          <input
            type="text"
            placeholder="Search customers, bookings..."
            className="bg-transparent text-sm text-[#0B1F33] placeholder-[#94A3B8] outline-none flex-1"
          />
        </div>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Menu */}
        <UserMenu profile={profile} />
      </div>
    </div>
  )
}
