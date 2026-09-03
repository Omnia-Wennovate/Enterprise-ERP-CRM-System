// ============================================================================
// DEPARTMENT VISUAL IDENTITY CONFIG
// Accent colors per department — subtle whisper layer over Omnia navy/gold
// ============================================================================

export type DepartmentKey =
  | 'sales'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'marketing'
  | 'management'
  | 'it'
  | 'customer_service'
  | 'social_media'
  | 'general'

export interface DepartmentConfig {
  key: DepartmentKey | string
  label: string
  /** Muted accent — used for left-border, top-border stripe, dot */
  accent: string
  /** Tailwind bg class for card accent stripe */
  accentBg: string
  /** Tailwind border class */
  accentBorder: string
  /** Tailwind text class */
  accentText: string
  /** Lucide icon name */
  iconName: string
  /** Emoji fallback */
  emoji: string
}

export const DEPARTMENT_CONFIG: Record<string, DepartmentConfig> = {
  sales: {
    key: 'sales',
    label: 'Sales',
    accent: '#f59e0b',
    accentBg: 'bg-amber-500',
    accentBorder: 'border-l-amber-500',
    accentText: 'text-amber-600',
    iconName: 'TrendingUp',
    emoji: '📈',
  },
  operations: {
    key: 'operations',
    label: 'Operations',
    accent: '#0ea5e9',
    accentBg: 'bg-sky-500',
    accentBorder: 'border-l-sky-500',
    accentText: 'text-sky-600',
    iconName: 'Truck',
    emoji: '🚛',
  },
  finance: {
    key: 'finance',
    label: 'Finance',
    accent: '#6366f1',
    accentBg: 'bg-indigo-500',
    accentBorder: 'border-l-indigo-500',
    accentText: 'text-indigo-600',
    iconName: 'DollarSign',
    emoji: '💰',
  },
  hr: {
    key: 'hr',
    label: 'Human Resources',
    accent: '#22c55e',
    accentBg: 'bg-green-500',
    accentBorder: 'border-l-green-500',
    accentText: 'text-green-600',
    iconName: 'Users',
    emoji: '👥',
  },
  marketing: {
    key: 'marketing',
    label: 'Marketing',
    accent: '#ec4899',
    accentBg: 'bg-pink-500',
    accentBorder: 'border-l-pink-500',
    accentText: 'text-pink-600',
    iconName: 'Megaphone',
    emoji: '📣',
  },
  social_media: {
    key: 'social_media',
    label: 'Social Media',
    accent: '#ec4899',
    accentBg: 'bg-pink-500',
    accentBorder: 'border-l-pink-500',
    accentText: 'text-pink-600',
    iconName: 'Share2',
    emoji: '📱',
  },
  management: {
    key: 'management',
    label: 'Management',
    accent: '#64748b',
    accentBg: 'bg-slate-500',
    accentBorder: 'border-l-slate-500',
    accentText: 'text-slate-600',
    iconName: 'Shield',
    emoji: '🛡️',
  },
  it: {
    key: 'it',
    label: 'IT / Technology',
    accent: '#8b5cf6',
    accentBg: 'bg-violet-500',
    accentBorder: 'border-l-violet-500',
    accentText: 'text-violet-600',
    iconName: 'Code',
    emoji: '💻',
  },
  customer_service: {
    key: 'customer_service',
    label: 'Customer Service',
    accent: '#14b8a6',
    accentBg: 'bg-teal-500',
    accentBorder: 'border-l-teal-500',
    accentText: 'text-teal-600',
    iconName: 'HeadphonesIcon',
    emoji: '🎧',
  },
  general: {
    key: 'general',
    label: 'Company-Wide',
    accent: '#a3a3a3',
    accentBg: 'bg-neutral-400',
    accentBorder: 'border-l-neutral-400',
    accentText: 'text-neutral-500',
    iconName: 'Globe',
    emoji: '🌐',
  },
}

export function getDepartmentConfig(dept: string | null | undefined): DepartmentConfig {
  if (!dept) return DEPARTMENT_CONFIG.general
  const normalized = dept.toLowerCase().replace(/[\s-]/g, '_')
  return DEPARTMENT_CONFIG[normalized] || DEPARTMENT_CONFIG.general
}

/** Maps channel names to department keys */
export function getChannelDepartment(channelName: string): string {
  const map: Record<string, string> = {
    general: 'general',
    sales: 'sales',
    operations: 'operations',
    finance: 'finance',
    hr: 'hr',
    marketing: 'marketing',
    management: 'management',
    announcements: 'general',
    support: 'general',
  }
  return map[channelName.toLowerCase()] || 'general'
}
