import { createClient } from '@/lib/supabase/client'
import type { TrainingAssignment, EnrollmentStatus } from '@/types/hr'

// ============================================================================
// ENROLLMENT CRUD
// ============================================================================

export async function getEnrollments(courseId?: string, employeeId?: string) {
  const supabase = createClient()
  let query = supabase
    .from('training_assignments')
    .select(`
      *,
      course:training_courses(id, title, category, duration_hours, difficulty),
      employee:profiles(id, first_name, last_name, department, position, avatar_url)
    `)
    .order('created_at', { ascending: false })

  if (courseId) query = query.eq('course_id', courseId)
  if (employeeId) query = query.eq('employee_id', employeeId)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingAssignment[]
}

export async function enrollEmployee(employeeId: string, courseId: string, assignedBy?: string) {
  const supabase = createClient()

  // Check if already enrolled
  const { data: existing } = await supabase
    .from('training_assignments')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('course_id', courseId)
    .in('status', ['assigned', 'in_progress'])
    .single()

  if (existing) throw new Error('Employee is already enrolled in this course')

  const { data, error } = await supabase
    .from('training_assignments')
    .insert([{
      employee_id: employeeId,
      course_id: courseId,
      assigned_date: new Date().toISOString().split('T')[0],
      status: 'assigned',
      assigned_by: assignedBy,
      progress_percent: 0,
      learning_hours: 0,
      completed_modules: 0,
    }])
    .select()
    .single()

  if (error) throw error

  // Increment enrollment count on course
  await supabase.rpc('increment_enrollment_count', { course_uuid: courseId }).catch(() => {
    // If RPC doesn't exist, do manual update
    supabase.from('training_courses')
      .select('enrollment_count')
      .eq('id', courseId)
      .single()
      .then(({ data: course }) => {
        if (course) {
          supabase.from('training_courses')
            .update({ enrollment_count: (course.enrollment_count || 0) + 1 })
            .eq('id', courseId)
        }
      })
  })

  return data as TrainingAssignment
}

export async function bulkEnroll(employeeIds: string[], courseId: string, assignedBy?: string) {
  const results: { success: string[]; failed: string[] } = { success: [], failed: [] }

  for (const empId of employeeIds) {
    try {
      await enrollEmployee(empId, courseId, assignedBy)
      results.success.push(empId)
    } catch {
      results.failed.push(empId)
    }
  }

  return results
}

export async function enrollDepartment(department: string, courseId: string, assignedBy?: string) {
  const supabase = createClient()
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('department', department)
    .eq('is_active', true)

  if (!employees?.length) return { success: [], failed: [] }
  return bulkEnroll(employees.map((e: any) => e.id), courseId, assignedBy)
}

export async function updateEnrollment(id: string, updates: Partial<TrainingAssignment>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_assignments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingAssignment
}

export async function updateProgress(id: string, progressPercent: number, completedModules: number) {
  const updates: Partial<TrainingAssignment> = {
    progress_percent: progressPercent,
    completed_modules: completedModules,
    last_accessed_at: new Date().toISOString(),
  }

  if (progressPercent > 0 && !updates.started_at) {
    updates.started_at = new Date().toISOString()
    updates.status = 'in_progress' as EnrollmentStatus
  }

  if (progressPercent >= 100) {
    updates.status = 'completed' as EnrollmentStatus
    updates.completed_date = new Date().toISOString().split('T')[0]
  }

  return updateEnrollment(id, updates)
}

export async function completeEnrollment(id: string, score?: number) {
  const supabase = createClient()
  const { data: assignment } = await supabase
    .from('training_assignments')
    .select('course_id')
    .eq('id', id)
    .single()

  const result = await updateEnrollment(id, {
    status: 'completed' as EnrollmentStatus,
    progress_percent: 100,
    completed_date: new Date().toISOString().split('T')[0],
    score,
  })

  // Increment completion count
  if (assignment?.course_id) {
    const { data: course } = await supabase
      .from('training_courses')
      .select('completion_count')
      .eq('id', assignment.course_id)
      .single()

    if (course) {
      await supabase
        .from('training_courses')
        .update({ completion_count: (course.completion_count || 0) + 1 })
        .eq('id', assignment.course_id)
    }
  }

  return result
}

export async function deleteEnrollment(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('training_assignments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getEmployeeLearningStats(employeeId: string) {
  const supabase = createClient()

  const [enrollmentsRes, certsRes] = await Promise.all([
    supabase.from('training_assignments').select('*').eq('employee_id', employeeId),
    supabase.from('training_certificates').select('*').eq('employee_id', employeeId),
  ])

  const enrollments = enrollmentsRes.data || []
  const certs = certsRes.data || []

  return {
    totalCourses: enrollments.length,
    completed: enrollments.filter((e: any) => e.status === 'completed').length,
    inProgress: enrollments.filter((e: any) => e.status === 'in_progress').length,
    totalHours: enrollments.reduce((sum: number, e: any) => sum + (e.learning_hours || 0), 0),
    avgScore: (() => {
      const scores = enrollments.filter((e: any) => e.score != null).map((e: any) => e.score)
      return scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    })(),
    certificates: certs.length,
    activeCerts: certs.filter((c: any) => c.status === 'active').length,
  }
}
