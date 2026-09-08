import type { ReactNode } from 'react'
import { DashboardWrapper } from '@/components/dashboard/DashboardWrapper'

export const metadata = {
  title: 'Dashboard - Omnia Travel CRM',
  description: 'Omnia Travel CRM & ERP System',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardWrapper>{children}</DashboardWrapper>
}
