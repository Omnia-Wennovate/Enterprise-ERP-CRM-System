import type { ReactNode } from 'react'

export const metadata = {
  title: 'Dashboard - Omnia Travel CRM',
  description: 'Omnia Travel CRM & ERP System',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
