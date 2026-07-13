import { createClient } from '@/lib/supabase/client'
import type { WeeklyContentPlan, WeeklyPlanStatus } from '@/types/marketing'


// ============================================================================
// WEEKLY CONTENT PLANS CRUD
// ============================================================================

export async function getWeeklyPlans(weekStartDate?: string) {
  const supabase = createClient()
  let query = supabase
    .from('weekly_content_plans')
    .select('*')
    .order('week_start_date', { ascending: false })

  if (weekStartDate) {
    query = query.eq('week_start_date', weekStartDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data as WeeklyContentPlan[]
}

export async function getWeeklyPlansByWeek(weekStartDate: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .select('*')
    .eq('week_start_date', weekStartDate)
    .order('day_of_week', { ascending: true })

  if (error) throw error
  return data as WeeklyContentPlan[]
}

export async function createWeeklyPlan(plan: Partial<WeeklyContentPlan>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .insert(plan)
    .select()
    .single()

  if (error) throw error
  return data as WeeklyContentPlan
}

export async function createBulkWeeklyPlans(plans: Partial<WeeklyContentPlan>[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .insert(plans)
    .select()

  if (error) throw error
  return data as WeeklyContentPlan[]
}

export async function updateWeeklyPlan(id: string, updates: Partial<WeeklyContentPlan>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as WeeklyContentPlan
}

export async function deleteWeeklyPlan(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('weekly_content_plans')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateWeeklyPlanStatus(id: string, status: WeeklyPlanStatus) {
  const supabase = createClient()
  return updateWeeklyPlan(id, { status })
}

export async function getWeeklyPlanCountsByStatus(weekStartDate: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .select('status')
    .eq('week_start_date', weekStartDate)

  if (error) throw error

  const counts: Record<string, number> = {}
  ;(data || []).forEach(p => {
    counts[p.status] = (counts[p.status] || 0) + 1
  })
  return counts
}

export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getWeekDates(weekStartDate: string): { day: string; date: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const start = new Date(weekStartDate)

  return days.map((day, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return { day, date: d.toISOString().split('T')[0] }
  })
}
