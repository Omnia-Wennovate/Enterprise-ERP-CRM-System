import { createClient } from '@/lib/supabase/client'
import type { TrainingSession } from '@/types/hr'

export async function getSessions(filters?: { month?: number; year?: number; department?: string; courseId?: string }) {
  const supabase = createClient()
  let query = supabase
    .from('training_sessions')
    .select(`
      *,
      course:training_courses(id, title, category)
    `)
    .order('start_time', { ascending: true })

  if (filters?.month && filters?.year) {
    const start = new Date(filters.year, filters.month - 1, 1)
    const end = new Date(filters.year, filters.month, 0, 23, 59, 59)
    query = query.gte('start_time', start.toISOString()).lte('start_time', end.toISOString())
  }
  if (filters?.department) query = query.eq('department', filters.department)
  if (filters?.courseId) query = query.eq('course_id', filters.courseId)

  const { data, error } = await query
  if (error) throw error
  return (data || []) as TrainingSession[]
}

export async function createSession(session: Partial<TrainingSession>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .insert([session])
    .select()
    .single()

  if (error) throw error
  return data as TrainingSession
}

export async function updateSession(id: string, updates: Partial<TrainingSession>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as TrainingSession
}

export async function deleteSession(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('training_sessions').delete().eq('id', id)
  if (error) throw error
}

export async function registerForSession(sessionId: string, employeeId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_session_attendees')
    .insert([{ session_id: sessionId, employee_id: employeeId, status: 'registered' }])
    .select()
    .single()

  if (error) throw error

  // Update attendee count
  const { data: session } = await supabase
    .from('training_sessions')
    .select('current_attendees')
    .eq('id', sessionId)
    .single()

  if (session) {
    await supabase
      .from('training_sessions')
      .update({ current_attendees: (session.current_attendees || 0) + 1 })
      .eq('id', sessionId)
  }

  return data
}

export async function getSessionAttendees(sessionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_session_attendees')
    .select(`
      *,
      employee:profiles(id, first_name, last_name, department, avatar_url)
    `)
    .eq('session_id', sessionId)

  if (error) throw error
  return data || []
}

export async function getUpcomingSessions(limit: number = 5) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('training_sessions')
    .select(`
      *,
      course:training_courses(id, title, category)
    `)
    .gte('start_time', new Date().toISOString())
    .eq('status', 'scheduled')
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data || []) as TrainingSession[]
}
