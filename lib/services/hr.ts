import { createClient } from '@/lib/supabase/client'
import type {
  EmployeeProfile,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  PerformanceReview,
  OnboardingTask,
  AssetAssignment,
} from '@/types/hr'


// ============================================================================
// EMPLOYEE MANAGEMENT
// ============================================================================

export async function getEmployees() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_active', true)
    .order('first_name')

  if (error) throw error
  return data as EmployeeProfile[]
}

export async function getEmployeeById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EmployeeProfile
}

export async function updateEmployee(id: string, updates: Partial<EmployeeProfile>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  
  // Log to audit
  await logAudit('UPDATE', 'profiles', id, null, updates)
  
  return data as EmployeeProfile
}

export async function generateEmployeeId() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('employee_id')
    .order('employee_id', { ascending: false })
    .limit(1)

  if (error) throw error

  let nextNum = 1
  if (data && data.length > 0 && data[0].employee_id) {
    const lastId = data[0].employee_id
    const num = parseInt(lastId.replace('EMP-', ''))
    nextNum = num + 1
  }

  return `EMP-${String(nextNum).padStart(4, '0')}`
}

// ============================================================================
// ATTENDANCE MANAGEMENT
// ============================================================================

export async function getAttendanceByEmployee(employeeId: string, month?: number, year?: number) {
  const supabase = createClient()
  let query = supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (month && year) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AttendanceRecord[]
}

export async function clockIn(employeeId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (existing) {
    throw new Error('Already clocked in today')
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: employeeId,
      date: today,
      clock_in: new Date().toISOString(),
      status: 'present',
    })
    .select()
    .single()

  if (error) throw error
  return data as AttendanceRecord
}

export async function clockOut(employeeId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing, error: fetchError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single()

  if (fetchError) throw new Error('No clock in record found')

  const clockOut = new Date()
  const clockIn = new Date(existing.clock_in)
  const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)

  const { data, error } = await supabase
    .from('attendance')
    .update({
      clock_out: clockOut.toISOString(),
      total_hours: totalHours,
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw error
  return data as AttendanceRecord
}

export async function recordAttendance(employeeId: string, date: string, status: string, notes?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      employee_id: employeeId,
      date,
      status,
      notes,
    }, { onConflict: 'employee_id,date' })
    .select()
    .single()

  if (error) throw error
  return data as AttendanceRecord
}

// ============================================================================
// LEAVE MANAGEMENT
// ============================================================================

export async function getLeaveRequests(employeeId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('leave_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as LeaveRequest[]
}

export async function requestLeave(employeeId: string, leaveData: any) {
  const supabase = createClient()
  const { start_date, end_date, leave_type_id, reason } = leaveData
  
  const startDate = new Date(start_date)
  const endDate = new Date(end_date)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employeeId,
      leave_type_id,
      start_date,
      end_date,
      days_requested: days,
      reason,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as LeaveRequest
}

export async function approveLeaveRequest(requestId: string, managerId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'manager_approved',
      manager_id: managerId,
      manager_approved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as LeaveRequest
}

export async function rejectLeaveRequest(requestId: string, rejectedBy: string, reason: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      rejected_by: rejectedBy,
      rejected_reason: reason,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as LeaveRequest
}

export async function getLeaveBalance(employeeId: string, year: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)

  if (error) throw error
  return data
}

// ============================================================================
// PAYROLL MANAGEMENT
// ============================================================================

export async function getPayroll(employeeId: string, month: number, year: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('period_month', month)
    .eq('period_year', year)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as PayrollRecord | null
}

export async function generatePayroll(employeeId: string, month: number, year: number, payrollData: any) {
  const supabase = createClient()
  const employee = await getEmployeeById(employeeId)
  
  const existing = await getPayroll(employeeId, month, year)
  if (existing) throw new Error('Payroll already generated for this period')

  const commissionAmount = await getCommissionForPeriod(employeeId, month, year)

  const { data, error } = await supabase
    .from('payroll')
    .insert({
      employee_id: employeeId,
      period_month: month,
      period_year: year,
      basic_salary: employee.basic_salary,
      allowances: employee.allowances,
      bonuses: payrollData.bonuses || 0,
      commission_amount: commissionAmount,
      deductions: payrollData.deductions || 0,
      tax: payrollData.tax || 0,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw error
  return data as PayrollRecord
}

export async function approvePayroll(payrollId: string, approvedBy: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payroll')
    .update({
      status: 'approved',
      approved_by: approvedBy,
    })
    .eq('id', payrollId)
    .select()
    .single()

  if (error) throw error
  return data as PayrollRecord
}

// ============================================================================
// PERFORMANCE MANAGEMENT
// ============================================================================

export async function getPerformanceReviews(employeeId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('performance_reviews')
    .select('*')
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PerformanceReview[]
}

export async function createPerformanceReview(reviewData: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('performance_reviews')
    .insert(reviewData)
    .select()
    .single()

  if (error) throw error
  return data as PerformanceReview
}

// ============================================================================
// ONBOARDING MANAGEMENT
// ============================================================================

export async function getOnboardingTasks(employeeId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('employee_id', employeeId)
    .order('category')

  if (error) throw error
  return data as OnboardingTask[]
}

export async function completeOnboardingTask(taskId: string, completedBy: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .update({
      is_completed: true,
      completed_by: completedBy,
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data as OnboardingTask
}

// ============================================================================
// ASSET MANAGEMENT
// ============================================================================

export async function assignAsset(assetId: string, employeeId: string, issuedDate: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('asset_assignments')
    .insert({
      asset_id: assetId,
      employee_id: employeeId,
      issued_date: issuedDate,
      condition_on_issue: 'good',
    })
    .select()
    .single()

  if (error) throw error

  // Update asset assigned status
  await supabase.from('assets').update({ is_assigned: true }).eq('id', assetId)

  return data as AssetAssignment
}

export async function returnAsset(assignmentId: string, returnDate: string) {
  const supabase = createClient()
  const { data: assignment, error: fetchError } = await supabase
    .from('asset_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (fetchError) throw fetchError

  const { data, error } = await supabase
    .from('asset_assignments')
    .update({
      return_date: returnDate,
    })
    .eq('id', assignmentId)
    .select()
    .single()

  if (error) throw error

  // Update asset assigned status
  await supabase.from('assets').update({ is_assigned: false }).eq('id', assignment.asset_id)

  return data as AssetAssignment
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCommissionForPeriod(employeeId: string, month: number, year: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('commissions')
    .select('commission_amount')
    .eq('agent_id', employeeId)
    .eq('period_month', month)
    .eq('period_year', year)

  if (error) throw error
  
  return data?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0
}

export async function logAudit(action: string, tableName: string, recordId: string | null, oldValues: any, newValues: any) {
  const supabase = createClient()
  const { error } = await supabase
    .from('hr_audit_log')
    .insert({
      action,
      table_name: tableName,
      record_id: recordId,
      performed_by: null,
      old_values: oldValues,
      new_values: newValues,
    })

  if (error) console.error('Audit log error:', error)
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export async function getHRDashboardStats() {
  const supabase = createClient()
  const [employees, activeEmployees, leaveRequests, payrollRecords] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payroll').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ])

  return {
    totalEmployees: employees.count || 0,
    activeEmployees: activeEmployees.count || 0,
    pendingLeaveRequests: leaveRequests.count || 0,
    draftPayrolls: payrollRecords.count || 0,
  }
}
