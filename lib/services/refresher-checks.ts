import { createClient } from '@/lib/supabase/client'
import type { TrainingRefresherCheck } from '@/types/hr'

export async function scheduleRefresher(employeeId: string, courseId: string) {
  const supabase = createClient()
  const now = new Date()

  // Schedule at 7 days and 30 days
  const sevenDays = new Date(now)
  sevenDays.setDate(sevenDays.getDate() + 7)

  const thirtyDays = new Date(now)
  thirtyDays.setDate(thirtyDays.getDate() + 30)

  const { error } = await supabase
    .from('training_refresher_checks')
    .insert([
      {
        employee_id: employeeId,
        course_id: courseId,
        scheduled_for: sevenDays.toISOString(),
        status: 'pending',
      },
      {
        employee_id: employeeId,
        course_id: courseId,
        scheduled_for: thirtyDays.toISOString(),
        status: 'pending',
      },
    ])

  if (error) throw error
}

export async function getRefresherChecks(employeeId?: string, status?: string) {
  const supabase = createClient()
  let query = supabase
    .from('training_refresher_checks')
    .select(`
      *,
      course:training_courses(id, title, category)
    `)
    .order('scheduled_for', { ascending: true })

  if (employeeId) query = query.eq('employee_id', employeeId)
  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingRefresherCheck[]
}

export async function respondToRefresher(id: string, response: 'confident' | 'needs_refresher') {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_refresher_checks')
    .update({
      status: response,
      response,
      responded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingRefresherCheck
}

export async function getPendingRefreshers(employeeId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_refresher_checks')
    .select(`
      *,
      course:training_courses(id, title, category)
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())

  if (error) throw error
  return (data || []) as TrainingRefresherCheck[]
}
