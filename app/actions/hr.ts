'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// EMPLOYEE ACTIONS
export async function getEmployees(filters?: { search?: string; status?: string }) {
  try {
    let query = supabase.from('profiles').select('*').eq('role', 'sales_agent')

    if (filters?.search) {
      query = query.ilike('full_name', `%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('employment_status', filters.status)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching employees:', error)
    throw error
  }
}

export async function getEmployee(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', employeeId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching employee:', error)
    throw error
  }
}

export async function updateEmployee(employeeId: string, updates: Record<string, any>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', employeeId)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/hr/employees')
    return data
  } catch (error) {
    console.error('Error updating employee:', error)
    throw error
  }
}

// ATTENDANCE ACTIONS
export async function getAttendance(filters?: { employeeId?: string; startDate?: string; endDate?: string }) {
  try {
    let query = supabase.from('attendance').select('*')

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId)
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching attendance:', error)
    throw error
  }
}

export async function recordAttendance(employeeId: string, date: string, clockIn?: string, clockOut?: string) {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          employee_id: employeeId,
          date,
          clock_in: clockIn,
          clock_out: clockOut,
          status: 'present'
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/attendance')
    return data?.[0]
  } catch (error) {
    console.error('Error recording attendance:', error)
    throw error
  }
}

// LEAVE ACTIONS
export async function getLeaveRequests(filters?: { status?: string; employeeId?: string }) {
  try {
    let query = supabase.from('leave_requests').select(`
      *,
      employee:profiles(full_name, id),
      leave_type:leave_types(name)
    `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    throw error
  }
}

export async function createLeaveRequest(
  employeeId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  reason: string
) {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([
        {
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          start_date: startDate,
          end_date: endDate,
          reason,
          status: 'pending'
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/leave')
    return data?.[0]
  } catch (error) {
    console.error('Error creating leave request:', error)
    throw error
  }
}

export async function approveLeaveRequest(leaveRequestId: string, managerId: string) {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        manager_id: managerId,
        manager_approved_at: new Date().toISOString()
      })
      .eq('id', leaveRequestId)
      .select()

    if (error) throw error
    revalidatePath('/hr/leave')
    return data?.[0]
  } catch (error) {
    console.error('Error approving leave request:', error)
    throw error
  }
}

export async function rejectLeaveRequest(leaveRequestId: string, reason: string) {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejected_reason: reason
      })
      .eq('id', leaveRequestId)
      .select()

    if (error) throw error
    revalidatePath('/hr/leave')
    return data?.[0]
  } catch (error) {
    console.error('Error rejecting leave request:', error)
    throw error
  }
}

// PAYROLL ACTIONS
export async function getPayroll(filters?: { month?: number; year?: number; employeeId?: string }) {
  try {
    let query = supabase.from('payroll').select(`
      *,
      employee:profiles(full_name, employee_id)
    `)

    if (filters?.month) {
      query = query.eq('period_month', filters.month)
    }

    if (filters?.year) {
      query = query.eq('period_year', filters.year)
    }

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching payroll:', error)
    throw error
  }
}

export async function createPayroll(
  employeeId: string,
  month: number,
  year: number,
  basicSalary: number,
  allowances: number = 0,
  bonuses: number = 0,
  commission: number = 0,
  deductions: number = 0,
  tax: number = 0
) {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .insert([
        {
          employee_id: employeeId,
          period_month: month,
          period_year: year,
          basic_salary: basicSalary,
          allowances,
          bonuses,
          commission_amount: commission,
          deductions,
          tax,
          status: 'draft'
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/payroll')
    return data?.[0]
  } catch (error) {
    console.error('Error creating payroll:', error)
    throw error
  }
}

export async function approvePayroll(payrollId: string, approvedBy: string) {
  try {
    const { data, error } = await supabase
      .from('payroll')
      .update({
        status: 'approved',
        approved_by: approvedBy
      })
      .eq('id', payrollId)
      .select()

    if (error) throw error
    revalidatePath('/hr/payroll')
    return data?.[0]
  } catch (error) {
    console.error('Error approving payroll:', error)
    throw error
  }
}

// PERFORMANCE REVIEW ACTIONS
export async function getPerformanceReviews(filters?: { employeeId?: string; year?: number }) {
  try {
    let query = supabase.from('performance_reviews').select(`
      *,
      employee:profiles(full_name),
      reviewer:profiles(full_name)
    `)

    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId)
    }

    if (filters?.year) {
      query = query.eq('period_year', filters.year)
    }

    const { data, error } = await query.order('period_year', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching performance reviews:', error)
    throw error
  }
}

export async function createPerformanceReview(
  employeeId: string,
  reviewerId: string,
  year: number,
  month: number,
  kpiScore: number,
  targetScore: number,
  notes: string
) {
  try {
    const achievementPercent = (kpiScore / targetScore) * 100

    const { data, error } = await supabase
      .from('performance_reviews')
      .insert([
        {
          employee_id: employeeId,
          reviewer_id: reviewerId,
          period_year: year,
          period_month: month,
          kpi_score: kpiScore,
          target_score: targetScore,
          achievement_percent: achievementPercent,
          manager_notes: notes,
          status: 'pending'
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/performance')
    return data?.[0]
  } catch (error) {
    console.error('Error creating performance review:', error)
    throw error
  }
}

// ONBOARDING ACTIONS
export async function getOnboardingTasks(employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('employee_id', employeeId)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching onboarding tasks:', error)
    throw error
  }
}

export async function toggleOnboardingTask(taskId: string, isCompleted: boolean) {
  try {
    const { data, error } = await supabase
      .from('onboarding_tasks')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', taskId)
      .select()

    if (error) throw error
    revalidatePath('/hr/onboarding')
    return data?.[0]
  } catch (error) {
    console.error('Error toggling onboarding task:', error)
    throw error
  }
}

// TRAINING ACTIONS
export async function getTrainingCourses() {
  try {
    const { data, error } = await supabase
      .from('training_courses')
      .select('*')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching training courses:', error)
    throw error
  }
}

export async function assignTraining(employeeId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('training_assignments')
      .insert([
        {
          employee_id: employeeId,
          course_id: courseId,
          status: 'assigned'
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/training')
    return data?.[0]
  } catch (error) {
    console.error('Error assigning training:', error)
    throw error
  }
}

// ASSET ACTIONS
export async function getAssets() {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('*')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching assets:', error)
    throw error
  }
}

export async function assignAsset(assetId: string, employeeId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_assignments')
      .insert([
        {
          asset_id: assetId,
          employee_id: employeeId,
          issued_date: new Date().toISOString().split('T')[0]
        }
      ])
      .select()

    if (error) throw error
    revalidatePath('/hr/assets')
    return data?.[0]
  } catch (error) {
    console.error('Error assigning asset:', error)
    throw error
  }
}
