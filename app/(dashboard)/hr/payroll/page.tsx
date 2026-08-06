import { PayrollDashboard } from '@/components/hr/payroll/PayrollDashboard'

export default function PayrollPage() {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  return <PayrollDashboard initialMonth={currentMonth} initialYear={currentYear} />
}
