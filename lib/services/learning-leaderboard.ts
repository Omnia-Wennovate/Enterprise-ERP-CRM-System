import { createClient } from '@/lib/supabase/client'
import type { LeaderboardEntry } from '@/types/hr'

export async function getCompanyLeaderboard(quarter?: number, year?: number): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  // Get all completed assignments with learning hours
  let query = supabase
    .from('training_assignments')
    .select('employee_id, learning_hours, score, status')
    .eq('status', 'completed')

  if (quarter && year) {
    const startMonth = (quarter - 1) * 3
    const start = new Date(year, startMonth, 1)
    const end = new Date(year, startMonth + 3, 0, 23, 59, 59)
    query = query.gte('completed_date', start.toISOString().split('T')[0]).lte('completed_date', end.toISOString().split('T')[0])
  }

  const { data: assignments } = await query

  // Get certificates
  const { data: certs } = await supabase
    .from('training_certificates')
    .select('employee_id')
    .eq('status', 'active')

  // Get opt-outs
  const { data: optOuts } = await supabase
    .from('learning_leaderboard_opt_out')
    .select('employee_id')
    .eq('opted_out', true)

  const optOutIds = new Set((optOuts || []).map((o: any) => o.employee_id))

  // Get profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, department, avatar_url')
    .eq('is_active', true)

  const profileMap: Record<string, any> = {}
  ;(profiles || []).forEach((p: any) => { profileMap[p.id] = p })

  // Aggregate stats per employee
  const stats: Record<string, {
    learning_hours: number
    courses_completed: number
    scores: number[]
  }> = {}

  ;(assignments || []).forEach((a: any) => {
    if (!stats[a.employee_id]) {
      stats[a.employee_id] = { learning_hours: 0, courses_completed: 0, scores: [] }
    }
    stats[a.employee_id].learning_hours += a.learning_hours || 0
    stats[a.employee_id].courses_completed++
    if (a.score != null) stats[a.employee_id].scores.push(a.score)
  })

  // Count certs per employee
  const certCount: Record<string, number> = {}
  ;(certs || []).forEach((c: any) => {
    certCount[c.employee_id] = (certCount[c.employee_id] || 0) + 1
  })

  // Build leaderboard
  const entries: LeaderboardEntry[] = []
  for (const [empId, s] of Object.entries(stats)) {
    if (optOutIds.has(empId)) continue
    const profile = profileMap[empId]
    if (!profile) continue

    entries.push({
      employee_id: empId,
      employee_name: `${profile.first_name} ${profile.last_name}`,
      department: profile.department || 'Other',
      avatar_url: profile.avatar_url,
      learning_hours: Math.round(s.learning_hours * 10) / 10,
      courses_completed: s.courses_completed,
      certificates_earned: certCount[empId] || 0,
      avg_score: s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length) : 0,
      rank: 0,
    })
  }

  // Sort by learning hours, then courses completed
  entries.sort((a, b) => b.learning_hours - a.learning_hours || b.courses_completed - a.courses_completed)
  entries.forEach((e, i) => { e.rank = i + 1 })

  return entries
}

export async function getDepartmentLeaderboard(department: string) {
  const all = await getCompanyLeaderboard()
  const filtered = all.filter(e => e.department === department)
  filtered.forEach((e, i) => { e.rank = i + 1 })
  return filtered
}

export async function toggleOptOut(employeeId: string, optedOut: boolean) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('learning_leaderboard_opt_out')
    .upsert({
      employee_id: employeeId,
      opted_out: optedOut,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employee_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function isOptedOut(employeeId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('learning_leaderboard_opt_out')
    .select('opted_out')
    .eq('employee_id', employeeId)
    .single()

  return data?.opted_out || false
}
