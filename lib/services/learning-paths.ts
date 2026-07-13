import { createClient } from '@/lib/supabase/client'
import type { LearningPath, LearningPathCourse, EmployeeLearningPath } from '@/types/hr'

export async function getLearningPaths() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_paths')
    .select(`
      *,
      courses:learning_path_courses(
        id, sort_order, course_id,
        course:training_courses(id, title, duration_hours, category, difficulty)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as LearningPath[]
}

export async function createLearningPath(path: Partial<LearningPath>, courseIds: string[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_paths')
    .insert([{ ...path, course_count: courseIds.length }])
    .select()
    .single()

  if (error) throw error

  // Add courses in order
  if (courseIds.length > 0) {
    const rows = courseIds.map((cid, i) => ({
      learning_path_id: data.id,
      course_id: cid,
      sort_order: i,
    }))
    await supabase.from('learning_path_courses').insert(rows)
  }

  return data as LearningPath
}

export async function updateLearningPath(id: string, updates: Partial<LearningPath>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_paths')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as LearningPath
}

export async function deleteLearningPath(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('learning_paths').delete().eq('id', id)
  if (error) throw error
}

export async function assignPathToEmployee(employeeId: string, pathId: string) {
  const supabase = createClient()

  // Check if already assigned
  const { data: existing } = await supabase
    .from('employee_learning_paths')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('learning_path_id', pathId)
    .single()

  if (existing) throw new Error('Path already assigned')

  const { data, error } = await supabase
    .from('employee_learning_paths')
    .insert([{
      employee_id: employeeId,
      learning_path_id: pathId,
      current_course_index: 0,
      is_compliant: false,
    }])
    .select()
    .single()

  if (error) throw error

  // Auto-enroll in first course
  const { data: pathCourses } = await supabase
    .from('learning_path_courses')
    .select('course_id')
    .eq('learning_path_id', pathId)
    .order('sort_order')
    .limit(1)

  if (pathCourses?.length) {
    const { enrollEmployee } = await import('@/lib/services/enrollments')
    try {
      await enrollEmployee(employeeId, pathCourses[0].course_id)
    } catch {
      // Already enrolled — ignore
    }
  }

  return data as EmployeeLearningPath
}

export async function advancePathProgress(employeeId: string, completedCourseId: string) {
  const supabase = createClient()

  // Find all paths this employee is on
  const { data: empPaths } = await supabase
    .from('employee_learning_paths')
    .select(`
      *,
      learning_path:learning_paths(
        id, name,
        courses:learning_path_courses(id, course_id, sort_order)
      )
    `)
    .eq('employee_id', employeeId)
    .eq('is_compliant', false)

  if (!empPaths?.length) return

  for (const ep of empPaths) {
    const pathCourses = (ep.learning_path?.courses || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
    const currentIdx = ep.current_course_index

    if (currentIdx >= pathCourses.length) continue

    const currentCourse = pathCourses[currentIdx]
    if (currentCourse.course_id !== completedCourseId) continue

    const nextIdx = currentIdx + 1

    if (nextIdx >= pathCourses.length) {
      // Path complete!
      await supabase
        .from('employee_learning_paths')
        .update({
          current_course_index: nextIdx,
          is_compliant: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', ep.id)
    } else {
      // Advance and auto-enroll in next course
      await supabase
        .from('employee_learning_paths')
        .update({ current_course_index: nextIdx })
        .eq('id', ep.id)

      const nextCourse = pathCourses[nextIdx]
      const { enrollEmployee } = await import('@/lib/services/enrollments')
      try {
        await enrollEmployee(employeeId, nextCourse.course_id)
      } catch {
        // Already enrolled
      }
    }
  }
}

export async function getEmployeePaths(employeeId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('employee_learning_paths')
    .select(`
      *,
      learning_path:learning_paths(
        id, name, department, position, is_mandatory, course_count,
        courses:learning_path_courses(id, course_id, sort_order, course:training_courses(id, title))
      )
    `)
    .eq('employee_id', employeeId)

  if (error) throw error
  return (data || []) as EmployeeLearningPath[]
}

export async function getNonCompliantCount() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('employee_learning_paths')
    .select('id')
    .eq('is_compliant', false)

  if (error) throw error
  return data?.length || 0
}
