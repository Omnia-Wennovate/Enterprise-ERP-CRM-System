/**
 * Omnia Travel — Design Tokens (TypeScript)
 * 
 * Single source of truth for all brand color values referenced in JS/TSX.
 * CSS custom properties in globals.css are the primary source;
 * this file mirrors them for inline styles, chart configs, and dynamic usage.
 */

export const omnia = {
  gold: '#C8A951',
  goldLight: '#E2CC7E',
  goldDark: '#A88B3A',
  navy: '#0F1B2D',
  navyLight: '#1A2A42',
  navyDark: '#0A1221',
  warmWhite: '#FAFAF7',
} as const

/** Accent colors for KPI cards, charts, and status indicators */
export const statusColors = {
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
} as const

/** Chart color palette — matches --chart-1 through --chart-5 in globals.css */
export const chartColors = {
  light: [omnia.navy, omnia.gold, omnia.navyLight, '#3B82F6', '#6366F1'],
  dark: [omnia.gold, '#60A5FA', '#34D399', '#A78BFA', '#FB923C'],
} as const

/** KPI card accent colors — used by StatsCard / KpiCard */
export const kpiAccents = {
  revenue: omnia.gold,
  bookings: omnia.navy,
  leads: '#D97706',
  outstanding: '#DC2626',
  profit: '#16A34A',
  staff: omnia.navyLight,
  commission: omnia.goldDark,
  default: omnia.gold,
} as const

/** Spacing scale — rem values matching Tailwind defaults */
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
} as const
