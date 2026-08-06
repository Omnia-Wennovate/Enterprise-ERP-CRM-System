'use server'

import {
  generatePayrollForPeriod,
  getPayrollByPeriod,
  getPayrollKPIs,
  getDepartmentPayroll,
  getMonthlyTrend,
  getPayrollHistory,
  getPayrollInsights,
  getActiveEmployees,
  updatePayrollStatus,
  bulkUpdatePayrollStatus,
} from '@/lib/services/payroll'
import { revalidatePath } from 'next/cache'

export async function actionGeneratePayroll(month: number, year: number, force = false) {
  const result = await generatePayrollForPeriod(month, year, force)
  if (result.success) revalidatePath('/hr/payroll')
  return result
}

export async function actionGetPayroll(month: number, year: number) {
  return getPayrollByPeriod(month, year)
}

export async function actionGetKPIs(month: number, year: number) {
  return getPayrollKPIs(month, year)
}

export async function actionGetDepartmentPayroll(month: number, year: number) {
  return getDepartmentPayroll(month, year)
}

export async function actionGetMonthlyTrend(monthsBack = 6) {
  return getMonthlyTrend(monthsBack)
}

export async function actionGetPayrollHistory() {
  return getPayrollHistory(12)
}

export async function actionGetInsights(month: number, year: number) {
  return getPayrollInsights(month, year)
}

export async function actionGetActiveEmployees() {
  return getActiveEmployees()
}

export async function actionUpdateStatus(
  employeeId: string,
  month: number,
  year: number,
  status: 'draft' | 'approved' | 'paid'
) {
  await updatePayrollStatus(employeeId, month, year, status)
  revalidatePath('/hr/payroll')
}

export async function actionBulkApprove(month: number, year: number) {
  await bulkUpdatePayrollStatus(month, year, 'approved')
  revalidatePath('/hr/payroll')
}

export async function actionBulkMarkPaid(month: number, year: number) {
  await bulkUpdatePayrollStatus(month, year, 'paid')
  revalidatePath('/hr/payroll')
}
