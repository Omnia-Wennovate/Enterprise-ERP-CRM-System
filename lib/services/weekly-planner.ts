import { createClient } from '@/lib/supabase/client'
import type { WeeklyContentPlan, WeeklyPlanStatus, ContentBacklogItem } from '@/types/marketing'


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

export async function deleteWeeklyPlansByIds(ids: string[]) {
  if (ids.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('weekly_content_plans')
    .delete()
    .in('id', ids)

  if (error) throw error
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

export async function getWeeklyPlansForWeeks(weekStartDates: string[]) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_content_plans')
    .select('*')
    .in('week_start_date', weekStartDates)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as WeeklyContentPlan[]
}

// ============================================================================
// CALENDAR NOTES (one per cycle, keyed by the cycle's first Monday)
// ============================================================================

export async function getPlannerNotes(weekStartDate: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('weekly_planner_notes')
    .select('notes')
    .eq('week_start_date', weekStartDate)
    .maybeSingle()

  if (error) throw error
  return data?.notes ?? ''
}

export async function savePlannerNotes(weekStartDate: string, notes: string, updatedBy?: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('weekly_planner_notes')
    .upsert({
      week_start_date: weekStartDate,
      notes,
      updated_by: updatedBy ?? null,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

// ============================================================================
// CONTENT BACKLOG (leftover contents)
// ============================================================================

export async function getContentBacklog() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_backlog')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as ContentBacklogItem[]
}

export async function createBacklogItem(item: Partial<ContentBacklogItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_backlog')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data as ContentBacklogItem
}

export async function createBacklogItems(items: Partial<ContentBacklogItem>[]) {
  if (items.length === 0) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_backlog')
    .insert(items)
    .select()

  if (error) throw error
  return data as ContentBacklogItem[]
}

export async function deleteBacklogItemsByIds(ids: string[]) {
  if (ids.length === 0) return
  const supabase = createClient()
  const { error } = await supabase
    .from('content_backlog')
    .delete()
    .in('id', ids)

  if (error) throw error
}

export async function updateBacklogItem(id: string, updates: Partial<ContentBacklogItem>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_backlog')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ContentBacklogItem
}

export async function deleteBacklogItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('content_backlog')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// DATE HELPERS — all dates are local 'YYYY-MM-DD' keys (no UTC shifting)
// ============================================================================

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  return toDateKey(d)
}

export function getWeekDates(weekStartDate: string): { day: string; date: string }[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  return days.map((day, i) => ({ day, date: addDays(weekStartDate, i) }))
}
