import type { UserRole, NavSection } from '@/types'

export const getNavForRole = (role: UserRole): NavSection[] => {
  const baseNav: Record<UserRole, NavSection[]> = {
    super_admin: [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'HR Overview', href: '/hr', icon: 'Users' },
        ],
      },
      {
        title: 'CRM',
        items: [
          { label: 'Leads', href: '/crm/leads', icon: 'KanbanSquare' },
          { label: 'Customers', href: '/crm/customers', icon: 'Users' },
          { label: 'Quotations', href: '/crm/quotes', icon: 'FileText' },
        ],
      },
      {
        title: 'Bookings',
        items: [
          { label: 'All Bookings', href: '/bookings', icon: 'Plane', badge: 0 },
          { label: 'Itineraries', href: '/bookings/itineraries', icon: 'Map' },
          { label: 'Visa Tracker', href: '/bookings/visa', icon: 'BookOpen', badge: 0 },
          { label: 'Documents', href: '/bookings/documents', icon: 'FolderOpen' },
        ],
      },
      {
        title: 'Suppliers',
        items: [
          { label: 'Supplier Database', href: '/suppliers', icon: 'Building' },
        ],
      },
      {
        title: 'Finance',
        items: [
          { label: 'Invoices', href: '/finance/invoices', icon: 'Receipt', badge: 0 },
          { label: 'Payments', href: '/finance/payments', icon: 'CreditCard' },
          { label: 'Expenses', href: '/finance/expenses', icon: 'TrendingDown' },
          { label: 'Reports', href: '/finance/reports', icon: 'BarChart2' },
          { label: 'Supplier Payments', href: '/finance/supplier-payments', icon: 'Building2' },
          { label: 'Commissions', href: '/finance/commissions', icon: 'Award' },
        ],
      },
      {
        title: 'HR',
        items: [
          { label: 'HR Dashboard', href: '/hr', icon: 'LayoutDashboard' },
          { label: 'Employees', href: '/hr/employees', icon: 'Users' },
          { label: 'Attendance', href: '/hr/attendance', icon: 'Clock' },
          { label: 'Leave Management', href: '/hr/leave', icon: 'Calendar', badge: 0 },
          { label: 'Payroll', href: '/hr/payroll', icon: 'DollarSign' },
          { label: 'Performance', href: '/hr/performance', icon: 'TrendingUp' },
          { label: 'Recruitment', href: '/hr/recruitment', icon: 'Briefcase' },
          { label: 'Onboarding', href: '/hr/onboarding', icon: 'CheckCircle' },
          { label: 'Training', href: '/hr/training', icon: 'BookOpen' },
          { label: 'Assets', href: '/hr/assets', icon: 'Package' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Social Media Team',
        items: [
          { label: 'Marketing Dashboard', href: '/marketing/dashboard', icon: 'Megaphone' },
          { label: 'Social Accounts', href: '/marketing/accounts', icon: 'Share2' },
          { label: 'Content', href: '/marketing/content', icon: 'PenTool' },
          { label: 'Calendar', href: '/marketing/calendar', icon: 'CalendarDays' },
          { label: 'Campaigns', href: '/marketing/campaigns', icon: 'Target' },
          { label: 'Leads', href: '/marketing/leads', icon: 'UserPlus' },
          { label: 'Engagement', href: '/marketing/engagement', icon: 'MessageCircle' },
          { label: 'Ads', href: '/marketing/ads', icon: 'Monitor' },
          { label: 'Influencers', href: '/marketing/influencers', icon: 'Star' },
          { label: 'Media Library', href: '/marketing/media-library', icon: 'Image' },
          { label: 'Production', href: '/marketing/production-requests', icon: 'Video' },
          { label: 'Weekly Planner', href: '/marketing/weekly-planner', icon: 'ClipboardList' },
          { label: 'Team', href: '/marketing/team', icon: 'Users' },
          { label: 'Reports', href: '/marketing/reports', icon: 'BarChart2' },
        ],
      },
      {
        title: 'Technology',
        items: [
          { label: 'Tech Dashboard', href: '/tech/dashboard', icon: 'Cpu' },
          { label: 'Projects', href: '/tech/projects', icon: 'Code2' },
          { label: 'Feature Requests', href: '/tech/feature-requests', icon: 'GitBranch' },
          { label: 'Tech Team', href: '/tech/team', icon: 'Users' },
        ],
      },
      {
        title: 'System',
        items: [
          { label: 'Settings', href: '/settings', icon: 'Settings' },
          { label: 'Integrations', href: '/integrations', icon: 'Zap' },
          { label: 'Audit Log', href: '/audit-log', icon: 'FileText' },
        ],
      },
    ],
    admin: [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'CRM',
        items: [
          { label: 'Leads', href: '/crm/leads', icon: 'KanbanSquare' },
          { label: 'Customers', href: '/crm/customers', icon: 'Users' },
          { label: 'Quotations', href: '/crm/quotes', icon: 'FileText' },
          { label: 'Activities', href: '/crm/activities', icon: 'Activity' },
        ],
      },
      {
        title: 'Bookings',
        items: [
          { label: 'All Bookings', href: '/bookings', icon: 'Plane', badge: 0 },
          { label: 'Itineraries', href: '/bookings/itineraries', icon: 'Map' },
          { label: 'Visa Tracker', href: '/bookings/visa', icon: 'BookOpen', badge: 0 },
          { label: 'Documents', href: '/bookings/documents', icon: 'FolderOpen' },
        ],
      },
      {
        title: 'Finance',
        items: [
          { label: 'Invoices', href: '/finance/invoices', icon: 'Receipt', badge: 0 },
          { label: 'Payments', href: '/finance/payments', icon: 'CreditCard' },
          { label: 'Expenses', href: '/finance/expenses', icon: 'TrendingDown' },
          { label: 'Reports', href: '/finance/reports', icon: 'BarChart2' },
          { label: 'Commissions', href: '/finance/commissions', icon: 'Award' },
        ],
      },
      {
        title: 'HR',
        items: [
          { label: 'HR Dashboard', href: '/hr', icon: 'LayoutDashboard' },
          { label: 'Employees', href: '/hr/employees', icon: 'Users' },
          { label: 'Attendance', href: '/hr/attendance', icon: 'Clock' },
          { label: 'Leave Management', href: '/hr/leave', icon: 'Calendar', badge: 0 },
          { label: 'Payroll', href: '/hr/payroll', icon: 'DollarSign' },
          { label: 'Performance', href: '/hr/performance', icon: 'TrendingUp' },
          { label: 'Training', href: '/hr/training', icon: 'BookOpen' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Social Media Team',
        items: [
          { label: 'Marketing Dashboard', href: '/marketing/dashboard', icon: 'Megaphone' },
          { label: 'Social Accounts', href: '/marketing/accounts', icon: 'Share2' },
          { label: 'Content', href: '/marketing/content', icon: 'PenTool' },
          { label: 'Calendar', href: '/marketing/calendar', icon: 'CalendarDays' },
          { label: 'Campaigns', href: '/marketing/campaigns', icon: 'Target' },
          { label: 'Leads', href: '/marketing/leads', icon: 'UserPlus' },
          { label: 'Engagement', href: '/marketing/engagement', icon: 'MessageCircle' },
          { label: 'Ads', href: '/marketing/ads', icon: 'Monitor' },
          { label: 'Influencers', href: '/marketing/influencers', icon: 'Star' },
          { label: 'Media Library', href: '/marketing/media-library', icon: 'Image' },
          { label: 'Production', href: '/marketing/production-requests', icon: 'Video' },
          { label: 'Weekly Planner', href: '/marketing/weekly-planner', icon: 'ClipboardList' },
          { label: 'Team', href: '/marketing/team', icon: 'Users' },
          { label: 'Reports', href: '/marketing/reports', icon: 'BarChart2' },
        ],
      },
      {
        title: 'Technology',
        items: [
          { label: 'Tech Dashboard', href: '/tech/dashboard', icon: 'Cpu' },
          { label: 'Projects', href: '/tech/projects', icon: 'Code2' },
          { label: 'Feature Requests', href: '/tech/feature-requests', icon: 'GitBranch' },
          { label: 'Tech Team', href: '/tech/team', icon: 'Users' },
        ],
      },
      {
        title: 'System',
        items: [
          { label: 'Settings', href: '/settings', icon: 'Settings' },
        ],
      },
    ],
    sales_agent: [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'CRM',
        items: [
          { label: 'My Leads', href: '/crm/leads', icon: 'KanbanSquare' },
          { label: 'My Customers', href: '/crm/customers', icon: 'Users' },
          { label: 'Quotations', href: '/crm/quotes', icon: 'FileText' },
          { label: 'Activities', href: '/crm/activities', icon: 'Activity' },
        ],
      },
      {
        title: 'My Work',
        items: [
          { label: 'My Tasks', href: '/tasks', icon: 'CheckSquare', badge: 2 },
          { label: 'My Performance', href: '/performance', icon: 'TrendingUp' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Restricted',
        items: [
          { label: 'Finance', href: '#', icon: 'DollarSign', locked: true },
          { label: 'Reports', href: '#', icon: 'BarChart2', locked: true },
          { label: 'HR', href: '#', icon: 'UserCheck', locked: true },
          { label: 'Settings', href: '#', icon: 'Settings', locked: true },
        ],
      },
    ],
    operations: [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'Operations',
        items: [
          { label: 'Bookings', href: '/bookings', icon: 'Plane', badge: 24 },
          { label: 'Itineraries', href: '/bookings/itineraries', icon: 'Map' },
          { label: 'Visa Tracker', href: '/bookings/visa', icon: 'BookOpen', badge: 5 },
          { label: 'Documents', href: '/bookings/documents', icon: 'FolderOpen', badge: 4 },
          { label: 'Suppliers', href: '/suppliers', icon: 'Building' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Restricted',
        items: [
          { label: 'Finance', href: '#', icon: 'DollarSign', locked: true },
          { label: 'Sales', href: '#', icon: 'KanbanSquare', locked: true },
          { label: 'HR', href: '#', icon: 'UserCheck', locked: true },
          { label: 'Settings', href: '#', icon: 'Settings', locked: true },
        ],
      },
    ],
    accountant: [
      {
        title: 'Main',
        items: [
          { label: 'Finance Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'Finance',
        items: [
          { label: 'Invoices', href: '/finance/invoices', icon: 'Receipt', badge: 3 },
          { label: 'Payments', href: '/finance/payments', icon: 'CreditCard' },
          { label: 'Expenses', href: '/finance/expenses', icon: 'TrendingDown' },
          { label: 'Reports', href: '/finance/reports', icon: 'BarChart2' },
          { label: 'Supplier Payments', href: '/finance/supplier-payments', icon: 'Building2' },
          { label: 'Commissions', href: '/finance/commissions', icon: 'Award' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Restricted',
        items: [
          { label: 'CRM', href: '#', icon: 'KanbanSquare', locked: true },
          { label: 'HR', href: '#', icon: 'UserCheck', locked: true },
          { label: 'Operations', href: '#', icon: 'Plane', locked: true },
          { label: 'Settings', href: '#', icon: 'Settings', locked: true },
        ],
      },
    ],
    hr_manager: [
      {
        title: 'Main',
        items: [
          { label: 'HR Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'Employees',
        items: [
          { label: 'All Employees', href: '/hr/employees', icon: 'Users' },
          { label: 'Attendance', href: '/hr/attendance', icon: 'Clock' },
          { label: 'Onboarding', href: '/hr/onboarding', icon: 'CheckCircle' },
          { label: 'Assets', href: '/hr/assets', icon: 'Package' },
        ],
      },
      {
        title: 'Leave & Payroll',
        items: [
          { label: 'Leave Requests', href: '/hr/leave', icon: 'Calendar', badge: 3 },
          { label: 'Payroll', href: '/hr/payroll', icon: 'DollarSign' },
          { label: 'Performance Reviews', href: '/hr/performance', icon: 'TrendingUp' },
        ],
      },
      {
        title: 'Recruitment & Training',
        items: [
          { label: 'Recruitment', href: '/hr/recruitment', icon: 'Briefcase' },
          { label: 'Training', href: '/hr/training', icon: 'BookOpen' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
      {
        title: 'Restricted',
        items: [
          { label: 'Finance', href: '#', icon: 'Receipt', locked: true },
          { label: 'CRM', href: '#', icon: 'Users', locked: true },
          { label: 'Settings', href: '#', icon: 'Settings', locked: true },
        ],
      },
    ],
    customer: [
      {
        title: 'My Account',
        items: [
          { label: 'My Trips', href: '/customer/trips', icon: 'Plane' },
          { label: 'Documents', href: '/customer/documents', icon: 'FileText' },
          { label: 'Invoices', href: '/customer/invoices', icon: 'Receipt' },
          { label: 'Profile', href: '/customer/profile', icon: 'User' },
        ],
      },
    ],
  }

  // Marketing / Social Media Team demo account
  if (role === 'marketing' as any) {
    return [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'Social Media Team',
        items: [
          { label: 'Marketing Dashboard', href: '/marketing/dashboard', icon: 'Megaphone' },
          { label: 'Social Accounts', href: '/marketing/accounts', icon: 'Share2' },
          { label: 'Content', href: '/marketing/content', icon: 'PenTool' },
          { label: 'Calendar', href: '/marketing/calendar', icon: 'CalendarDays' },
          { label: 'Campaigns', href: '/marketing/campaigns', icon: 'Target' },
          { label: 'Leads', href: '/marketing/leads', icon: 'UserPlus' },
          { label: 'Engagement', href: '/marketing/engagement', icon: 'MessageCircle' },
          { label: 'Ads', href: '/marketing/ads', icon: 'Monitor' },
          { label: 'Influencers', href: '/marketing/influencers', icon: 'Star' },
          { label: 'Media Library', href: '/marketing/media-library', icon: 'Image' },
          { label: 'Production', href: '/marketing/production-requests', icon: 'Video' },
          { label: 'Weekly Planner', href: '/marketing/weekly-planner', icon: 'ClipboardList' },
          { label: 'Team', href: '/marketing/team', icon: 'Users' },
          { label: 'Reports', href: '/marketing/reports', icon: 'BarChart2' },
        ],
      },
    ]
  }

  // Technology Department team account
  if (role === 'technology' as any) {
    return [
      {
        title: 'Main',
        items: [
          { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
        ],
      },
      {
        title: 'Technology',
        items: [
          { label: 'Tech Dashboard', href: '/tech/dashboard', icon: 'Cpu' },
          { label: 'Projects', href: '/tech/projects', icon: 'Code2' },
          { label: 'Feature Requests', href: '/tech/feature-requests', icon: 'GitBranch' },
          { label: 'Tech Team', href: '/tech/team', icon: 'Users' },
        ],
      },
      {
        title: 'Communication',
        items: [
          { label: 'Communication Center', href: '/communication', icon: 'MessageSquare', badge: 0 },
        ],
      },
    ]
  }

  return baseNav[role] || []
}

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; name: string }> = {
  super_admin: { email: 'admin@omniatravel.com', password: 'admin@123', name: 'Super Admin' },
  admin: { email: 'manager@omniatravel.com', password: 'manager@123', name: 'Manager' },
  sales_agent: { email: 'sales@omniatravel.com', password: 'sales@123', name: 'Sales Agent' },
  operations: { email: 'ops@omniatravel.com', password: 'ops@123', name: 'Operations Manager' },
  accountant: { email: 'finance@omniatravel.com', password: 'finance@123', name: 'Accountant' },
  hr_manager: { email: 'hr@omniatravel.com', password: 'hr@123', name: 'HR Manager' },
  customer: { email: 'customer@omniatravel.com', password: 'customer@123', name: 'Customer' },
  marketing: { email: 'marketing@omniatravel.com', password: 'marketing@123', name: 'Social Media Manager' },
}
