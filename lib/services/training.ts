import { createClient } from '@/lib/supabase/client'
import type {
  TrainingCourse,
  TrainingAssignment,
  TrainingKPIs,
  TrainingFilters,
  TrainingModule,
  CourseStatus,
} from '@/types/hr'

// ============================================================================
// COURSES — CRUD
// ============================================================================

export async function getCourses(filters?: Partial<TrainingFilters>) {
  const supabase = createClient()
  let query = supabase
    .from('training_courses')
    .select('*')
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.department && filters.department !== 'all') {
    query = query.eq('department', filters.department)
  }
  if (filters?.difficulty && filters.difficulty !== 'all') {
    query = query.eq('difficulty', filters.difficulty)
  }
  if (filters?.mandatory === 'mandatory') {
    query = query.eq('is_mandatory', true)
  } else if (filters?.mandatory === 'optional') {
    query = query.eq('is_mandatory', false)
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,instructor_name.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingCourse[]
}

export async function getCourseById(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as TrainingCourse
}

export async function createCourse(course: Partial<TrainingCourse>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_courses')
    .insert([course])
    .select()
    .single()

  if (error) throw error
  return data as TrainingCourse
}

export async function updateCourse(id: string, updates: Partial<TrainingCourse>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_courses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingCourse
}

export async function deleteCourse(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('training_courses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function duplicateCourse(id: string) {
  const course = await getCourseById(id)
  const { id: _id, created_at, updated_at, enrollment_count, completion_count, rating, rating_count, ...rest } = course
  return createCourse({
    ...rest,
    title: `${rest.title} (Copy)`,
    status: 'draft' as CourseStatus,
    enrollment_count: 0,
    completion_count: 0,
    rating: 0,
    rating_count: 0,
  })
}

// ============================================================================
// MODULES — CRUD
// ============================================================================

export async function getModules(courseId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data || []) as TrainingModule[]
}

export async function createModule(mod: Partial<TrainingModule>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_modules')
    .insert([mod])
    .select()
    .single()

  if (error) throw error
  return data as TrainingModule
}

export async function updateModule(id: string, updates: Partial<TrainingModule>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingModule
}

export async function deleteModule(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('training_modules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// KPIs
// ============================================================================

export async function getTrainingKPIs(): Promise<TrainingKPIs> {
  const supabase = createClient()

  const [coursesRes, enrollmentsRes, certsRes, sessionsRes, nonCompliantRes] = await Promise.all([
    supabase.from('training_courses').select('id, status, is_active'),
    supabase.from('training_assignments').select('id, status, score, expiry_date'),
    supabase.from('training_certificates').select('id, status, expires_at'),
    supabase.from('training_sessions').select('id, start_time, status').gte('start_time', new Date().toISOString()).eq('status', 'scheduled'),
    supabase.from('employee_learning_paths').select('id, is_compliant').eq('is_compliant', false),
  ])

  const courses = coursesRes.data || []
  const enrollments = enrollmentsRes.data || []
  const certs = certsRes.data || []
  const sessions = sessionsRes.data || []
  const nonCompliant = nonCompliantRes.data || []

  const totalCourses = courses.length
  const activeCourses = courses.filter((c: any) => c.status === 'active').length
  const totalEnrollments = enrollments.length
  const completed = enrollments.filter((e: any) => e.status === 'completed').length
  const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0
  const certificatesIssued = certs.filter((c: any) => c.status === 'active').length

  const now = new Date()
  const overdueTraining = enrollments.filter((e: any) => {
    if (e.status === 'completed') return false
    return e.expiry_date && new Date(e.expiry_date) < now
  }).length

  const scores = enrollments.filter((e: any) => e.score != null).map((e: any) => e.score)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiringCerts = certs.filter((c: any) => {
    if (c.status !== 'active' || !c.expires_at) return false
    const exp = new Date(c.expires_at)
    return exp > now && exp <= thirtyDaysFromNow
  }).length

  return {
    totalCourses,
    activeCourses,
    totalEnrollments,
    completionRate,
    certificatesIssued,
    overdueTraining,
    upcomingSessions: sessions.length,
    avgAssessmentScore: avgScore,
    expiringCerts,
    nonCompliantEmployees: nonCompliant.length,
  }
}

// ============================================================================
// CHART DATA
// ============================================================================

export async function getMonthlyCompletions() {
  const supabase = createClient()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data } = await supabase
    .from('training_assignments')
    .select('completed_date')
    .eq('status', 'completed')
    .gte('completed_date', sixMonthsAgo.toISOString().split('T')[0])

  const months: Record<string, number> = {}
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months[monthNames[d.getMonth()]] = 0
  }

  ;(data || []).forEach((r: any) => {
    if (r.completed_date) {
      const d = new Date(r.completed_date)
      const name = monthNames[d.getMonth()]
      if (name in months) months[name]++
    }
  })

  return Object.entries(months).map(([name, completions]) => ({ name, completions }))
}

export async function getDepartmentParticipation() {
  const supabase = createClient()
  const { data } = await supabase
    .from('training_assignments')
    .select('employee_id, status')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, department')
    .eq('is_active', true)

  const deptMap: Record<string, { enrolled: number; completed: number }> = {}
  const profileDept: Record<string, string> = {}

  ;(profiles || []).forEach((p: any) => {
    profileDept[p.id] = p.department || 'Other'
  })

  ;(data || []).forEach((a: any) => {
    const dept = profileDept[a.employee_id] || 'Other'
    if (!deptMap[dept]) deptMap[dept] = { enrolled: 0, completed: 0 }
    deptMap[dept].enrolled++
    if (a.status === 'completed') deptMap[dept].completed++
  })

  return Object.entries(deptMap).map(([name, stats]) => ({
    name,
    ...stats,
    rate: stats.enrolled > 0 ? Math.round((stats.completed / stats.enrolled) * 100) : 0,
  }))
}
